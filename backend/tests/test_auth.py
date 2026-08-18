def test_register_company_admin(client):
    response = client.post("/api/v1/auth/register", json={
        "name": "Admin User",
        "email": "admin@acme.com",
        "password": "password123",
        "role": "company_admin",
        "company_name": "Acme Corp"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "company_admin"
    assert data["user"]["company_name"] == "Acme Corp"

def test_login_user(client):
    # Register first
    client.post("/api/v1/auth/register", json={
        "name": "Candidate One",
        "email": "candidate@example.com",
        "password": "secretpassword",
        "role": "candidate"
    })
    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "candidate@example.com",
        "password": "secretpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
