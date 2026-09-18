import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_text = Column(Text, nullable=False)
    section_ref = Column(String(100), default="Section unspecified", nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    
    plain_language_explanation = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    potential_implications = Column(Text, nullable=False)
    questions_for_lawyer = Column(Text, nullable=False)  # JSON serialized list of questions

    # Relationships
    document = relationship("Document", back_populates="clauses")
