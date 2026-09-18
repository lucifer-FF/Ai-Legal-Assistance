import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.document_analysis import DocumentAnalysis
from app.models.clause import Clause
from app.models.risk import RiskFinding
from app.models.obligation import Obligation
from app.models.important_date import ImportantDate
from app.schemas.analysis import (
    DocumentAnalysisResponse, ClauseResponse, RiskResponse,
    ObligationResponse, ImportantDateResponse, FullDocumentIntelligence
)
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Legal Analysis"])


def _verify_doc_access(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return doc


@router.get("/{document_id}/analysis", response_model=DocumentAnalysisResponse)
def get_document_analysis(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == document_id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document analysis not yet available")

    parties = json.loads(analysis.parties) if analysis.parties else []
    key_terms = json.loads(analysis.key_terms) if analysis.key_terms else {}

    return DocumentAnalysisResponse(
        id=analysis.id,
        document_id=analysis.document_id,
        document_type=analysis.document_type,
        summary=analysis.summary,
        parties=parties,
        effective_date=analysis.effective_date,
        expiry_date=analysis.expiry_date,
        governing_jurisdiction=analysis.governing_jurisdiction,
        key_terms=key_terms,
        confidence_score=analysis.confidence_score,
        created_at=analysis.created_at
    )


@router.get("/{document_id}/clauses", response_model=List[ClauseResponse])
def get_document_clauses(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    clauses = db.query(Clause).filter(Clause.document_id == document_id).order_by(Clause.page_number).all()
    results = []
    for c in clauses:
        q_list = json.loads(c.questions_for_lawyer) if c.questions_for_lawyer else []
        results.append(ClauseResponse(
            id=c.id,
            category=c.category,
            title=c.title,
            original_text=c.original_text,
            section_ref=c.section_ref,
            page_number=c.page_number,
            plain_language_explanation=c.plain_language_explanation,
            why_it_matters=c.why_it_matters,
            potential_implications=c.potential_implications,
            questions_for_lawyer=q_list
        ))
    return results


@router.get("/{document_id}/risks", response_model=List[RiskResponse])
def get_document_risks(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    risks = db.query(RiskFinding).filter(RiskFinding.document_id == document_id).all()
    return [RiskResponse.model_validate(r) for r in risks]


@router.get("/{document_id}/obligations", response_model=List[ObligationResponse])
def get_document_obligations(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    obligations = db.query(Obligation).filter(Obligation.document_id == document_id).all()
    return [ObligationResponse.model_validate(o) for o in obligations]


@router.get("/{document_id}/dates", response_model=List[ImportantDateResponse])
def get_document_dates(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_doc_access(document_id, current_user, db)
    dates = db.query(ImportantDate).filter(ImportantDate.document_id == document_id).all()
    return [ImportantDateResponse.model_validate(d) for d in dates]


@router.get("/{document_id}/full-intelligence", response_model=FullDocumentIntelligence)
def get_full_document_intelligence(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = _verify_doc_access(document_id, current_user, db)
    analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == document_id).first()
    clauses = db.query(Clause).filter(Clause.document_id == document_id).order_by(Clause.page_number).all()
    risks = db.query(RiskFinding).filter(RiskFinding.document_id == document_id).all()
    obligations = db.query(Obligation).filter(Obligation.document_id == document_id).all()
    dates = db.query(ImportantDate).filter(ImportantDate.document_id == document_id).all()

    analysis_res = None
    if analysis:
        parties = json.loads(analysis.parties) if analysis.parties else []
        key_terms = json.loads(analysis.key_terms) if analysis.key_terms else {}
        analysis_res = DocumentAnalysisResponse(
            id=analysis.id,
            document_id=analysis.document_id,
            document_type=analysis.document_type,
            summary=analysis.summary,
            parties=parties,
            effective_date=analysis.effective_date,
            expiry_date=analysis.expiry_date,
            governing_jurisdiction=analysis.governing_jurisdiction,
            key_terms=key_terms,
            confidence_score=analysis.confidence_score,
            created_at=analysis.created_at
        )

    clause_res = []
    for c in clauses:
        q_list = json.loads(c.questions_for_lawyer) if c.questions_for_lawyer else []
        clause_res.append(ClauseResponse(
            id=c.id,
            category=c.category,
            title=c.title,
            original_text=c.original_text,
            section_ref=c.section_ref,
            page_number=c.page_number,
            plain_language_explanation=c.plain_language_explanation,
            why_it_matters=c.why_it_matters,
            potential_implications=c.potential_implications,
            questions_for_lawyer=q_list
        ))

    return FullDocumentIntelligence(
        document=DocumentResponse.model_validate(doc),
        analysis=analysis_res,
        clauses=clause_res,
        risks=[RiskResponse.model_validate(r) for r in risks],
        obligations=[ObligationResponse.model_validate(o) for o in obligations],
        important_dates=[ImportantDateResponse.model_validate(d) for d in dates]
    )
