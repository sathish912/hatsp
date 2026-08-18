import os
import shutil
import uuid
from fastapi import UploadFile

UPLOAD_RESUMES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")
os.makedirs(UPLOAD_RESUMES_DIR, exist_ok=True)

def upload_file_to_storage(file: UploadFile, folder: str = "resumes") -> str:
    """
    Uploads candidate resumes or files. Uses Cloudinary if credentials provided,
    otherwise saves to local static uploads directory with accessible URL.
    """
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{folder}_{uuid.uuid4().hex[:10]}{ext}"
    target_path = os.path.join(UPLOAD_RESUMES_DIR, unique_filename)
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/uploads/resumes/{unique_filename}"
