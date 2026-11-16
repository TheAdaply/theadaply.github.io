#!/usr/bin/env python3
"""IndexNow submission for theadaply.com (stdlib only)."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
ROUTES_PATH = ROOT / "seo" / "public-routes.json"
SITE_HOST = "theadaply.com"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
ZERO_SHA = "0" * 40
KEY_FILE_PATTERN = re.compile(r"^[0-9a-f]{32}\.txt$")

MATERIAL_SUFFIXES = frozenset(
    {
        ".html",
        ".md",
        ".js",
        ".json",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".svg",
        ".ico",
        ".gif",
        ".zip",
        ".txt",
    }
)

IGNORED_PREFIXES = (
    ".github/",
    "scripts/",
    "seo/",
    "design-options/",
    "blog/",
    "thesis/v2/",
)

IGNORED_BASENAMES = frozenset(
    {
        "README.md",
        "sitemap.xml",
        "robots.txt",
        "CNAME",
        ".nojekyll",
    }
)

SECTION_BY_LOC = {
    "/thesis/": "thesis/",
    "/case-study/": "case-study/",
    "/case_study_evals/": "case_study_evals/",
    "/vision/": "vision/",
}

HOMEPAGE_PREFIXES = ("static/",)


def load_routes(path: Path = ROUTES_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_urls(data: dict) -> list[str]:
    site = data["site"].rstrip("/")
    urls: list[str] = []
    for route in data["routes"]:
        loc = route["loc"]
        url = f"{site}/" if loc == "/" else f"{site}{loc}"
        urls.append(url)
    return urls


def discover_key_file(root: Path = ROOT) -> Path:
    matches = sorted(p for p in root.iterdir() if p.is_file() and KEY_FILE_PATTERN.match(p.name))
    if len(matches) != 1:
        raise SystemExit(
            f"expected exactly one IndexNow key file matching [0-9a-f]{{32}}.txt at repo root, found {len(matches)}"
        )
    return matches[0]


def read_key(key_file: Path) -> str:
    key = key_file.read_text(encoding="utf-8")
    if key != key.strip() or "\n" in key.strip() or len(key.strip()) != 32:
        raise SystemExit(f"key file {key_file.name} must contain exactly 32 hex chars with no extra bytes")
    return key.strip()


def is_ignored_path(path: str) -> bool:
    norm = path.replace("\\", "/")
    if KEY_FILE_PATTERN.match(Path(norm).name):
        return True
    if norm in IGNORED_BASENAMES or Path(norm).name.startswith("."):
        return True
    if norm.endswith(".css"):
        return True
    if norm.endswith((".yml", ".yaml", ".sh", ".py")) and not norm.startswith("case"):
        if norm.startswith("scripts/") or norm.startswith(".github/"):
            return True
    for prefix in IGNORED_PREFIXES:
        if norm.startswith(prefix):
            return True
    return False


def is_material_file(path: str) -> bool:
    if is_ignored_path(path):
        return False
    suffix = Path(path).suffix.lower()
    return suffix in MATERIAL_SUFFIXES


def path_maps_to_loc(path: str, loc: str, source: str) -> bool:
    norm = path.replace("\\", "/")
    if norm == source:
        return True
    if loc == "/" and (norm == "index.html" or norm.startswith(HOMEPAGE_PREFIXES)):
        return True
    if loc == f"/{source}" or loc.endswith(source):
        pass
    if loc.endswith(".md") and norm == source:
        return True
    if loc in SECTION_BY_LOC:
        prefix = SECTION_BY_LOC[loc]
        if not norm.startswith(prefix):
            return False
        return is_material_file(norm)
    if loc in ("/for-agents/", "/demo/", "/example/"):
        return norm == source
    if loc in ("/llms.txt", "/FOR-AGENTS.md"):
        return norm == source
    return False


def build_path_to_urls(data: dict) -> dict[str, set[str]]:
    site = data["site"].rstrip("/")
    mapping: dict[str, set[str]] = {}

    def add(path: str, url: str) -> None:
        mapping.setdefault(path.replace("\\", "/"), set()).add(url)

    for route in data["routes"]:
        loc = route["loc"]
        source = route["source"]
        url = f"{site}/" if loc == "/" else f"{site}{loc}"
        add(source, url)
        if loc in SECTION_BY_LOC:
            prefix = SECTION_BY_LOC[loc]
            section = ROOT / prefix
            if section.is_dir():
                for file in section.rglob("*"):
                    if file.is_file():
                        rel = file.relative_to(ROOT).as_posix()
                        if is_material_file(rel):
                            add(rel, url)
        if loc == "/":
            static = ROOT / "static"
            if static.is_dir():
                for file in static.rglob("*"):
                    if file.is_file():
                        add(file.relative_to(ROOT).as_posix(), url)
    return mapping


def material_paths_for_url(url: str, data: dict) -> list[str]:
    site = data["site"].rstrip("/")
    loc = url[len(site) :] if url.startswith(site) else None
    if loc is None:
        return []
    if loc == "":
        loc = "/"
    route = next((r for r in data["routes"] if r["loc"] == loc), None)
    if route is None:
        return []
    paths: set[str] = {route["source"].replace("\\", "/")}
    source = route["source"]
    if loc == "/":
        static = ROOT / "static"
        if static.is_dir():
            for file in static.rglob("*"):
                if file.is_file():
                    paths.add(file.relative_to(ROOT).as_posix())
    elif loc in SECTION_BY_LOC:
        prefix = SECTION_BY_LOC[loc]
        section = ROOT / prefix
        if section.is_dir():
            for file in section.rglob("*"):
                if file.is_file():
                    rel = file.relative_to(ROOT).as_posix()
                    if is_material_file(rel):
                        paths.add(rel)
    elif loc.endswith(".md"):
        paths.add(source.replace("\\", "/"))
    return sorted(p for p in paths if (ROOT / p).is_file())


def content_hash_for_url(url: str, data: dict) -> str:
    digest = hashlib.sha256()
    for rel in material_paths_for_url(url, data):
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update((ROOT / rel).read_bytes())
    return digest.hexdigest()


def git_changed_files(before: str, after: str, root: Path = ROOT) -> list[str]:
    def run_diff(rev_range: list[str]) -> list[str]:
        proc = subprocess.run(
            ["git", "diff", "--name-only", *rev_range],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            return []
        return [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()]

    if before and before != ZERO_SHA and after:
        files = run_diff([before, after])
        if files:
            return files
    if after:
        files = run_diff([f"{after}~1", after])
        if files:
            return files
    proc = subprocess.run(
        ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode == 0:
        return [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()]
    return []


def changed_files_to_urls(changed: Iterable[str], data: dict) -> list[str]:
    path_map = build_path_to_urls(data)
    allow = set(canonical_urls(data))
    urls: set[str] = set()
    for path in changed:
        norm = path.replace("\\", "/")
        if norm == "seo/public-routes.json":
            urls.update(allow)
            continue
        if is_ignored_path(norm):
            continue
        if not is_material_file(norm):
            continue
        for url in path_map.get(norm, ()):
            if url in allow:
                urls.add(url)
        if not path_map.get(norm):
            for route in data["routes"]:
                if path_maps_to_loc(norm, route["loc"], route["source"]):
                    site = data["site"].rstrip("/")
                    loc = route["loc"]
                    url = f"{site}/" if loc == "/" else f"{site}{loc}"
                    if url in allow:
                        urls.add(url)
    return sorted(urls)


def load_state(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_state(path: Path, state: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def filter_by_content_hash(urls: Iterable[str], data: dict, state: dict[str, str]) -> tuple[list[str], dict[str, str]]:
    pending: list[str] = []
    new_hashes: dict[str, str] = {}
    for url in urls:
        digest = content_hash_for_url(url, data)
        new_hashes[url] = digest
        if state.get(url) != digest:
            pending.append(url)
    return pending, new_hashes


def classify_response(status: int) -> str:
    if status in (200, 202):
        return "success"
    if status in (400, 403, 422):
        return "fatal"
    if status == 429 or status >= 500:
        return "retry"
    return "fatal"


def fatal_message(status: int) -> str:
    if status == 403:
        return "IndexNow 403: key not verified at keyLocation (check root key file is live)"
    if status == 422:
        return "IndexNow 422: URL/host mismatch (host must match verified site)"
    if status == 400:
        return "IndexNow 400: bad request (check JSON payload)"
    return f"IndexNow {status}: non-retryable error"


def http_get(url: str, timeout: float) -> tuple[int, bytes]:
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "theadaply-indexnow/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def wait_for_live(
    urls: list[str],
    key: str,
    host: str,
    timeout_sec: float,
    poll_interval: float,
) -> bool:
    key_url = f"https://{host}/{key}.txt"
    deadline = time.monotonic() + timeout_sec
    key_ok = False
    while time.monotonic() < deadline:
        status, body = http_get(key_url, timeout=15)
        text = body.decode("utf-8", errors="replace").strip()
        if status == 200 and text == key:
            key_ok = True
            break
        time.sleep(poll_interval)
    if not key_ok:
        print(f"warning: key file not live at {key_url} within {timeout_sec}s; skipping IndexNow", file=sys.stderr)
        return False

    live: list[str] = []
    pending = list(urls)
    while pending and time.monotonic() < deadline:
        still: list[str] = []
        for url in pending:
            status, _ = http_get(url, timeout=15)
            if status == 200:
                live.append(url)
            else:
                still.append(url)
        if not still:
            break
        pending = still
        time.sleep(poll_interval)

    if pending:
        print(
            f"warning: {len(pending)} URL(s) not HTTP 200 on {host} before timeout; proceeding with "
            f"{len(live)} confirmed live URL(s)",
            file=sys.stderr,
        )
    return bool(live)


def submit_indexnow(
    host: str,
    key: str,
    urls: list[str],
    dry_run: bool,
    max_attempts: int = 4,
) -> bool:
    if not urls:
        print("no URLs to submit")
        return True
    key_location = f"https://{host}/{key}.txt"
    payload = {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls,
    }
    body = json.dumps(payload).encode("utf-8")
    if dry_run:
        print("dry-run: would POST", INDEXNOW_ENDPOINT)
        print(json.dumps(payload, indent=2))
        return True

    attempt = 0
    while attempt < max_attempts:
        attempt += 1
        req = urllib.request.Request(
            INDEXNOW_ENDPOINT,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "theadaply-indexnow/1.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                resp_body = resp.read()
        except urllib.error.HTTPError as exc:
            status = exc.code
            resp_body = exc.read()
            retry_after = exc.headers.get("Retry-After")
        except urllib.error.URLError as exc:
            print(f"warning: network error on attempt {attempt}: {exc.reason}", file=sys.stderr)
            status = 0
            resp_body = b""
            retry_after = None
        else:
            retry_after = None

        kind = classify_response(status)
        if kind == "success":
            print(f"IndexNow submit OK ({status}) for {len(urls)} URL(s)")
            return True
        if kind == "fatal":
            print(fatal_message(status), file=sys.stderr)
            if resp_body:
                print(resp_body.decode("utf-8", errors="replace"), file=sys.stderr)
            return False

        delay = float(retry_after) if retry_after and retry_after.isdigit() else min(60.0, 2.0**attempt)
        delay += random.uniform(0, 1.0)
        print(f"IndexNow attempt {attempt} got {status}; retrying in {delay:.1f}s", file=sys.stderr)
        time.sleep(delay)

    print("warning: IndexNow submit failed after retries", file=sys.stderr)
    return False


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", default="", help="push before SHA")
    parser.add_argument("--after", default="", help="push after SHA (default: HEAD)")
    parser.add_argument("--key-file", type=Path, help="path to <key>.txt (default: auto-discover)")
    parser.add_argument("--host", default=SITE_HOST)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all", action="store_true", help="submit all allowlisted URLs")
    parser.add_argument("--urls", default="", help="comma-separated canonical URLs")
    parser.add_argument("--state-file", type=Path, default=ROOT / "seo" / ".indexnow-state.json")
    parser.add_argument("--wait-timeout", type=float, default=600.0)
    parser.add_argument("--poll-interval", type=float, default=15.0)
    parser.add_argument("--skip-wait", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    data = load_routes()
    allow = set(canonical_urls(data))
    key_file = args.key_file or discover_key_file()
    key = read_key(key_file)

    if args.urls.strip():
        candidates = [u.strip() for u in args.urls.split(",") if u.strip()]
    elif args.all:
        candidates = sorted(allow)
    else:
        after = args.after.strip() or _git_head()
        changed = git_changed_files(args.before.strip(), after)
        if not changed:
            print("no changed files detected in push range; nothing to submit")
            return 0
        candidates = changed_files_to_urls(changed, data)

    candidates = sorted({u for u in candidates if u in allow})
    if not candidates:
        print("no allowlisted material URLs to submit")
        return 0

    state = load_state(args.state_file)
    to_submit, new_hashes = filter_by_content_hash(candidates, data, state)
    to_submit = sorted(set(to_submit))
    if not to_submit:
        print("all candidate URLs unchanged since last successful submit; skipping API call")
        return 0

    print(f"IndexNow: {len(to_submit)} URL(s) to submit (of {len(candidates)} candidate(s))")
    for url in to_submit:
        print(" ", url)

    if not args.dry_run and not args.skip_wait:
        if not wait_for_live(to_submit, key, args.host, args.wait_timeout, args.poll_interval):
            return 0

    ok = submit_indexnow(args.host, key, to_submit, dry_run=args.dry_run)
    if ok and not args.dry_run:
        state.update({u: new_hashes[u] for u in to_submit})
        save_state(args.state_file, state)
    if not ok and not args.dry_run:
        print("warning: IndexNow submit did not succeed (non-blocking)", file=sys.stderr)
    return 0


def _git_head() -> str:
    proc = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.stdout.strip()


if __name__ == "__main__":
    raise SystemExit(main())