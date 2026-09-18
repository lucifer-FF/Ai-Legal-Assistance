from app.models.document import Document
import uuid
import os


def test_document_comparison(client, db_session, normal_user, auth_headers):
    seeds_dir = os.path.join(os.path.dirname(__file__), "..", "app", "seeds")
    doc_a = Document(
        id=str(uuid.uuid4()),
        user_id=normal_user.id,
        title="Apex Lease V1",
        original_filename="v1.txt",
        file_path=os.path.join(seeds_dir, "commercial_lease_agreement_v1.txt"),
        file_size=3500,
        file_type="txt",
        processing_status="COMPLETED"
    )
    doc_b = Document(
        id=str(uuid.uuid4()),
        user_id=normal_user.id,
        title="Apex Lease V2",
        original_filename="v2.txt",
        file_path=os.path.join(seeds_dir, "commercial_lease_agreement_v2.txt"),
        file_size=3500,
        file_type="txt",
        processing_status="COMPLETED"
    )
    db_session.add_all([doc_a, doc_b])
    db_session.commit()

    # Create comparison
    res = client.post(
        "/api/v1/comparisons",
        json={
            "doc_a_id": doc_a.id,
            "doc_b_id": doc_b.id,
            "title": "Lease V1 vs Lease V2"
        },
        headers=auth_headers
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert len(data["diff_data"]) > 0
    assert len(data["key_takeaways"]) > 0

    # Retrieve comparison
    comp_id = data["id"]
    get_res = client.get(f"/api/v1/comparisons/{comp_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == comp_id


def test_compare_same_doc_fails(client, normal_user, auth_headers):
    res = client.post(
        "/api/v1/comparisons",
        json={
            "doc_a_id": "dummy_id",
            "doc_b_id": "dummy_id"
        },
        headers=auth_headers
    )
    assert res.status_code == 400
