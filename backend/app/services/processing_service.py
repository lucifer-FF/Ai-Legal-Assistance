import json
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import (
    Document, DocumentChunk, DocumentAnalysis,
    Clause, RiskFinding, Obligation, ImportantDate,
    Checklist, ChecklistItem, AuditLog
)
from app.services.document_parser import DocumentParser
from app.ai.gemini_client import gemini_client
from app.ai.vector_store import vector_store

logger = logging.getLogger(__name__)


def process_document_background(document_id: str, db: Optional[Session] = None) -> None:
    """
    Background worker pipeline:
    1. EXTRACTING: parse text, detect sections, build chunks.
    2. ANALYZING: compute embeddings, store vector data, run legal extraction.
    3. PERSISTING: populate analysis, clauses, risks, obligations, dates, checklist.
    4. COMPLETED: finalize document state.
    """
    close_db_at_end = False
    if db is None:
        db = SessionLocal()
        close_db_at_end = True

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()

        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        logger.info(f"Starting extraction for document {document_id} ({doc.title})")
        doc.processing_status = "EXTRACTING"
        db.commit()

        # Step 1: Parse Document
        parse_result = DocumentParser.parse_document(doc.file_path, doc.file_type)
        doc.page_count = parse_result.page_count
        doc.word_count = parse_result.word_count

        # Step 2: Store Document Chunks
        db_chunks = []
        for p_chunk in parse_result.chunks:
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=p_chunk.chunk_index,
                section_title=p_chunk.section_title,
                page_number=p_chunk.page_number,
                content=p_chunk.content,
                token_count=p_chunk.token_count
            )
            db.add(chunk)
            db_chunks.append(chunk)

        db.commit()
        for chunk in db_chunks:
            db.refresh(chunk)

        # Step 3: Compute and Store Embeddings
        logger.info(f"Computing embeddings for {len(db_chunks)} chunks...")
        chunks_with_embeddings = []
        for chunk in db_chunks:
            emb = gemini_client.get_embedding(f"{chunk.section_title}: {chunk.content}")
            chunks_with_embeddings.append((chunk, emb))

        vector_store.add_embeddings(db, doc.id, chunks_with_embeddings)

        # Step 4: AI Legal Analysis
        logger.info(f"Analyzing legal intelligence with Gemini 3.8 Flash...")
        doc.processing_status = "ANALYZING"
        db.commit()

        analysis_data = gemini_client.analyze_document(parse_result.full_text, doc.title)

        # Step 5: Save Document Analysis
        analysis_record = DocumentAnalysis(
            document_id=doc.id,
            document_type=analysis_data.get("document_type", "Commercial Agreement"),
            summary=analysis_data.get("summary", "Document analyzed by LexiGuard."),
            parties=json.dumps(analysis_data.get("parties", [])),
            effective_date=analysis_data.get("effective_date"),
            expiry_date=analysis_data.get("expiry_date"),
            governing_jurisdiction=analysis_data.get("governing_jurisdiction"),
            key_terms=json.dumps(analysis_data.get("key_terms", {})),
            confidence_score="High"
        )
        db.add(analysis_record)

        # Step 6: Save Clauses
        for clause_item in analysis_data.get("clauses", []):
            cl = Clause(
                document_id=doc.id,
                category=clause_item.get("category", "General"),
                title=clause_item.get("title", "Clause"),
                original_text=clause_item.get("original_text", ""),
                section_ref=clause_item.get("section_ref", "Section"),
                page_number=int(clause_item.get("page_number", 1)),
                plain_language_explanation=clause_item.get("plain_language_explanation", ""),
                why_it_matters=clause_item.get("why_it_matters", ""),
                potential_implications=clause_item.get("potential_implications", ""),
                questions_for_lawyer=json.dumps(clause_item.get("questions_for_lawyer", []))
            )
            db.add(cl)

        # Step 7: Save Risks
        for risk_item in analysis_data.get("risks", []):
            rf = RiskFinding(
                document_id=doc.id,
                level=risk_item.get("level", "MEDIUM").upper(),
                title=risk_item.get("title", "Identified Risk"),
                explanation=risk_item.get("explanation", ""),
                why_it_matters=risk_item.get("why_it_matters", ""),
                section_ref=risk_item.get("section_ref", "General"),
                page_number=int(risk_item.get("page_number", 1)),
                mitigation_suggestion=risk_item.get("mitigation_suggestion")
            )
            db.add(rf)

        # Step 8: Save Obligations
        for obl_item in analysis_data.get("obligations", []):
            ob = Obligation(
                document_id=doc.id,
                party_type=obl_item.get("party_type", "USER").upper(),
                title=obl_item.get("title", "Obligation"),
                description=obl_item.get("description", ""),
                deadline_info=obl_item.get("deadline_info"),
                consequence_of_breach=obl_item.get("consequence_of_breach"),
                section_ref=obl_item.get("section_ref", "General")
            )
            db.add(ob)

        # Step 9: Save Important Dates
        for date_item in analysis_data.get("important_dates", []):
            imp_date = ImportantDate(
                document_id=doc.id,
                event_name=date_item.get("event_name", "Deadline"),
                date_str=date_item.get("date_str", "Unspecified"),
                date_type=date_item.get("date_type", "Deadline"),
                section_ref=date_item.get("section_ref", "General"),
                action_required=date_item.get("action_required"),
                consequence_if_missed=date_item.get("consequence_if_missed")
            )
            db.add(imp_date)

        # Step 10: Save Checklist
        checklist = Checklist(
            document_id=doc.id,
            user_id=doc.user_id,
            title=f"Legal Review Checklist — {doc.title}"
        )
        db.add(checklist)
        db.commit()
        db.refresh(checklist)

        for chk_item in analysis_data.get("checklist_items", []):
            item = ChecklistItem(
                checklist_id=checklist.id,
                title=chk_item.get("title", "Verify Clause"),
                description=chk_item.get("description"),
                category=chk_item.get("category", "Review"),
                priority=chk_item.get("priority", "MEDIUM").upper(),
                is_completed=False,
                section_ref=chk_item.get("section_ref", "General")
            )
            db.add(item)

        # Step 11: Finalize Status
        doc.processing_status = "COMPLETED"
        doc.error_message = None

        # Log audit entry
        audit = AuditLog(
            user_id=doc.user_id,
            action="DOCUMENT_ANALYSIS_COMPLETED",
            details=f"Processed '{doc.title}' ({doc.page_count} pages, {len(db_chunks)} chunks)"
        )
        db.add(audit)

        db.commit()
        logger.info(f"Document {document_id} processing completed successfully!")

    except Exception as e:
        logger.exception(f"Error processing document {document_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.processing_status = "FAILED"
                doc.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        if close_db_at_end:
            db.close()

