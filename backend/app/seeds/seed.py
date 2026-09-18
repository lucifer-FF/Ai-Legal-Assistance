import os
import shutil
import uuid
import logging
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import (
    User, Document, DocumentChunk, DocumentEmbedding,
    DocumentAnalysis, Clause, RiskFinding, Obligation,
    ImportantDate, Checklist, ChecklistItem, AuditLog
)
from app.core.security import get_password_hash
from app.core.config import settings
from app.services.processing_service import process_document_background

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def run_seed():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@lexiguard.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@lexiguard.com",
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="System Administrator",
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            logger.info("Created default admin user: admin@lexiguard.com / AdminPass123!")

        # 2. Demo User
        demo_user = db.query(User).filter(User.email == "user@lexiguard.com").first()
        if not demo_user:
            demo_user = User(
                id=str(uuid.uuid4()),
                email="user@lexiguard.com",
                hashed_password=get_password_hash("UserPass123!"),
                full_name="Alex Morgan (Legal Counsel)",
                role="USER",
                is_active=True
            )
            db.add(demo_user)
            logger.info("Created default demo user: user@lexiguard.com / UserPass123!")

        db.commit()
        db.refresh(demo_user)

        # 3. Seed Demo Document if none exists
        existing_doc = db.query(Document).filter(Document.user_id == demo_user.id).first()
        if not existing_doc:
            sample_file_path = os.path.join(os.path.dirname(__file__), "commercial_lease_agreement_v1.txt")
            if os.path.exists(sample_file_path):
                dest_filename = f"demo_{uuid.uuid4()}_commercial_lease_agreement_v1.txt"
                dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)
                shutil.copyfile(sample_file_path, dest_path)
                file_size = os.path.getsize(dest_path)

                demo_doc = Document(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    title="Apex Commercial Lease Agreement (Demo Document)",
                    original_filename="commercial_lease_agreement_v1.txt",
                    file_path=dest_path,
                    file_size=file_size,
                    file_type="txt",
                    processing_status="UPLOADING"
                )
                db.add(demo_doc)
                db.commit()
                db.refresh(demo_doc)

                logger.info(f"Processing initial demo document {demo_doc.id}...")
                process_document_background(demo_doc.id)
                logger.info("Demo document processed.")

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
