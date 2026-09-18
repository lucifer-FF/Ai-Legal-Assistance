import json
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding


class VectorStoreBase(ABC):
    @abstractmethod
    def add_embeddings(
        self,
        db: Session,
        document_id: str,
        chunks_with_embeddings: List[Tuple[DocumentChunk, List[float]]]
    ) -> None:
        pass

    @abstractmethod
    def similarity_search(
        self,
        db: Session,
        document_id: str,
        query_embedding: List[float],
        top_k: int = 4
    ) -> List[Tuple[DocumentChunk, float]]:
        pass


class NumpyVectorStore(VectorStoreBase):
    """
    Universal vector store implementation using vectorized NumPy cosine similarity
    and JSON persistence in SQLAlchemy. Runs identically on SQLite or PostgreSQL.
    """

    def add_embeddings(
        self,
        db: Session,
        document_id: str,
        chunks_with_embeddings: List[Tuple[DocumentChunk, List[float]]]
    ) -> None:
        for chunk, embedding in chunks_with_embeddings:
            doc_emb = DocumentEmbedding(
                chunk_id=chunk.id,
                document_id=document_id,
                dimension=len(embedding),
                vector_json=json.dumps(embedding)
            )
            db.add(doc_emb)
        db.commit()

    def similarity_search(
        self,
        db: Session,
        document_id: str,
        query_embedding: List[float],
        top_k: int = 4
    ) -> List[Tuple[DocumentChunk, float]]:
        # Fetch all embeddings for this document
        embeddings_records = (
            db.query(DocumentEmbedding, DocumentChunk)
            .join(DocumentChunk, DocumentEmbedding.chunk_id == DocumentChunk.id)
            .filter(DocumentEmbedding.document_id == document_id)
            .all()
        )

        if not embeddings_records:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        norm_q = np.linalg.norm(q_vec)
        if norm_q == 0:
            norm_q = 1e-9

        scores_and_chunks: List[Tuple[DocumentChunk, float]] = []

        for emb_rec, chunk in embeddings_records:
            try:
                vec_list = json.loads(emb_rec.vector_json)
                vec = np.array(vec_list, dtype=np.float32)
                norm_v = np.linalg.norm(vec)
                if norm_v == 0:
                    norm_v = 1e-9
                cosine_sim = float(np.dot(q_vec, vec) / (norm_q * norm_v))
                scores_and_chunks.append((chunk, cosine_sim))
            except Exception:
                continue

        # Sort descending by cosine similarity score
        scores_and_chunks.sort(key=lambda x: x[1], reverse=True)
        return scores_and_chunks[:top_k]


# Singleton instance for vector operations
vector_store: VectorStoreBase = NumpyVectorStore()
