from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ClauseResponse(BaseModel):
    id: str
    category: str
    title: str
    original_text: str
    section_ref: str
    page_number: int
    plain_language_explanation: str
    why_it_matters: str
    potential_implications: str
    questions_for_lawyer: List[str]

    class Config:
        from_attributes = True


class RiskResponse(BaseModel):
    id: str
    level: str  # HIGH, MEDIUM, LOW, INFORMATIONAL
    title: str
    explanation: str
    why_it_matters: str
    section_ref: str
    page_number: int
    mitigation_suggestion: Optional[str] = None

    class Config:
        from_attributes = True


class ObligationResponse(BaseModel):
    id: str
    party_type: str  # USER, COUNTERPARTY, MUTUAL
    title: str
    description: str
    deadline_info: Optional[str] = None
    consequence_of_breach: Optional[str] = None
    section_ref: str

    class Config:
        from_attributes = True


class ImportantDateResponse(BaseModel):
    id: str
    event_name: str
    date_str: str
    date_type: str
    section_ref: str
    action_required: Optional[str] = None
    consequence_if_missed: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentAnalysisResponse(BaseModel):
    id: str
    document_id: str
    document_type: str
    summary: str
    parties: List[Dict[str, str]]
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    governing_jurisdiction: Optional[str] = None
    key_terms: Dict[str, Any]
    confidence_score: str
    created_at: datetime

    class Config:
        from_attributes = True


class FullDocumentIntelligence(BaseModel):
    document: Any
    analysis: Optional[DocumentAnalysisResponse] = None
    clauses: List[ClauseResponse] = []
    risks: List[RiskResponse] = []
    obligations: List[ObligationResponse] = []
    important_dates: List[ImportantDateResponse] = []
