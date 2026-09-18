import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.comparison import DocumentComparison
from app.models.audit import AuditLog
from app.schemas.comparison import CreateComparisonRequest, ComparisonResponse, ClauseDiffItem
from app.api.deps import get_current_user
from app.ai.gemini_client import gemini_client

router = APIRouter(prefix="/comparisons", tags=["Document Comparison"])


def _read_doc_text(doc: Document) -> str:
    if doc.chunks:
        return "\n\n".join([c.content for c in doc.chunks[:25]])
    try:
        with open(doc.file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read(30000)
    except Exception:
        return ""


@router.post("", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
def create_comparison(
    payload: CreateComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.doc_a_id == payload.doc_b_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot compare a document against itself. Please select two distinct contracts."
        )

    doc_a = db.query(Document).filter(Document.id == payload.doc_a_id).first()
    doc_b = db.query(Document).filter(Document.id == payload.doc_b_id).first()

    if not doc_a or not doc_b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both documents not found")

    if (doc_a.user_id != current_user.id or doc_b.user_id != current_user.id) and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to one or both documents")

    text_a = _read_doc_text(doc_a)
    text_b = _read_doc_text(doc_b)

    # AI Comparison
    comp_result = gemini_client.compare_documents(
        doc_a_title=doc_a.title,
        doc_a_text=text_a,
        doc_b_title=doc_b.title,
        doc_b_text=text_b
    )

    diff_list = comp_result.get("diff_data", [])
    takeaways = comp_result.get("key_takeaways", [])

    comparison = DocumentComparison(
        user_id=current_user.id,
        doc_a_id=doc_a.id,
        doc_b_id=doc_b.id,
        title=payload.title or f"Comparison: {doc_a.title} vs {doc_b.title}",
        status="COMPLETED",
        summary=comp_result.get("summary", "Comparison completed."),
        diff_data=json.dumps(diff_list),
        key_takeaways=json.dumps(takeaways)
    )
    db.add(comparison)

    audit = AuditLog(
        user_id=current_user.id,
        action="DOCUMENT_COMPARISON_CREATED",
        details=f"Compared '{doc_a.title}' vs '{doc_b.title}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(comparison)

    diff_items = [ClauseDiffItem(**d) for d in diff_list]

    return ComparisonResponse(
        id=comparison.id,
        user_id=comparison.user_id,
        doc_a_id=comparison.doc_a_id,
        doc_b_id=comparison.doc_b_id,
        doc_a_title=doc_a.title,
        doc_b_title=doc_b.title,
        title=comparison.title,
        status=comparison.status,
        summary=comparison.summary,
        diff_data=diff_items,
        key_takeaways=takeaways,
        created_at=comparison.created_at
    )


@router.get("", response_model=List[ComparisonResponse])
def list_comparisons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comps = (
        db.query(DocumentComparison)
        .filter(DocumentComparison.user_id == current_user.id)
        .order_by(DocumentComparison.created_at.desc())
        .all()
    )
    results = []
    for c in comps:
        diff_list = json.loads(c.diff_data) if c.diff_data else []
        takeaways = json.loads(c.key_takeaways) if c.key_takeaways else []
        diff_items = [ClauseDiffItem(**d) for d in diff_list]
        doc_a = db.query(Document).filter(Document.id == c.doc_a_id).first()
        doc_b = db.query(Document).filter(Document.id == c.doc_b_id).first()
        results.append(ComparisonResponse(
            id=c.id,
            user_id=c.user_id,
            doc_a_id=c.doc_a_id,
            doc_b_id=c.doc_b_id,
            doc_a_title=doc_a.title if doc_a else "Document A",
            doc_b_title=doc_b.title if doc_b else "Document B",
            title=c.title,
            status=c.status,
            summary=c.summary,
            diff_data=diff_items,
            key_takeaways=takeaways,
            created_at=c.created_at
        ))
    return results


@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(
    comparison_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(DocumentComparison).filter(DocumentComparison.id == comparison_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found")
    if c.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    diff_list = json.loads(c.diff_data) if c.diff_data else []
    takeaways = json.loads(c.key_takeaways) if c.key_takeaways else []
    diff_items = [ClauseDiffItem(**d) for d in diff_list]
    doc_a = db.query(Document).filter(Document.id == c.doc_a_id).first()
    doc_b = db.query(Document).filter(Document.id == c.doc_b_id).first()

    return ComparisonResponse(
        id=c.id,
        user_id=c.user_id,
        doc_a_id=c.doc_a_id,
        doc_b_id=c.doc_b_id,
        doc_a_title=doc_a.title if doc_a else "Document A",
        doc_b_title=doc_b.title if doc_b else "Document B",
        title=c.title,
        status=c.status,
        summary=c.summary,
        diff_data=diff_items,
        key_takeaways=takeaways,
        created_at=c.created_at
    )
