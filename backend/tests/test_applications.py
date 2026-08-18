def test_candidate_apply_and_duplicate_prevention(client):
    # 1. Register Admin & create Job
    admin_res = client.post("/api/v1/auth/register", json={
        "name": "Admin Two",
        "email": "admin2@global.com",
        "password": "password123",
        "role": "company_admin",
        "company_name": "Global Tech"
    })
    admin_token = admin_res.json()["access_token"]
    job_res = client.post("/api/v1/jobs/", json={
        "title": "Data Scientist",
        "description": "ML and Analytics",
        "location": "New York",
        "salary_range": "$120,000"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    job_id = job_res.json()["id"]

    # 2. Register Candidate
    cand_res = client.post("/api/v1/auth/register", json={
        "name": "Jane Candidate",
        "email": "jane@gmail.com",
        "password": "password123",
        "role": "candidate"
    })
    cand_token = cand_res.json()["access_token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # 3. Candidate applies
    app_res = client.post("/api/v1/applications/apply", json={"job_id": job_id}, headers=cand_headers)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "Applied"

    # 4. Try duplicate application -> Should fail with 400!
    dup_res = client.post("/api/v1/applications/apply", json={"job_id": job_id}, headers=cand_headers)
    assert dup_res.status_code == 400
    assert "already submitted an application" in dup_res.json()["detail"]
