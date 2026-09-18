from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CreateComparisonRequest(BaseModel):
    doc_a_id: str
    doc_b_id: str
    title: Optional[str] = "Contract Comparison"


class ClauseDiffItem(BaseModel):
    category: str  # Payment, Termination, Notice period, Liability, Confidentiality, IP ownership, Renewal, Dispute resolution, Governing law, Other material clauses
    status: str  # UNCHANGED, ADDED, REMOVED, MODIFIED
    old_version: Optional[str] = None
    new_version: Optional[str] = None
    what_changed: str
    potential_significance: str
    source_doc_a: Optional[str] = None
    source_doc_b: Optional[str] = None


class ComparisonResponse(BaseModel):
    id: str
    user_id: str
    doc_a_id: str
    doc_b_id: str
    doc_a_title: Optional[str] = None
    doc_b_title: Optional[str] = None
    title: str
    status: str
    summary: str
    diff_data: List[ClauseDiffItem]
    key_takeaways: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
