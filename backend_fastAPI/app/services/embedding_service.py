from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

MODEL_NAME = "intfloat/multilingual-e5-base"


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load embedding model once per FastAPI process."""
    return SentenceTransformer(MODEL_NAME)


def encode_text(text: str) -> List[float]:
    """Encode text into a normalized embedding vector.

    E5 models work best with a prefix. We use `passage:` for CV/JD documents.
    """
    if not text or not text.strip():
        return []

    model = get_embedding_model()
    embedding = model.encode(
        f"passage: {text}",
        normalize_embeddings=True,
    )
    return [float(value) for value in embedding]
