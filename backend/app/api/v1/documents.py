import os
import uuid
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.document_analysis import DocumentAnalysis
from app.models.risk import RiskFinding
from app.models.important_date import ImportantDate
from app.models.checklist import Checklist
from app.models.audit import AuditLog
from app.schemas.document import DocumentResponse, DocumentStatusResponse
from app.api.deps import get_current_user
from app.services.processing_service import process_document_background
from app.services.export_service import generate_document_pdf_report

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}
MAX_FILE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    original_filename = file.filename or "uploaded_contract.txt"
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported formats are: PDF, DOCX, and TXT."
        )

    # Sanitize file storage name
    safe_id = str(uuid.uuid4())
    stored_filename = f"{safe_id}_{original_filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    # Read and validate size
    try:
        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        with open(file_path, "wb") as f:
            f.write(content)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to securely save uploaded file: {str(e)}"
        )

    doc_title = title.strip() if (title and title.strip()) else original_filename.rsplit(".", 1)[0]

    document = Document(
        id=safe_id,
        user_id=current_user.id,
        title=doc_title,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        file_type=ext,
        processing_status="UPLOADING"
    )
    db.add(document)

    audit = AuditLog(
        user_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        details=f"Uploaded '{doc_title}' ({file_size} bytes)"
    )
    db.add(audit)
    db.commit()
    db.refresh(document)

    # Launch background document extraction and intelligence pipeline
    background_tasks.add_task(process_document_background, document.id)

    return DocumentResponse.model_validate(document)


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "ADMIN":
        docs = db.query(Document).order_by(Document.created_at.desc()).all()
    else:
        docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return DocumentResponse.model_validate(doc)


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return DocumentStatusResponse(
        id=doc.id,
        processing_status=doc.processing_status,
        error_message=doc.error_message,
        page_count=doc.page_count,
        word_count=doc.word_count
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Clean up file on disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    audit = AuditLog(
        user_id=current_user.id,
        action="DOCUMENT_DELETED",
        details=f"Deleted document '{doc.title}' ({doc.id})"
    )
    db.add(audit)
    db.delete(doc)
    db.commit()
    return None


@router.get("/{document_id}/export")
def export_document_pdf(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    analysis_rec = db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == doc.id).first()
    analysis_dict = {}
    if analysis_rec:
        analysis_dict = {
            "summary": analysis_rec.summary,
            "document_type": analysis_rec.document_type,
            "effective_date": analysis_rec.effective_date,
            "expiry_date": analysis_rec.expiry_date,
            "governing_jurisdiction": analysis_rec.governing_jurisdiction
        }

    risks = db.query(RiskFinding).filter(RiskFinding.document_id == doc.id).all()
    dates = db.query(ImportantDate).filter(ImportantDate.document_id == doc.id).all()
    checklist = db.query(Checklist).filter(Checklist.document_id == doc.id).first()
    checklist_items = checklist.items if checklist else []

    pdf_bytes = generate_document_pdf_report(
        doc_title=doc.title,
        analysis=analysis_dict,
        risks=risks,
        dates=dates,
        checklist_items=checklist_items
    )

    safe_title = doc.title.replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=LexiGuard_{safe_title}_Report.pdf"
        }
    )


@router.post("/demo-seed", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def seed_demo_document_for_user(
    version: int = 1,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Load sample contract (V1 or V2) into current user's workspace."""
    seed_filename = "commercial_lease_agreement_v1.txt" if version == 1 else "commercial_lease_agreement_v2.txt"
    title_suffix = "Standard Form V1" if version == 1 else "Amended Revision V2"
    doc_title = f"Apex Commercial Lease Agreement ({title_suffix}) [Demo Document]"

    seeds_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "seeds")
    source_file = os.path.join(seeds_dir, seed_filename)

    if not os.path.exists(source_file):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo file not found")

    dest_filename = f"demo_{uuid.uuid4()}_{seed_filename}"
    dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)
    shutil.copyfile(source_file, dest_path)
    file_size = os.path.getsize(dest_path)

    document = Document(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=doc_title,
        original_filename=seed_filename,
        file_path=dest_path,
        file_size=file_size,
        file_type="txt",
        processing_status="UPLOADING"
    )
    db.add(document)

    audit = AuditLog(
        user_id=current_user.id,
        action="DEMO_DOCUMENT_SEEDED",
        details=f"Loaded {doc_title}"
    )
    db.add(audit)
    db.commit()
    db.refresh(document)

    background_tasks.add_task(process_document_background, document.id)
    return DocumentResponse.model_validate(document)

