import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession, ChatMessage
from app.models.audit import AuditLog
from app.schemas.ai import (
    AskQuestionRequest, AskQuestionResponse, CitationItem,
    ExplainClauseRequest, ExplainClauseResponse, LawyerPrepResponse
)
from app.api.deps import get_current_user
from app.ai.gemini_client import gemini_client
from app.ai.vector_store import vector_store

router = APIRouter(prefix="/ai", tags=["AI Intelligence & RAG"])


def _verify_doc_access(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return doc


@router.post("/documents/{document_id}/ask", response_model=AskQuestionResponse)
def ask_document_question(
    document_id: str,
    payload: AskQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = _verify_doc_access(document_id, current_user, db)

    # 1. Manage Chat Session
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id, ChatSession.document_id == document_id).first()
    if not session:
        session = ChatSession(
            document_id=doc.id,
            user_id=current_user.id,
            title=payload.question[:50]
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Record User Message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=payload.question
    )
    db.add(user_msg)

    # 2. Vector Retrieval
    q_emb = gemini_client.get_embedding(payload.question)
    search_results = vector_store.similarity_search(db, document_id, q_emb, top_k=4)

    context_chunks = []
    citation_items: List[CitationItem] = []
    for chunk, score in search_results:
        context_chunks.append({
            "chunk_id": chunk.id,
            "section_title": chunk.section_title,
            "page_number": chunk.page_number,
            "content": chunk.content
        })
        citation_items.append(CitationItem(
            document_id=doc.id,
            chunk_id=chunk.id,
            section=chunk.section_title,
            page_number=chunk.page_number,
            text_snippet=chunk.content[:200] + ("..." if len(chunk.content) > 200 else "")
        ))

    # 3. GenAI Grounded Answer Generation
    ai_result = gemini_client.answer_question(payload.question, context_chunks)

    # 4. Record Assistant Message
    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_result.get("answer", "No answer generated."),
        citations=json.dumps([c.model_dump() for c in citation_items]),
        confidence=ai_result.get("confidence", "High"),
        related_clauses=json.dumps(ai_result.get("related_clauses", []))
    )
    db.add(asst_msg)

    # Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="AI_QUESTION_ASKED",
        details=f"Asked: '{payload.question[:60]}' on doc {doc.id}"
    )
    db.add(audit)
    db.commit()

    return AskQuestionResponse(
        answer=ai_result.get("answer", ""),
        why=ai_result.get("why", ""),
        source_citation=ai_result.get("source_citation", "Document Reference"),
        citations=citation_items,
        confidence=ai_result.get("confidence", "High"),
        related_clauses=ai_result.get("related_clauses", []),
        disclaimer=ai_result.get("disclaimer", "Informational only, not legal advice."),
        session_id=session.id
    )


@router.get("/documents/{document_id}/chat-history")
def get_chat_history(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.document_id == document_id, ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    
    results = []
    for s in sessions:
        msg_list = []
        for m in s.messages:
            cits = json.loads(m.citations) if m.citations else []
            rel = json.loads(m.related_clauses) if m.related_clauses else []
            msg_list.append({
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "citations": cits,
                "confidence": m.confidence,
                "related_clauses": rel,
                "created_at": m.created_at
            })
        results.append({
            "session_id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "messages": msg_list
        })
    return results


@router.post("/documents/{document_id}/explain-clause", response_model=ExplainClauseResponse)
def explain_clause(
    document_id: str,
    payload: ExplainClauseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    result = gemini_client.explain_clause(payload.clause_text, payload.section_ref or "Section")
    return ExplainClauseResponse(
        original_clause=result.get("original_clause", payload.clause_text),
        plain_language_explanation=result.get("plain_language_explanation", ""),
        why_it_matters=result.get("why_it_matters", ""),
        potential_implications=result.get("potential_implications", ""),
        questions_for_lawyer=result.get("questions_for_lawyer", []),
        uncertainty_statement=result.get("uncertainty_statement", "Informational reading only.")
    )


@router.get("/documents/{document_id}/prepare-lawyer", response_model=LawyerPrepResponse)
def prepare_lawyer_dossier(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = _verify_doc_access(document_id, current_user, db)
    
    # Read text from file
    content = ""
    if hasattr(doc, "file_path"):
        try:
            with open(doc.file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(30000)
        except Exception:
            pass

    brief = gemini_client.prepare_lawyer_brief(doc.title, content)
    return LawyerPrepResponse(
        document_summary=brief.get("document_summary", f"Dossier for {doc.title}"),
        key_concerns=brief.get("key_concerns", []),
        important_clauses=brief.get("important_clauses", []),
        questions_for_lawyer=brief.get("questions_for_lawyer", []),
        relevant_dates=brief.get("relevant_dates", []),
        information_user_needs_to_provide=brief.get("information_user_needs_to_provide", []),
        disclaimer=brief.get("disclaimer", "For legal consultation preparation only.")
    )
