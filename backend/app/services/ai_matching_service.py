import re
from typing import Dict, List, Any, Tuple

def extract_skills_from_text(text: str) -> set:
    if not text:
        return set()
    # Normalize and extract clean alphanumeric skill tokens
    tokens = re.split(r'[,;\n/|•]+', text.lower())
    cleaned = set()
    for token in tokens:
        t = token.strip()
        if len(t) > 1:
            cleaned.add(t)
    return cleaned

def calculate_candidate_match_score(job_title: str, job_desc: str, candidate_skills: str, candidate_exp: str, candidate_resume_text: str = "") -> Dict[str, Any]:
    """
    Computes an AI-powered Candidate Match Score (0 - 100%) against a job posting.
    Returns: match_score, match_grade, match_reasons, matched_skills, missing_skills
    """
    job_text = f"{job_title or ''} {job_desc or ''}".lower()
    candidate_text = f"{candidate_skills or ''} {candidate_exp or ''} {candidate_resume_text or ''}".lower()

    # 1. Skill Matching (50% Weight)
    job_skill_tokens = extract_skills_from_text(job_desc)
    # Common tech skills to check if mentioned in job description
    known_tech = {"react", "python", "fastapi", "mysql", "postgresql", "node.js", "docker", "aws", "kubernetes", "javascript", "typescript", "figma", "css", "html", "cypress", "pytest", "c++", "data science", "pytorch", "pandas", "microservices", "agile", "rest api"}
    
    required_skills = set()
    for tech in known_tech:
        if tech in job_text:
            required_skills.add(tech)
    
    cand_skill_tokens = extract_skills_from_text(candidate_skills)
    matched_skills = []
    missing_skills = []

    if required_skills:
        for sk in required_skills:
            if any(sk in c_sk for c_sk in cand_skill_tokens) or sk in candidate_text:
                matched_skills.append(sk.title())
            else:
                missing_skills.append(sk.title())
        
        skill_ratio = len(matched_skills) / len(required_skills) if required_skills else 0.8
    else:
        skill_ratio = 0.85
        matched_skills = [s.title() for s in list(cand_skill_tokens)[:4]]

    skill_score = min(100, int(skill_ratio * 100))

    # 2. Experience Alignment (30% Weight)
    exp_score = 75
    exp_lower = (candidate_exp or "").lower()
    is_fresher = "fresher" in exp_lower
    is_senior_job = "senior" in job_title.lower() or "lead" in job_title.lower()

    if is_fresher:
        if is_senior_job:
            exp_score = 40
        else:
            exp_score = 90
    else:
        # Extract years from experience text
        numbers = re.findall(r'\d+', exp_lower)
        years = int(numbers[0]) if numbers else 2
        if is_senior_job:
            exp_score = 95 if years >= 3 else 70
        else:
            exp_score = 90

    # 3. Overall Weighted Score
    final_score = int((skill_score * 0.6) + (exp_score * 0.4))
    final_score = max(35, min(99, final_score))

    # Match Grade
    if final_score >= 85:
        grade = "Strong Match"
    elif final_score >= 65:
        grade = "Moderate Match"
    else:
        grade = "Low Match"

    # Match Reasons Explanation
    reasons = []
    if matched_skills:
        reasons.append(f"Matched key skills: {', '.join(matched_skills[:4])}")
    if is_fresher:
        reasons.append("Fresher profile: Entry-level background aligns with junior/graduate position")
    else:
        reasons.append(f"Experience alignment: Profile reflects {candidate_exp or 'relevant industry'} experience")
    if missing_skills:
        reasons.append(f"Skills gap to consider: {', '.join(missing_skills[:2])}")

    return {
        "match_score": final_score,
        "match_grade": grade,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_reasons": reasons
    }
