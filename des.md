build: python notebook/Embedding/generate_db_embeddings.py
kill -9 $(lsof -ti :3000)
uvicorn app.main:app --reload --port 8000
cd backend_fastAPI_auto_sync_pipeline_real  
source .venv/bin/activate