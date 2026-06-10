#!/usr/bin/env bash
# Chạy metric 06 bằng .venv (tránh lỗi kernel Jupyter sai Python).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
exec "$ROOT/.venv/bin/python" "$ROOT/recommendation/notebook/Embedding/notebooks/run_06_metrics.py"
