from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_analysis import DocumentAnalysis
from app.models.risk import RiskFinding
from app.models.comparison import DocumentComparison
from app.models.chat import ChatMessage
from app.models.audit import AuditLog
from app.schemas.admin import SystemStatsResponse, AuditLogResponse
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Oversight & Analytics"])


@router.get("/statistics", response_model=SystemStatsResponse)
def get_system_statistics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()
    total_chunks = db.query(DocumentChunk).count()
    total_questions = db.query(ChatMessage).filter(ChatMessage.role == "user").count()
    total_comparisons = db.query(DocumentComparison).count()

    completed_docs = db.query(Document).filter(Document.processing_status == "COMPLETED").count()
    failed_docs = db.query(Document).filter(Document.processing_status == "FAILED").count()

    success_rate = (completed_docs / total_documents * 100) if total_documents > 0 else 100.0

    # Document types breakdown
    type_counts = (
        db.query(DocumentAnalysis.document_type, func.count(DocumentAnalysis.id))
        .group_by(DocumentAnalysis.document_type)
        .all()
    )
    doc_types_map: Dict[str, int] = {t[0]: t[1] for t in type_counts}
    if not doc_types_map:
        doc_types_map = {"Commercial Lease": 0, "NDA": 0, "Employment": 0, "SaaS Terms": 0}

    # Risk level distribution
    risk_counts = (
        db.query(RiskFinding.level, func.count(RiskFinding.id))
        .group_by(RiskFinding.level)
        .all()
    )
    risk_dist: Dict[str, int] = {r[0]: r[1] for r in risk_counts}
    for lvl in ["HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]:
        if lvl not in risk_dist:
            risk_dist[lvl] = 0

    return SystemStatsResponse(
        total_users=total_users,
        total_documents=total_documents,
        total_chunks=total_chunks,
        total_questions=total_questions,
        total_comparisons=total_comparisons,
        completed_documents=completed_docs,
        failed_documents=failed_docs,
        success_rate_percent=round(success_rate, 1),
        documents_by_type=doc_types_map,
        risk_distribution=risk_dist
    )


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/documents", response_model=List[DocumentResponse])
def get_all_documents(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/activity", response_model=List[AuditLogResponse])
def get_audit_activity(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    results = []
    for l in logs:
        user_email = l.user.email if l.user else "system"
        results.append(AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            user_email=user_email,
            action=l.action,
            details=l.details,
            ip_address=l.ip_address,
            timestamp=l.timestamp
        ))
    return results
