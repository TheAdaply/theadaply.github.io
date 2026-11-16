#!/usr/bin/env python3
"""Unit tests for scripts/indexnow_submit.py"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import indexnow_submit as in_  # noqa: E402


SAMPLE_ROUTES = {
    "site": "https://theadaply.com",
    "routes": [
        {"loc": "/", "source": "index.html", "priority": "1.0"},
        {"loc": "/vision/", "source": "vision/index.html"},
        {"loc": "/vision/article.md", "source": "vision/article.md"},
        {"loc": "/case_study_evals/", "source": "case_study_evals/index.html"},
        {"loc": "/llms.txt", "source": "llms.txt"},
    ],
}


class RouteMappingTests(unittest.TestCase):
    def test_homepage_static_maps_to_root(self) -> None:
        urls = in_.changed_files_to_urls(["static/v3.js"], SAMPLE_ROUTES)
        self.assertEqual(urls, ["https://theadaply.com/"])

    def test_vision_content_maps_to_html_route(self) -> None:
        urls = in_.changed_files_to_urls(["vision/content.json"], SAMPLE_ROUTES)
        self.assertEqual(urls, ["https://theadaply.com/vision/"])

    def test_article_md_maps_to_allowlisted_urls(self) -> None:
        urls = in_.changed_files_to_urls(["vision/article.md"], SAMPLE_ROUTES)
        self.assertIn("https://theadaply.com/vision/", urls)
        self.assertIn("https://theadaply.com/vision/article.md", urls)

    def test_css_changes_ignored(self) -> None:
        urls = in_.changed_files_to_urls(["vision/styles.css", "static/v3.css"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])

    def test_workflow_files_ignored(self) -> None:
        urls = in_.changed_files_to_urls(
            [".github/workflows/indexnow.yml", "scripts/indexnow_submit.py"],
            SAMPLE_ROUTES,
        )
        self.assertEqual(urls, [])

    def test_key_file_ignored(self) -> None:
        urls = in_.changed_files_to_urls(["e01f2ec2078f89bdc23373993cc8dccc.txt"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])

    def test_blog_not_in_allowlist(self) -> None:
        urls = in_.changed_files_to_urls(["blog/from-a-failed-task-to-a-better-agent/app.js"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])

    def test_images_under_case_study_evals(self) -> None:
        urls = in_.changed_files_to_urls(
            ["case_study_evals/images/app-execution-trace.png"],
            SAMPLE_ROUTES,
        )
        self.assertEqual(urls, ["https://theadaply.com/case_study_evals/"])

    def test_public_routes_change_submits_all(self) -> None:
        urls = in_.changed_files_to_urls(["seo/public-routes.json"], SAMPLE_ROUTES)
        self.assertEqual(len(urls), len(SAMPLE_ROUTES["routes"]))

    def test_dedupe_urls(self) -> None:
        urls = in_.changed_files_to_urls(
            ["vision/index.html", "vision/app.js"],
            SAMPLE_ROUTES,
        )
        self.assertEqual(urls, ["https://theadaply.com/vision/"])


class AllowlistTests(unittest.TestCase):
    def test_unknown_path_never_submitted(self) -> None:
        urls = in_.changed_files_to_urls(["demo/secret.html"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])


class RetryClassificationTests(unittest.TestCase):
    def test_success_codes(self) -> None:
        for code in (200, 202):
            self.assertEqual(in_.classify_response(code), "success")

    def test_fatal_codes(self) -> None:
        for code in (400, 403, 422):
            self.assertEqual(in_.classify_response(code), "fatal")

    def test_retry_codes(self) -> None:
        self.assertEqual(in_.classify_response(429), "retry")
        self.assertEqual(in_.classify_response(503), "retry")


class ContentHashTests(unittest.TestCase):
    def test_skip_unchanged_urls(self) -> None:
        with mock.patch.object(in_, "content_hash_for_url", return_value="abc"):
            pending, _ = in_.filter_by_content_hash(
                ["https://theadaply.com/"],
                SAMPLE_ROUTES,
                {"https://theadaply.com/": "abc"},
            )
            self.assertEqual(pending, [])


class KeyFileTests(unittest.TestCase):
    def test_read_key_rejects_trailing_newline_content_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "e01f2ec2078f89bdc23373993cc8dccc.txt"
            path.write_text("e01f2ec2078f89bdc23373993cc8dccc\n", encoding="utf-8")
            with self.assertRaises(SystemExit):
                in_.read_key(path)

    def test_read_key_accepts_exact_key(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "e01f2ec2078f89bdc23373993cc8dccc.txt"
            path.write_text("e01f2ec2078f89bdc23373993cc8dccc", encoding="utf-8")
            self.assertEqual(in_.read_key(path), "e01f2ec2078f89bdc23373993cc8dccc")


if __name__ == "__main__":
    unittest.main()