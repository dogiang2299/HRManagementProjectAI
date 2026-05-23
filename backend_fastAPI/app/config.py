import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
APP_NAME = os.getenv("APP_NAME", "HR Recommendation Service")
PIPELINE_VERSION = os.getenv("PIPELINE_VERSION", "hr_rec_v1")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing")

BACKEND_UPLOAD_DIR = os.getenv("BACKEND_UPLOAD_DIR")
CV_UPLOAD_SUBDIR = os.getenv("CV_UPLOAD_SUBDIR", "cv")

if not BACKEND_UPLOAD_DIR:
    raise RuntimeError("BACKEND_UPLOAD_DIR is missing")