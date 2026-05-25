# ITJob - Recruitment Management System with Taxonomy-based Job Recommendation

## 1. Introduction

ITJob is a recruitment management website for the Information Technology field, integrated with a taxonomy-based job recommendation module.

The system supports main recruitment features such as candidate management, CV management, company management, job posting management, job application management, interview scheduling, notification management, and personalized job recommendation for candidates.

The recommendation module uses candidate CV data, job posting data, skill data, and IT skill taxonomy to build Candidate profiles and Job profiles. These profiles are then used to calculate matching scores and generate Top-K recommended jobs for each candidate.

## 2. Technologies Used

- Frontend: ReactJS, TypeScript
- Business Backend: NestJS, TypeScript, Prisma ORM
- Database: PostgreSQL
- Recommendation Service: FastAPI, Python
- Data Processing: Pandas, NumPy
- Embedding Model: multilingual-e5
- Source Code Management: Git/GitHub

## 3. Main Project Structure

```bash
.
├── frontend/                                  # ReactJS frontend
├── backend/                                   # NestJS business backend
├── backend_fastAPI_auto_sync_pipeline_real/   # FastAPI recommendation service
├── notebook/Embedding/                        # Embedding generation scripts
└── README.md