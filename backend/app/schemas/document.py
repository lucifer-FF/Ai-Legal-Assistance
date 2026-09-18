from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DocumentBase(BaseModel):
    title: str


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    original_filename: str
    file_size: int
    file_type: str
    processing_status: str
    error_message: Optional[str] = None
    page_count: int
    word_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentStatusResponse(BaseModel):
    id: str
    processing_status: str
    error_message: Optional[str] = None
    page_count: int
    word_count: int


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    section_title: str
    page_number: int
    content: str
    token_count: int

    class Config:
        from_attributes = True
