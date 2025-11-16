"""
Jina.ai REST API Integration

This client uses Jina's public REST APIs for search and content extraction.
- Search API: https://s.jina.ai
- Reader API: https://r.jina.ai

Official Jina API Docs: https://jina.ai/
"""

import os
import httpx
from typing import List, Dict, Optional
from datetime import datetime


class JinaAPIClient:
    """Client for Jina.ai REST APIs (search and reader)."""

    def __init__(self):
        """Initialize Jina API client."""
        self.base_url = "https://api.jina.ai/v1"
        self.api_key = os.getenv("JINA_API_KEY", "")
        self.headers = {}

        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"

        # Note: Without API key, rate limits apply
        self.has_auth = bool(self.api_key)

    async def search_web(self, query: str, max_results: int = 10) -> List[Dict]:
        """
        Search the web using Jina's search API.

        Args:
            query: Search query string
            max_results: Maximum number of results to return

        Returns:
            List of search results with url, title, content, score
        """
        async with httpx.AsyncClient() as client:
            try:
                # Use Jina Search API
                # https://jina.ai/reader/ or https://s.jina.ai
                search_url = f"https://s.jina.ai/{query}"

                response = await client.get(
                    search_url,
                    headers=self.headers,
                    timeout=30.0
                )

                if response.status_code == 200:
                    # Parse Jina search response
                    data = response.json()
                    results = []

                    for item in data.get("data", [])[:max_results]:
                        results.append({
                            "url": item.get("url", ""),
                            "title": item.get("title", ""),
                            "content": item.get("content", ""),
                            "score": item.get("score", 0.0),
                        })

                    return results
                else:
                    print(f"Jina search error: {response.status_code}")
                    return []

            except Exception as e:
                print(f"Jina search exception: {e}")
                return []

    async def read_url(self, url: str) -> Dict:
        """
        Extract content from URL using Jina Reader.

        Args:
            url: URL to extract content from

        Returns:
            Dict with url, title, content, markdown
        """
        async with httpx.AsyncClient() as client:
            try:
                # Use Jina Reader API
                reader_url = f"https://r.jina.ai/{url}"

                response = await client.get(
                    reader_url,
                    headers=self.headers,
                    timeout=30.0
                )

                if response.status_code == 200:
                    # Jina Reader returns markdown directly
                    content = response.text

                    return {
                        "url": url,
                        "content": content,
                        "raw_content": content,
                        "title": url.split("/")[-1],  # Basic title extraction
                    }
                else:
                    print(f"Jina reader error: {response.status_code}")
                    return {}

            except Exception as e:
                print(f"Jina reader exception: {e}")
                return {}

    async def search_arxiv(self, query: str, max_results: int = 10) -> List[Dict]:
        """
        Search arXiv for academic papers.

        Args:
            query: Academic search query
            max_results: Maximum results

        Returns:
            List of academic papers
        """
        # Note: ArXiv search via Jina API not yet implemented
        # Future enhancement: Use Jina's arXiv search endpoint
        print(f"Jina arXiv search: {query} (not yet implemented)")
        return []


# Singleton instance
jina_client = JinaAPIClient()
