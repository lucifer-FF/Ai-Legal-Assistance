import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class RiskFinding(Base):
    __tablename__ = "risks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    level = Column(String(50), nullable=False, index=True)  # "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    section_ref = Column(String(100), default="General", nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    mitigation_suggestion = Column(Text, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="risks")
