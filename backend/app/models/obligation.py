import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    party_type = Column(String(50), nullable=False, index=True)  # "USER", "COUNTERPARTY", "MUTUAL"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline_info = Column(String(255), nullable=True)
    consequence_of_breach = Column(Text, nullable=True)
    section_ref = Column(String(100), default="General", nullable=False)

    # Relationships
    document = relationship("Document", back_populates="obligations")
