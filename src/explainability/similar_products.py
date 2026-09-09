"""
Similar-product evidence retrieval.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI

Given a query embedding (typically a CLIP embedding of a newly generated
design produced by Dasith's visual-feature module), find the closest real
products by cosine similarity and return them together with any available
outcome metadata (e.g. observed demand), so they can be shown next to a
SHAP explanation as concrete supporting evidence ("designs like this one
performed like this").

This mirrors the cosine-similarity helper already used for exploratory
retrieval in ``notebooks/models/02_visual_features.ipynb`` (Dasith), but is
written as a plain NumPy function with no PyTorch/GPU dependency so it can
run anywhere the embeddings have already been computed and saved to disk.
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd


def normalize(embeddings: np.ndarray) -> np.ndarray:
    """L2-normalize each row of ``embeddings``."""
    embeddings = np.asarray(embeddings, dtype=float)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return embeddings / norms


def find_similar_products(
    query_embedding: Optional[np.ndarray],
    reference_embeddings: np.ndarray,
    reference_metadata: pd.DataFrame,
    top_k: int = 5,
    outcome_column: Optional[str] = None,
) -> pd.DataFrame:
    """Return the ``top_k`` reference rows most similar to ``query_embedding``.

    A real generated-design query embedding must be supplied. Otherwise this
    function exits gracefully without fabricating similarity evidence.
    """
    if query_embedding is None:
        return reference_metadata.iloc[0:0].assign(
            cosine_similarity=[],
            evidence_note="Similar-product integration is pending a real generated-design query embedding from the upstream visual-feature pipeline.",
        )
    if len(reference_embeddings) != len(reference_metadata):
        raise ValueError(
            "reference_embeddings and reference_metadata must have the same "
            f"number of rows ({len(reference_embeddings)} != {len(reference_metadata)})."
        )
    if len(reference_embeddings) == 0:
        return reference_metadata.iloc[0:0].assign(cosine_similarity=[])

    query = np.asarray(query_embedding, dtype=float).reshape(-1)
    refs = np.asarray(reference_embeddings, dtype=float)
    if refs.ndim == 1:
        refs = refs.reshape(1, -1)
    if query.shape[0] != refs.shape[1]:
        raise ValueError(
            f"query embedding dimension ({query.shape[0]}) does not match reference embedding dimension ({refs.shape[1]})."
        )

    query_norm = normalize(query.reshape(1, -1))
    refs_norm = normalize(refs)
    scores = (refs_norm @ query_norm.T).ravel()

    top_k = min(top_k, len(reference_metadata))
    order = np.argsort(-scores)[:top_k]
    result = reference_metadata.iloc[order].copy()
    result["cosine_similarity"] = scores[order]

    if outcome_column and outcome_column in result.columns:
        mean_outcome = result[outcome_column].mean()
        result["evidence_note"] = (
            f"{top_k} visually similar products average "
            f"{outcome_column}={mean_outcome:.2f}"
        )
    else:
        result["evidence_note"] = "visual similarity evidence only"
    return result.reset_index(drop=True)


def load_embeddings(embeddings_path, metadata_path) -> tuple:
    """Convenience loader for the ``(embeddings.npy, metadata.csv)`` pair
    that the visual-feature module is expected to save. Kept separate from
    :func:`find_similar_products` so the retrieval logic itself has no file
    I/O and stays easy to unit test.
    """
    embeddings = np.load(embeddings_path)
    metadata = pd.read_csv(metadata_path)
    return embeddings, metadata
