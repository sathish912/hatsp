import sys
import os
from datetime import datetime, timedelta

# Ensure backend path is included
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.services.gcal_service import generate_meet_link
from app.models.models import (
    Organization, User, CandidateProfile, Job, JobApplication,
    Interview, OfferLetter, Subscription, UserRole, JobStatus,
    ApplicationStatus, InterviewStatus, OfferStatus, SubscriptionPlan, SubscriptionStatus
)

def seed():
    print("[+] Seeding HR Recruitment & ATS Platform with multi-tenant demo data...")
    
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        hashed_password = get_password_hash("userpass")

        # 1. Organization 1: Jarvish Tech (PRO PLAN)
        org1 = db.query(Organization).filter(Organization.company_name == "Jarvish Tech").first()
        if not org1:
            org1 = Organization(company_name="Jarvish Tech", subscription_plan=SubscriptionPlan.PRO.value, company_logo="/uploads/logos/jarvish_tech_logo.jpg")
            db.add(org1)
            db.commit()
            db.refresh(org1)
        else:
            org1.company_logo = "/uploads/logos/jarvish_tech_logo.jpg"
            db.commit()

        sub1 = db.query(Subscription).filter(Subscription.organization_id == org1.id).first()
        if not sub1:
            sub1 = Subscription(organization_id=org1.id, plan=SubscriptionPlan.PRO.value, status=SubscriptionStatus.ACTIVE.value)
            db.add(sub1)
            db.commit()

        # 2. Organization 2: InnovateTech Labs (FREE PLAN - For Testing Quota Limits & Upgrades!)
        org2 = db.query(Organization).filter(Organization.company_name == "InnovateTech Labs").first()
        if not org2:
            org2 = Organization(company_name="InnovateTech Labs", subscription_plan=SubscriptionPlan.FREE.value, company_logo="/uploads/logos/innovatetech_logo.jpg")
            db.add(org2)
            db.commit()
            db.refresh(org2)
        else:
            org2.company_logo = "/uploads/logos/innovatetech_logo.jpg"
            db.commit()

        sub2 = db.query(Subscription).filter(Subscription.organization_id == org2.id).first()
        if not sub2:
            sub2 = Subscription(organization_id=org2.id, plan=SubscriptionPlan.FREE.value, status=SubscriptionStatus.ACTIVE.value)
            db.add(sub2)
            db.commit()

        # 3. Users for Jarvish Tech (Pro Plan)
        admin1 = db.query(User).filter(User.email == "admin@hatsp.com").first()
        if not admin1:
            admin1 = User(name="Rajesh Sharma", email="admin@hatsp.com", hashed_password=hashed_password, role=UserRole.COMPANY_ADMIN.value, organization_id=org1.id)
            db.add(admin1)

        hrm1 = db.query(User).filter(User.email == "hrm1@hatsp.com").first()
        if not hrm1:
            hrm1 = User(name="Priya Patel", email="hrm1@hatsp.com", hashed_password=hashed_password, role=UserRole.HR_MANAGER.value, organization_id=org1.id)
            db.add(hrm1)

        rec1 = db.query(User).filter(User.email == "rec1@hatsp.com").first()
        if not rec1:
            rec1 = User(name="Ananya Iyer", email="rec1@hatsp.com", hashed_password=hashed_password, role=UserRole.RECRUITER.value, organization_id=org1.id)
            db.add(rec1)

        # 4. Users for InnovateTech Labs (FREE PLAN)
        admin2 = db.query(User).filter(User.email == "admin2@hatsp.com").first()
        if not admin2:
            admin2 = User(name="Suresh Kumar", email="admin2@hatsp.com", hashed_password=hashed_password, role=UserRole.COMPANY_ADMIN.value, organization_id=org2.id)
            db.add(admin2)

        hrm2 = db.query(User).filter(User.email == "hrm2@hatsp.com").first()
        if not hrm2:
            hrm2 = User(name="Vikram Malhotra", email="hrm2@hatsp.com", hashed_password=hashed_password, role=UserRole.HR_MANAGER.value, organization_id=org2.id)
            db.add(hrm2)

        # Recruiter 2 belongs to InnovateTech Labs (Free Plan)
        rec2 = db.query(User).filter(User.email == "rec2@hatsp.com").first()
        if not rec2:
            rec2 = User(name="Rohan Verma", email="rec2@hatsp.com", hashed_password=hashed_password, role=UserRole.RECRUITER.value, organization_id=org2.id)
            db.add(rec2)
        else:
            # Re-assign rec2 to org2 (Free Plan) if needed
            rec2.organization_id = org2.id

        db.commit()
        db.refresh(rec1)
        db.refresh(rec2)

        # 5. Candidate / Student Users (Student 1 to Student 10, including Freshers)
        student_users = [
            {"email": "student1@hatsp.com", "name": "Aarav Gupta", "phone": "+91 98765 43210", "exp": "3 years Full-Stack", "skills": "React, Python, FastAPI, MySQL, Tailwind CSS", "company": "TechCorp Systems", "prev_role": "Software Engineer"},
            {"email": "student2@hatsp.com", "name": "Sneha Reddy", "phone": "+91 98123 45678", "exp": "2 years Backend", "skills": "Node.js, PostgreSQL, Microservices, Docker, Redis", "company": "CloudWave Solutions", "prev_role": "Backend Engineer"},
            {"email": "student3@hatsp.com", "name": "Karthik Nair", "phone": "+91 97654 32109", "exp": "4 years Product Lead", "skills": "Product Strategy, Agile, SQL, System Architecture, UI/UX", "company": "Innovate Digital", "prev_role": "Product Specialist"},
            {"email": "student4@hatsp.com", "name": "Devika Menon", "phone": "+91 98450 11223", "exp": "Fresher (Entry Level / New Graduate)", "skills": "Figma, Wireframing, User Research, Prototyping, CSS3", "company": None, "prev_role": None},
            {"email": "student5@hatsp.com", "name": "Rahul Sharma", "phone": "+91 97110 33445", "exp": "5 years DevOps Lead", "skills": "AWS, Kubernetes, Terraform, CI/CD, Python, Linux", "company": "DataScale Technologies", "prev_role": "Cloud Engineer"},
            {"email": "student6@hatsp.com", "name": "Ananya Joshi", "phone": "+91 96220 55667", "exp": "Fresher (Data Science Graduate)", "skills": "PyTorch, Pandas, Scikit-learn, SQL, Data Pipelines", "company": None, "prev_role": None},
            {"email": "student7@hatsp.com", "name": "Rohan Verma", "phone": "+91 95430 66778", "exp": "Fresher (Junior Frontend Engineer)", "skills": "JavaScript, React, HTML5, CSS3, Git", "company": None, "prev_role": None},
            {"email": "student8@hatsp.com", "name": "Pooja Hegde", "phone": "+91 94321 88990", "exp": "1.5 years QA Automation", "skills": "Cypress, Selenium, Pytest, Postman API Testing", "company": "QualityFirst Tech", "prev_role": "QA Test Engineer"},
            {"email": "student9@hatsp.com", "name": "Vikram Aditya", "phone": "+91 93210 11447", "exp": "Fresher (B.Tech CS Graduate)", "skills": "C++, Python, Data Structures, Algorithms, MySQL", "company": None, "prev_role": None},
            {"email": "student10@hatsp.com", "name": "Meera Krishnan", "phone": "+91 92109 22558", "exp": "2 years Mobile Developer", "skills": "React Native, Flutter, Swift, Kotlin, Firebase", "company": "Appify Mobile Labs", "prev_role": "Mobile App Developer"}
        ]

        from app.services.pdf_service import generate_candidate_resume_pdf, generate_experience_certificate_pdf

        student_objs = []
        for idx, s in enumerate(student_users, start=1):
            u = db.query(User).filter(User.email == s["email"]).first()
            if not u:
                u = User(name=s["name"], email=s["email"], hashed_password=hashed_password, role=UserRole.CANDIDATE.value, organization_id=None)
                db.add(u)
                db.commit()
                db.refresh(u)

            # Generate individual PDF resume
            resume_filename = f"resume_student{idx}.pdf"
            generate_candidate_resume_pdf(
                candidate_name=s["name"],
                email=s["email"],
                phone=s["phone"],
                experience=s["exp"],
                skills=s["skills"],
                filename=resume_filename
            )

            # Generate experience certificate for experienced candidates (non-freshers)
            is_fresher = "fresher" in s["exp"].lower()
            cert_filename = None
            if not is_fresher and s["company"]:
                cert_filename = f"exp_cert_student{idx}.pdf"
                generate_experience_certificate_pdf(
                    candidate_name=s["name"],
                    previous_company=s["company"],
                    duration=s["exp"],
                    role_title=s["prev_role"] or "Software Engineer",
                    filename=cert_filename
                )

            prof = db.query(CandidateProfile).filter(CandidateProfile.user_id == u.id).first()
            if not prof:
                prof = CandidateProfile(
                    user_id=u.id,
                    phone=s["phone"],
                    experience=s["exp"],
                    skills=s["skills"],
                    resume_url=f"/uploads/resumes/{resume_filename}",
                    experience_certificate_url=f"/uploads/experience_certificates/{cert_filename}" if cert_filename else None
                )
                db.add(prof)
            else:
                prof.experience = s["exp"]
                prof.skills = s["skills"]
                prof.resume_url = f"/uploads/resumes/{resume_filename}"
                if cert_filename:
                    prof.experience_certificate_url = f"/uploads/experience_certificates/{cert_filename}"
            db.commit()

            student_objs.append(u)

        # 6. Job Openings for Jarvish Tech (Org 1 - Pro)
        jobs_org1 = [
            {"title": "Senior Full-Stack Developer", "description": "Lead core SaaS development with React, FastAPI, and MySQL.", "location": "Bangalore, India (Hybrid)", "salary_range": "₹1,800,000 - ₹2,400,000 / year", "employment_type": "Full-time", "recruiter_id": rec1.id},
            {"title": "Backend Systems Engineer", "description": "High-throughput microservices architecture and real-time APIs.", "location": "Hyderabad, India (Remote)", "salary_range": "₹1,400,000 - ₹1,800,000 / year", "employment_type": "Full-time", "recruiter_id": rec1.id},
            {"title": "Lead Product Manager", "description": "Drive product roadmap and feature architecture for enterprise ATS.", "location": "Pune, India (On-site)", "salary_range": "₹2,200,000 - ₹2,800,000 / year", "employment_type": "Full-time", "recruiter_id": rec1.id}
        ]

        # Job Openings for InnovateTech Labs (Org 2 - Free Plan)
        jobs_org2 = [
            {"title": "UI/UX Product Designer", "description": "Craft intuitive SaaS dashboard user experiences and design systems.", "location": "Chennai, India (Hybrid)", "salary_range": "₹1,200,000 - ₹1,600,000 / year", "employment_type": "Full-time", "recruiter_id": rec2.id},
            {"title": "DevOps & Cloud Engineer", "description": "Manage Kubernetes clusters, AWS infrastructure, and CI/CD pipelines.", "location": "Delhi NCR (Remote)", "salary_range": "₹1,600,000 - ₹2,100,000 / year", "employment_type": "Full-time", "recruiter_id": rec2.id},
            {"title": "QA Automation Lead", "description": "Build automated Cypress and Pytest test frameworks for cloud apps.", "location": "Mumbai, India (On-site)", "salary_range": "₹1,100,000 - ₹1,500,000 / year", "employment_type": "Full-time", "recruiter_id": rec2.id},
            {"title": "Data Science & AI Engineer", "description": "Develop predictive candidate matching algorithms and ML models.", "location": "Bangalore, India (Remote)", "salary_range": "₹1,900,000 - ₹2,500,000 / year", "employment_type": "Full-time", "recruiter_id": rec2.id}
        ]

        all_job_objs = []
        for j in jobs_org1:
            job = db.query(Job).filter(Job.title == j["title"], Job.organization_id == org1.id).first()
            if not job:
                job = Job(organization_id=org1.id, recruiter_id=j["recruiter_id"], title=j["title"], description=j["description"], location=j["location"], salary_range=j["salary_range"], employment_type=j["employment_type"], status=JobStatus.ACTIVE.value)
                db.add(job)
                db.commit()
                db.refresh(job)
            all_job_objs.append(job)

        for j in jobs_org2:
            job = db.query(Job).filter(Job.title == j["title"], Job.organization_id == org2.id).first()
            if not job:
                job = Job(organization_id=org2.id, recruiter_id=j["recruiter_id"], title=j["title"], description=j["description"], location=j["location"], salary_range=j["salary_range"], employment_type=j["employment_type"], status=JobStatus.ACTIVE.value)
                db.add(job)
                db.commit()
                db.refresh(job)
            all_job_objs.append(job)

        # 7. Applications & Automated Interview Setup with Calendar Links
        now = datetime.utcnow()

        # Seed applications & interviews across both orgs
        app_specs = [
            {"job_idx": 0, "cand_idx": 0, "status": ApplicationStatus.OFFER_SENT.value, "rec": rec1, "days": 1, "offer": True},
            {"job_idx": 1, "cand_idx": 1, "status": ApplicationStatus.APPLIED.value, "rec": rec1, "days": 0, "offer": False},
            {"job_idx": 2, "cand_idx": 2, "status": ApplicationStatus.SHORTLISTED.value, "rec": rec1, "days": 0, "offer": False},
            {"job_idx": 3, "cand_idx": 3, "status": ApplicationStatus.INTERVIEW_SCHEDULED.value, "rec": rec2, "days": 3, "offer": False},
            {"job_idx": 4, "cand_idx": 4, "status": ApplicationStatus.INTERVIEW_SCHEDULED.value, "rec": rec2, "days": 5, "offer": False},
            {"job_idx": 5, "cand_idx": 5, "status": ApplicationStatus.APPLIED.value, "rec": rec2, "days": 0, "offer": False},
        ]

        for spec in app_specs:
            job = all_job_objs[spec["job_idx"]]
            cand = student_objs[spec["cand_idx"]]
            app = db.query(JobApplication).filter(JobApplication.job_id == job.id, JobApplication.candidate_id == cand.id).first()
            if not app:
                app = JobApplication(job_id=job.id, candidate_id=cand.id, status=spec["status"])
                db.add(app)
                db.commit()
                db.refresh(app)

                if spec["days"] > 0:
                    inv = db.query(Interview).filter(Interview.application_id == app.id).first()
                    if not inv:
                        inv = Interview(
                            application_id=app.id,
                            interviewer_id=spec["rec"].id,
                            interview_date=now + timedelta(days=spec["days"], hours=4),
                            meeting_link=generate_meet_link(),
                            calendar_event_id=f"gcal_evt_{app.id}_{spec['days']}",
                            status=InterviewStatus.SCHEDULED.value if not spec["offer"] else InterviewStatus.COMPLETED.value
                        )
                        db.add(inv)

                if spec["offer"]:
                    off = db.query(OfferLetter).filter(OfferLetter.application_id == app.id).first()
                    if not off:
                        off = OfferLetter(
                            application_id=app.id,
                            offer_pdf="/uploads/pdfs/offer_letter_app_1.pdf",
                            salary="₹2,000,000 / year",
                            joining_date="2026-09-01",
                            status=OfferStatus.SENT.value
                        )
                        db.add(off)
                db.commit()

        print("[SUCCESS] Multi-tenant seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
