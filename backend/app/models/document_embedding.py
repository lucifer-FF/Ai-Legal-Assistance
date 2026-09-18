import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    dimension = Column(Integer, default=768, nullable=False)
    # Stored as JSON serialized list of floats for ubiquitous compatibility across SQLite & Postgres
    vector_json = Column(Text, nullable=False)

    # Relationships
    chunk = relationship("DocumentChunk", back_populates="embedding")
