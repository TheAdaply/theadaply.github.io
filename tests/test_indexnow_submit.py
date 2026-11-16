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
        {"loc": "/example/", "source": "example/index.html"},
    ],
}

PREV_ROUTES = {
    "site": "https://theadaply.com",
    "routes": SAMPLE_ROUTES["routes"],
}

CURR_ROUTES = {
    "site": "https://theadaply.com",
    "routes": [r for r in SAMPLE_ROUTES["routes"] if r["loc"] != "/example/"],
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

    def test_public_routes_json_not_material_mapped(self) -> None:
        urls = in_.changed_files_to_urls(["seo/public-routes.json"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])

    def test_dedupe_urls(self) -> None:
        urls = in_.changed_files_to_urls(
            ["vision/index.html", "vision/app.js"],
            SAMPLE_ROUTES,
        )
        self.assertEqual(urls, ["https://theadaply.com/vision/"])


class DenylistTests(unittest.TestCase):
    def test_query_string_rejected(self) -> None:
        self.assertEqual(in_.denylist_reason("https://theadaply.com/?x=1"), "query_or_fragment")

    def test_fragment_rejected(self) -> None:
        self.assertEqual(in_.denylist_reason("https://theadaply.com/vision/#top"), "query_or_fragment")

    def test_wrong_host_rejected(self) -> None:
        self.assertEqual(in_.denylist_reason("https://evil.example/"), "host_not_allowlisted")
        self.assertEqual(in_.denylist_reason("http://theadaply.com/"), "host_not_allowlisted")

    def test_denied_segments(self) -> None:
        for path in (
            "/app/",
            "/dashboard/settings",
            "/login",
            "/signin/",
            "/signup",
            "/auth/callback",
            "/account",
            "/admin",
            "/api/v1",
            "/user/123",
            "/users/",
            "/settings/profile",
        ):
            self.assertEqual(
                in_.denylist_reason(f"https://theadaply.com{path}"),
                "denied_path_pattern",
                path,
            )

    def test_design_options_rejected(self) -> None:
        self.assertEqual(in_.denylist_reason("https://theadaply.com/design-options/"), "denied_path_pattern")

    def test_filter_blocks_denied_even_if_in_allowlist(self) -> None:
        allow = {"https://theadaply.com/login/"}
        out = in_.filter_allowlisted_urls(["https://theadaply.com/login/"], allow, context="test")
        self.assertEqual(out, [])


class DeletionTests(unittest.TestCase):
    def test_route_removed_from_json(self) -> None:
        with mock.patch.object(in_, "load_routes_at_ref", return_value=PREV_ROUTES):
            deleted = in_.detect_deleted_urls(
                "before",
                "after",
                CURR_ROUTES,
                [],
            )
        self.assertEqual(deleted, ["https://theadaply.com/example/"])

    def test_deleted_source_maps_via_previous_allowlist(self) -> None:
        with mock.patch.object(in_, "load_routes_at_ref", return_value=PREV_ROUTES):
            deleted = in_.detect_deleted_urls(
                "before",
                "after",
                CURR_ROUTES,
                ["example/index.html"],
            )
        self.assertIn("https://theadaply.com/example/", deleted)

    def test_deletion_not_in_previous_allowlist_ignored(self) -> None:
        with mock.patch.object(in_, "load_routes_at_ref", return_value=CURR_ROUTES):
            deleted = in_.detect_deleted_urls(
                "before",
                "after",
                CURR_ROUTES,
                ["secret/page.html"],
            )
        self.assertEqual(deleted, [])


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


class PayloadSpecTests(unittest.TestCase):
    KEY = "e01f2ec2078f89bdc23373993cc8dccc"
    URL = "https://theadaply.com/"

    def test_build_payload_shape(self) -> None:
        payload = in_.build_indexnow_payload(in_.SITE_HOST, self.KEY, [self.URL])
        self.assertEqual(payload["host"], "theadaply.com")
        self.assertEqual(payload["key"], self.KEY)
        self.assertEqual(
            payload["keyLocation"],
            f"https://theadaply.com/{self.KEY}.txt",
        )
        self.assertEqual(payload["urlList"], [self.URL])

    def test_denied_url_in_list_raises(self) -> None:
        with self.assertRaises(ValueError):
            in_.build_indexnow_payload(in_.SITE_HOST, self.KEY, ["https://theadaply.com/admin/"])

    def test_url_list_max(self) -> None:
        urls = [f"https://theadaply.com/page{i}/" for i in range(in_.MAX_URLLIST + 1)]
        with self.assertRaises(ValueError):
            in_.build_indexnow_payload(in_.SITE_HOST, self.KEY, urls)

    def test_key_validation_length(self) -> None:
        with self.assertRaises(SystemExit):
            in_.validate_key("short")
        in_.validate_key("a" * 8)
        in_.validate_key("a" * 128)


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
    def test_read_key_rejects_trailing_newline(self) -> None:
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


class AllowlistTests(unittest.TestCase):
    def test_unknown_path_never_submitted(self) -> None:
        urls = in_.changed_files_to_urls(["demo/secret.html"], SAMPLE_ROUTES)
        self.assertEqual(urls, [])


if __name__ == "__main__":
    unittest.main()