def test_job_creation_and_free_plan_limit(client):
    # 1. Register Company Admin
    res_admin = client.post("/api/v1/auth/register", json={
        "name": "Admin One",
        "email": "admin@techcorp.com",
        "password": "password123",
        "role": "company_admin",
        "company_name": "TechCorp"
    })
    token = res_admin.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Post 5 jobs (Free Plan limit)
    for i in range(5):
        res = client.post("/api/v1/jobs/", json={
            "title": f"Software Engineer {i+1}",
            "description": "Awesome role building scalable microservices",
            "location": "Remote",
            "salary_range": "$100,000 - $130,000",
            "employment_type": "Full-time"
        }, headers=headers)
        assert res.status_code == 200

    # 3. Try to post 6th job -> Should fail with 402 Payment Required!
    res_6th = client.post("/api/v1/jobs/", json={
        "title": "Backend Architect",
        "description": "Exceeding limit job",
        "location": "Remote",
        "salary_range": "$150,000",
        "employment_type": "Full-time"
    }, headers=headers)
    assert res_6th.status_code == 402
    assert "Free Plan limit reached" in res_6th.json()["detail"]
