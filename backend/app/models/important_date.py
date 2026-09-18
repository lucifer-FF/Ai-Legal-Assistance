import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class ImportantDate(Base):
    __tablename__ = "important_dates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_name = Column(String(255), nullable=False)
    date_str = Column(String(100), nullable=False)
    date_type = Column(String(100), default="Deadline", nullable=False)  # "Renewal", "Termination Notice", "Payment", "Deadline", "Effective Date"
    section_ref = Column(String(100), default="General", nullable=False)
    action_required = Column(Text, nullable=True)
    consequence_if_missed = Column(Text, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="important_dates")
