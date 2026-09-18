from app.services.processing_service import process_document_background
from app.models.document import Document
import uuid
import os


def test_rag_and_ai_endpoints(client, db_session, normal_user, auth_headers):
    # Create sample document record
    doc = Document(
        id=str(uuid.uuid4()),
        user_id=normal_user.id,
        title="Apex Commercial Lease Contract",
        original_filename="test_lease.txt",
        file_path=os.path.join(os.path.dirname(__file__), "..", "app", "seeds", "commercial_lease_agreement_v1.txt"),
        file_size=3500,
        file_type="txt",
        processing_status="UPLOADING"
    )
    db_session.add(doc)
    db_session.commit()

    # Process document synchronously in test
    process_document_background(doc.id, db=db_session)


    # Verify status completed
    db_session.refresh(doc)
    assert doc.processing_status == "COMPLETED"

    # Test full intelligence
    intel_res = client.get(f"/api/v1/documents/{doc.id}/full-intelligence", headers=auth_headers)
    assert intel_res.status_code == 200
    intel_data = intel_res.json()
    assert intel_data["analysis"] is not None
    assert len(intel_data["risks"]) > 0
    assert len(intel_data["clauses"]) > 0

    # Test RAG QA endpoint
    qa_res = client.post(
        f"/api/v1/ai/documents/{doc.id}/ask",
        json={"question": "What happens if I terminate this agreement early?"},
        headers=auth_headers
    )
    assert qa_res.status_code == 200
    qa_data = qa_res.json()
    assert "answer" in qa_data
    assert "source_citation" in qa_data
    assert len(qa_data["citations"]) > 0

    # Test clause explainer
    clause_res = client.post(
        f"/api/v1/ai/documents/{doc.id}/explain-clause",
        json={
            "clause_text": "Tenant shall indemnify and hold harmless Landlord from any and all claims.",
            "section_ref": "Section 9.1"
        },
        headers=auth_headers
    )
    assert clause_res.status_code == 200
    clause_data = clause_res.json()
    assert "plain_language_explanation" in clause_data
    assert len(clause_data["questions_for_lawyer"]) > 0

    # Test lawyer prep dossier
    prep_res = client.get(f"/api/v1/ai/documents/{doc.id}/prepare-lawyer", headers=auth_headers)
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    assert len(prep_data["questions_for_lawyer"]) > 0
    assert len(prep_data["key_concerns"]) > 0
