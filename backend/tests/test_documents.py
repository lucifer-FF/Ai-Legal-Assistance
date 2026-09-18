import io
from app.models.document import Document


def test_upload_txt_document(client, auth_headers):
    file_content = b"""COMMERCIAL LEASE AGREEMENT
    Section 1. Premises.
    Landlord leases to Tenant Suite 400.
    Section 8.2 Termination.
    Tenant may terminate upon 60 days notice and payment of 3 months fee.
    """
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test_lease.txt", io.BytesIO(file_content), "text/plain")},
        data={"title": "Test Commercial Lease"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Commercial Lease"
    assert data["file_type"] == "txt"
    assert data["processing_status"] in ["UPLOADING", "EXTRACTING", "ANALYZING", "COMPLETED"]


def test_upload_invalid_extension(client, auth_headers):
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("malicious.exe", io.BytesIO(b"binary"), "application/octet-stream")},
        headers=auth_headers
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_list_documents(client, auth_headers):
    response = client.get("/api/v1/documents", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_seed_demo_document_endpoint(client, auth_headers):
    response = client.post("/api/v1/documents/demo-seed?version=1", headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert "Apex Commercial Lease Agreement" in data["title"]
    assert data["file_type"] == "txt"
