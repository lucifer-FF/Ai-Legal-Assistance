import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class DocumentAnalysis(Base):
    __tablename__ = "document_analysis"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    document_type = Column(String(100), default="General Agreement", nullable=False)
    summary = Column(Text, nullable=False)
    parties = Column(Text, nullable=False)  # JSON serialized list of parties
    effective_date = Column(String(100), nullable=True)
    expiry_date = Column(String(100), nullable=True)
    governing_jurisdiction = Column(String(150), nullable=True)
    key_terms = Column(Text, nullable=False)  # JSON serialized map of key terms
    confidence_score = Column(String(20), default="High", nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    document = relationship("Document", back_populates="analysis")
