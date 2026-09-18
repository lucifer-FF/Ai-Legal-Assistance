from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse


class SystemStatsResponse(BaseModel):
    total_users: int
    total_documents: int
    total_chunks: int
    total_questions: int
    total_comparisons: int
    completed_documents: int
    failed_documents: int
    success_rate_percent: float
    documents_by_type: Dict[str, int]
    risk_distribution: Dict[str, int]


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
