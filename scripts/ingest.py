#!/usr/bin/env python3
"""Collect public pain-signal candidates for manual review.

This script never writes to the frontend's published data source.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "data" / "ingestion-config.json"
DEFAULT_OUTPUT = ROOT / "data" / "pending-review.json"
USER_AGENT = "OverseasPainRadar-Ingestion/0.1 (+manual-review-only)"


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    parser = _TextExtractor()
    parser.feed(html.unescape(value))
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()


def fetch(url: str, headers: dict[str, str] | None = None) -> bytes:
    request_headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(url, headers=request_headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def fetch_json(url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
    return json.loads(fetch(url, headers).decode("utf-8"))


def stable_id(platform: str, source_url: str) -> str:
    digest = hashlib.sha256(f"{platform}|{source_url}".encode("utf-8")).hexdigest()[:16]
    return f"candidate_{digest}"


def matched_keywords(text: str, keywords: Iterable[str]) -> list[str]:
    haystack = text.casefold()
    return sorted({keyword for keyword in keywords if keyword.casefold() in haystack})


def candidate(
    platform: str,
    source_url: str,
    title: str,
    published_at: str,
    raw_text: str,
    keywords: list[str],
    metadata: dict[str, Any],
) -> dict[str, Any]:
    searchable = f"{title}\n{raw_text}"
    return {
        "id": stable_id(platform, source_url),
        "source_platform": platform,
        "source_url": source_url,
        "source_title": title.strip(),
        "published_at": published_at or "",
        "raw_text": raw_text.strip(),
        "matched_keywords": matched_keywords(searchable, keywords),
        "status": "pending_review",
        "source_verified": False,
        "is_demo": False,
        "ai_extract": {},
        "source_metadata": metadata,
    }


def first_text(node: ET.Element, names: Iterable[str]) -> str:
    wanted = set(names)
    for child in node.iter():
        local_name = child.tag.rsplit("}", 1)[-1]
        if local_name in wanted and child.text:
            return child.text.strip()
    return ""


def collect_reddit(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for feed_url in config.get("feed_urls", []):
        root = ET.fromstring(fetch(feed_url, {"Accept": "application/rss+xml, application/atom+xml"}))
        entries = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1] in {"entry", "item"}]
        for entry in entries:
            title = first_text(entry, ["title"])
            published = first_text(entry, ["published", "updated", "pubDate"])
            raw_text = strip_html(first_text(entry, ["content", "summary", "description"]))
            link = ""
            for link_node in entry.iter():
                if link_node.tag.rsplit("}", 1)[-1] == "link":
                    link = link_node.attrib.get("href") or (link_node.text or "").strip()
                    if link:
                        break
            if not link:
                continue
            results.append(candidate("Reddit", link, title, published, raw_text, keywords, {"feed_url": feed_url}))
    return results


def collect_hn(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    limit = int(config.get("hits_per_query", 30))
    for query in config.get("queries", []):
        params = urllib.parse.urlencode({"query": query, "hitsPerPage": limit})
        payload = fetch_json(f"https://hn.algolia.com/api/v1/search_by_date?{params}")
        for hit in payload.get("hits", []):
            object_id = str(hit.get("objectID") or "")
            hn_url = f"https://news.ycombinator.com/item?id={object_id}" if object_id else ""
            source_url = hit.get("url") or hit.get("story_url") or hn_url
            if not source_url:
                continue
            title = hit.get("title") or hit.get("story_title") or "Hacker News discussion"
            comment_text = strip_html(hit.get("comment_text") or hit.get("story_text"))
            results.append(
                candidate(
                    "Hacker News",
                    source_url,
                    title,
                    hit.get("created_at") or "",
                    comment_text,
                    keywords,
                    {
                        "query": query,
                        "url": hit.get("url"),
                        "story_url": hit.get("story_url"),
                        "hn_url": hn_url,
                        "author": hit.get("author"),
                        "comment_text": comment_text,
                    },
                )
            )
    return results


def collect_github(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    per_page = min(int(config.get("items_per_query", 30)), 100)
    for query in config.get("queries", []):
        params = urllib.parse.urlencode({"q": query, "sort": "created", "order": "desc", "per_page": per_page})
        payload = fetch_json(f"https://api.github.com/search/issues?{params}", headers)
        for item in payload.get("items", []):
            source_url = item.get("html_url") or ""
            if not source_url:
                continue
            body = strip_html(item.get("body"))
            results.append(
                candidate(
                    "GitHub Issues",
                    source_url,
                    item.get("title") or "GitHub issue",
                    item.get("created_at") or "",
                    body,
                    keywords,
                    {
                        "query": query,
                        "html_url": source_url,
                        "repository_url": item.get("repository_url"),
                        "author": (item.get("user") or {}).get("login"),
                    },
                )
            )
    return results


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect candidates into a manual-review queue.")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--source", choices=["all", "reddit", "hn", "github"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and summarize without writing output.")
    args = parser.parse_args()

    config = load_json(args.config, None)
    if not config:
        print(f"Configuration not found or empty: {args.config}", file=sys.stderr)
        return 2

    keywords = list(config.get("match_keywords", []))
    collectors = {
        "reddit": lambda: collect_reddit(config.get("reddit", {}), keywords),
        "hn": lambda: collect_hn(config.get("hacker_news", {}), keywords),
        "github": lambda: collect_github(config.get("github", {}), keywords),
    }
    selected = collectors.keys() if args.source == "all" else [args.source]
    fetched: list[dict[str, Any]] = []
    failures: list[str] = []
    for name in selected:
        try:
            items = collectors[name]()
            fetched.extend(items)
            print(f"{name}: fetched {len(items)} candidates")
        except (urllib.error.URLError, urllib.error.HTTPError, ET.ParseError, json.JSONDecodeError) as exc:
            failures.append(f"{name}: {exc}")
            print(f"{name}: failed: {exc}", file=sys.stderr)

    existing = load_json(args.output, [])
    if not isinstance(existing, list):
        print(f"Output must contain a JSON array: {args.output}", file=sys.stderr)
        return 2
    seen_urls = {item.get("source_url") for item in existing if item.get("source_url")}
    added: list[dict[str, Any]] = []
    for item in fetched:
        if item["source_url"] in seen_urls:
            continue
        seen_urls.add(item["source_url"])
        added.append(item)

    combined = existing + added
    combined.sort(key=lambda item: item.get("published_at") or "", reverse=True)
    if not args.dry_run:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8") as handle:
            json.dump(combined, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
    print(f"added: {len(added)}; skipped duplicates: {len(fetched) - len(added)}; total pending: {len(combined)}")
    if args.dry_run:
        print("dry run: output was not changed")
    if failures:
        print(f"completed with {len(failures)} source error(s)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
