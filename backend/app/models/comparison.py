import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class DocumentComparison(Base):
    __tablename__ = "document_comparisons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_a_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_b_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), default="Document Comparison", nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)  # "PROCESSING", "COMPLETED", "FAILED"
    summary = Column(Text, nullable=False)
    diff_data = Column(Text, nullable=False)  # JSON serialized array of categorized clause comparisons
    key_takeaways = Column(Text, nullable=False)  # JSON serialized list of main takeaways
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="comparisons")
    document_a = relationship("Document", foreign_keys=[doc_a_id])
    document_b = relationship("Document", foreign_keys=[doc_b_id])
