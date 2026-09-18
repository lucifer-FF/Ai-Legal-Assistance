from typing import List, Optional, Any
from pydantic import BaseModel, Field


class CitationItem(BaseModel):
    document_id: str
    chunk_id: str
    section: str
    page_number: int
    text_snippet: str


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)
    session_id: Optional[str] = None


class AskQuestionResponse(BaseModel):
    answer: str
    why: str
    source_citation: str
    citations: List[CitationItem]
    confidence: str  # High, Medium, Low
    related_clauses: List[str]
    disclaimer: str
    session_id: str


class ExplainClauseRequest(BaseModel):
    clause_text: str = Field(..., min_length=5)
    section_ref: Optional[str] = "Section"
    context: Optional[str] = None


class ExplainClauseResponse(BaseModel):
    original_clause: str
    plain_language_explanation: str
    why_it_matters: str
    potential_implications: str
    questions_for_lawyer: List[str]
    uncertainty_statement: str


class LawyerPrepResponse(BaseModel):
    document_summary: str
    key_concerns: List[str]
    important_clauses: List[dict]
    questions_for_lawyer: List[str]
    relevant_dates: List[dict]
    information_user_needs_to_provide: List[str]
    disclaimer: str
