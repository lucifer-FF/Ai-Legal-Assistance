from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ChecklistItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "General"
    priority: Optional[str] = "MEDIUM"
    section_ref: Optional[str] = "General"


class ChecklistItemUpdate(BaseModel):
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None


class ChecklistItemResponse(BaseModel):
    id: str
    checklist_id: str
    title: str
    description: Optional[str] = None
    category: str
    priority: str
    is_completed: bool
    notes: Optional[str] = None
    section_ref: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChecklistResponse(BaseModel):
    id: str
    document_id: str
    user_id: str
    title: str
    created_at: datetime
    items: List[ChecklistItemResponse] = []

    class Config:
        from_attributes = True
