"""Vertex AI Search — semantic-only queries against the datastore.

The AnswerAgent calls ``query()`` to pull grounding passages and then
synthesises a final answer with Gemini.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from app.config import settings

log = logging.getLogger(__name__)


@dataclass
class SearchHit:
    title: str
    snippet: str
    uri: str
    score: float = 0.0


def query(text: str, top_k: int = 5) -> list[SearchHit]:
    if not settings.vertex_search_datastore:
        log.warning("VERTEX_SEARCH_DATASTORE not configured — returning empty hits")
        return []

    try:
        from google.cloud import discoveryengine_v1 as de  # type: ignore
    except ImportError:
        log.warning("discoveryengine SDK missing — returning empty hits")
        return []

    client = de.SearchServiceClient()
    serving_config = client.serving_config_path(
        project=settings.gcp_project,
        location=settings.vertex_search_location,
        data_store=settings.vertex_search_datastore,
        serving_config="default_config",
    )

    request = de.SearchRequest(
        serving_config=serving_config,
        query=text,
        page_size=top_k,
        query_expansion_spec=de.SearchRequest.QueryExpansionSpec(
            condition=de.SearchRequest.QueryExpansionSpec.Condition.AUTO,
        ),
        spell_correction_spec=de.SearchRequest.SpellCorrectionSpec(
            mode=de.SearchRequest.SpellCorrectionSpec.Mode.AUTO,
        ),
        # Semantic-only retrieval — no keyword/hybrid yet.
        content_search_spec=de.SearchRequest.ContentSearchSpec(
            snippet_spec=de.SearchRequest.ContentSearchSpec.SnippetSpec(
                return_snippet=True,
            ),
        ),
    )
    hits: list[SearchHit] = []
    for result in client.search(request).results:
        doc = result.document
        derived = dict(doc.derived_struct_data) if doc.derived_struct_data else {}
        snippets = derived.get("snippets") or []
        snippet = ""
        if snippets and isinstance(snippets, list):
            snippet = snippets[0].get("snippet", "") if isinstance(snippets[0], dict) else ""
        hits.append(SearchHit(
            title=str(derived.get("title", doc.id)),
            snippet=str(snippet or derived.get("description", "")),
            uri=str(derived.get("link", derived.get("uri", ""))),
        ))
    return hits
