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
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
ROUTES_PATH = ROOT / "seo" / "public-routes.json"
SITE_HOST = "theadaply.com"
SITE_ORIGIN = f"https://{SITE_HOST}"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
ZERO_SHA = "0" * 40
KEY_PATTERN = re.compile(r"^[a-zA-Z0-9-]{8,128}$")
MAX_URLLIST = 10_000

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

DENIED_PATH_SEGMENTS = frozenset(
    {
        "app",
        "dashboard",
        "login",
        "signin",
        "signup",
        "auth",
        "account",
        "admin",
        "api",
        "user",
        "users",
        "settings",
    }
)

SECTION_BY_LOC = {
    "/thesis/": "thesis/",
    "/case-study/": "case-study/",
    "/case_study_evals/": "case_study_evals/",
    "/vision/": "vision/",
}

HOMEPAGE_PREFIXES = ("static/",)


def log_event(event: str, **fields: object) -> None:
    record = {"event": event, **fields}
    print(json.dumps(record, sort_keys=True), flush=True)


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
    matches = []
    for p in root.iterdir():
        if not p.is_file() or not p.name.endswith(".txt"):
            continue
        key_part = p.name[:-4]
        if KEY_PATTERN.match(key_part):
            matches.append(p)
    matches.sort(key=lambda x: x.name)
    if len(matches) != 1:
        raise SystemExit(
            f"expected exactly one IndexNow key file matching <key>.txt at repo root, found {len(matches)}"
        )
    return matches[0]


def validate_key(key: str) -> None:
    if not KEY_PATTERN.match(key):
        raise SystemExit("IndexNow key must be 8-128 characters from [a-zA-Z0-9-]")


def read_key(key_file: Path) -> str:
    key = key_file.read_text(encoding="utf-8")
    if key != key.strip() or "\n" in key.strip():
        raise SystemExit(f"key file {key_file.name} must contain the key only with no extra bytes")
    key = key.strip()
    validate_key(key)
    if key_file.stem != key:
        raise SystemExit("key file name must match key contents")
    return key


def denylist_reason(url: str) -> str | None:
    try:
        parsed = urllib.parse.urlparse(url)
    except ValueError:
        return "malformed_url"
    if parsed.scheme != "https" or parsed.netloc != SITE_HOST:
        return "host_not_allowlisted"
    if parsed.query or parsed.fragment:
        return "query_or_fragment"
    path = parsed.path or "/"
    if "design-options" in path:
        return "denied_path_pattern"
    segments = [s for s in path.split("/") if s]
    for seg in segments:
        if seg in DENIED_PATH_SEGMENTS:
            return "denied_path_pattern"
    return None


def filter_allowlisted_urls(
    urls: Iterable[str],
    allow: set[str],
    *,
    context: str,
) -> list[str]:
    accepted: list[str] = []
    for url in urls:
        reason = denylist_reason(url)
        if reason:
            log_event("url_skipped", url=url, reason=reason, context=context)
            continue
        if url not in allow:
            log_event("url_skipped", url=url, reason="not_in_allowlist", context=context)
            continue
        accepted.append(url)
        log_event("url_included", url=url, reason="allowlisted", context=context)
    return sorted(set(accepted))


def is_ignored_path(path: str) -> bool:
    norm = path.replace("\\", "/")
    if norm.endswith(".txt") and KEY_PATTERN.match(Path(norm).stem):
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


def build_path_to_urls(data: dict, root: Path = ROOT) -> dict[str, set[str]]:
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
            section = root / prefix
            if section.is_dir():
                for file in section.rglob("*"):
                    if file.is_file():
                        rel = file.relative_to(root).as_posix()
                        if is_material_file(rel):
                            add(rel, url)
        if loc == "/":
            static = root / "static"
            if static.is_dir():
                for file in static.rglob("*"):
                    if file.is_file():
                        add(file.relative_to(root).as_posix(), url)
    return mapping


def material_paths_for_url(url: str, data: dict, root: Path = ROOT) -> list[str]:
    site = data["site"].rstrip("/")
    if not url.startswith(site):
        return []
    loc = url[len(site) :]
    if loc == "":
        loc = "/"
    route = next((r for r in data["routes"] if r["loc"] == loc), None)
    if route is None:
        return []
    paths: set[str] = {route["source"].replace("\\", "/")}
    source = route["source"]
    if loc == "/":
        static = root / "static"
        if static.is_dir():
            for file in static.rglob("*"):
                if file.is_file():
                    paths.add(file.relative_to(root).as_posix())
    elif loc in SECTION_BY_LOC:
        prefix = SECTION_BY_LOC[loc]
        section = root / prefix
        if section.is_dir():
            for file in section.rglob("*"):
                if file.is_file():
                    rel = file.relative_to(root).as_posix()
                    if is_material_file(rel):
                        paths.add(rel)
    elif loc.endswith(".md"):
        paths.add(source.replace("\\", "/"))
    return sorted(p for p in paths if (root / p).is_file())


def content_hash_for_url(url: str, data: dict, root: Path = ROOT) -> str:
    digest = hashlib.sha256()
    for rel in material_paths_for_url(url, data, root):
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update((root / rel).read_bytes())
    return digest.hexdigest()


def git_show_file(ref: str, rel_path: str, root: Path = ROOT) -> str | None:
    proc = subprocess.run(
        ["git", "show", f"{ref}:{rel_path}"],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    return proc.stdout


def load_routes_at_ref(ref: str, root: Path = ROOT) -> dict | None:
    raw = git_show_file(ref, "seo/public-routes.json", root)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def git_changed_files(before: str, after: str, root: Path = ROOT) -> tuple[list[str], list[str]]:
    def run_diff(rev_range: list[str], diff_filter: str | None = None) -> list[str]:
        cmd = ["git", "diff", "--name-only"]
        if diff_filter:
            cmd.append(f"--diff-filter={diff_filter}")
        cmd.extend(rev_range)
        proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True, check=False)
        if proc.returncode != 0:
            return []
        return [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()]

    changed: list[str] = []
    deleted: list[str] = []
    if before and before != ZERO_SHA and after:
        changed = run_diff([before, after])
        deleted = run_diff([before, after], "D")
        if changed or deleted:
            return changed, deleted
    if after:
        changed = run_diff([f"{after}~1", after])
        deleted = run_diff([f"{after}~1", after], "D")
        if changed or deleted:
            return changed, deleted
    changed = run_diff(["HEAD~1", "HEAD"])
    deleted = run_diff(["HEAD~1", "HEAD"], "D")
    return changed, deleted


def changed_files_to_urls(changed: Iterable[str], data: dict, root: Path = ROOT) -> list[str]:
    path_map = build_path_to_urls(data, root)
    allow = set(canonical_urls(data))
    urls: set[str] = set()
    for path in changed:
        norm = path.replace("\\", "/")
        if norm == "seo/public-routes.json":
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


def detect_deleted_urls(
    before: str,
    after: str,
    current: dict,
    deleted_paths: Iterable[str],
    root: Path = ROOT,
) -> list[str]:
    if not before or before == ZERO_SHA:
        return []
    previous = load_routes_at_ref(before, root)
    if previous is None:
        return []
    prev_allow = set(canonical_urls(previous))
    curr_allow = set(canonical_urls(current))
    removed_routes = prev_allow - curr_allow

    path_map_prev = build_path_to_urls(previous, root)
    from_deleted_files: set[str] = set()
    for path in deleted_paths:
        norm = path.replace("\\", "/")
        if norm == "seo/public-routes.json":
            continue
        for url in path_map_prev.get(norm, ()):
            if url in prev_allow:
                from_deleted_files.add(url)
        if not path_map_prev.get(norm):
            for route in previous["routes"]:
                if path_maps_to_loc(norm, route["loc"], route["source"]):
                    site = previous["site"].rstrip("/")
                    loc = route["loc"]
                    url = f"{site}/" if loc == "/" else f"{site}{loc}"
                    if url in prev_allow:
                        from_deleted_files.add(url)

    deleted = sorted(removed_routes | from_deleted_files)
    for url in deleted:
        if url not in prev_allow:
            continue
        log_event("url_included", url=url, reason="removed_public_route", context="deletion")
    return [u for u in deleted if u in prev_allow]


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


def filter_by_content_hash(
    urls: Iterable[str],
    data: dict,
    state: dict[str, str],
    root: Path = ROOT,
) -> tuple[list[str], dict[str, str]]:
    pending: list[str] = []
    new_hashes: dict[str, str] = {}
    for url in urls:
        digest = content_hash_for_url(url, data, root)
        new_hashes[url] = digest
        if state.get(url) == digest:
            log_event("url_skipped", url=url, reason="unchanged_content_hash", context="dedup")
            continue
        pending.append(url)
        log_event("url_included", url=url, reason="content_changed", context="dedup")
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


def build_indexnow_payload(host: str, key: str, urls: list[str]) -> dict[str, object]:
    validate_key(key)
    if not urls:
        raise ValueError("urlList must not be empty")
    if len(urls) > MAX_URLLIST:
        raise ValueError(f"urlList exceeds IndexNow maximum of {MAX_URLLIST}")
    key_location = f"https://{host}/{key}.txt"
    key_host = urllib.parse.urlparse(key_location).netloc
    if key_host != host:
        raise ValueError("keyLocation host must match host field")
    for url in urls:
        reason = denylist_reason(url)
        if reason:
            raise ValueError(f"urlList contains denied URL: {url} ({reason})")
        if urllib.parse.urlparse(url).netloc != host:
            raise ValueError("urlList URLs must belong to host")
    return {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls,
    }


def http_get(url: str, timeout: float) -> tuple[int, bytes]:
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "theadaply-indexnow/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def wait_for_deploy(
    urls: list[str],
    key: str,
    host: str,
    timeout_sec: float,
    poll_interval: float,
    removed_urls: set[str],
) -> bool:
    key_url = f"https://{host}/{key}.txt"
    deadline = time.monotonic() + timeout_sec
    key_ok = False
    while time.monotonic() < deadline:
        status, body = http_get(key_url, timeout=15)
        text = body.decode("utf-8", errors="replace").strip()
        log_event("deploy_poll", resource="key_file", url=key_url, http_status=status)
        if status == 200 and text == key:
            key_ok = True
            break
        time.sleep(poll_interval)
    if not key_ok:
        log_event("deploy_wait_failed", reason="key_file_not_live", url=key_url)
        return False

    def ready(status: int, url: str) -> bool:
        try:
            code = int(status)
        except (TypeError, ValueError):
            return False
        if url in removed_urls:
            return code in (404, 410)
        return code == 200

    pending = list(urls)
    while time.monotonic() < deadline:
        still: list[str] = []
        for url in pending:
            status, _ = http_get(url, timeout=15)
            expect = "404_or_410" if url in removed_urls else "200"
            log_event("deploy_poll", resource="page", url=url, http_status=status, expect=expect)
            if not ready(status, url):
                still.append(url)
        if not still:
            return True
        pending = still
        time.sleep(poll_interval)

    log_event(
        "deploy_wait_partial",
        pending_count=len(pending),
        pending_urls=pending,
    )
    return False


def submit_indexnow(
    host: str,
    key: str,
    urls: list[str],
    dry_run: bool,
    max_attempts: int = 4,
) -> bool:
    if not urls:
        log_event("submit_skipped", reason="empty_url_list")
        return True
    payload = build_indexnow_payload(host, key, urls)
    body = json.dumps(payload).encode("utf-8")
    if dry_run:
        log_event("submit_dry_run", endpoint=INDEXNOW_ENDPOINT, url_count=len(urls))
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
            retry_after = None
        except urllib.error.HTTPError as exc:
            status = exc.code
            resp_body = exc.read()
            retry_after = exc.headers.get("Retry-After")
        except urllib.error.URLError as exc:
            log_event("submit_attempt", attempt=attempt, http_status=0, error="network", detail=str(exc.reason))
            status = 0
            resp_body = b""
            retry_after = None
        else:
            log_event("submit_attempt", attempt=attempt, http_status=status, url_count=len(urls))

        kind = classify_response(status)
        if kind == "success":
            log_event("submit_success", http_status=status, url_count=len(urls))
            return True
        if kind == "fatal":
            log_event("submit_fatal", http_status=status, message=fatal_message(status))
            if resp_body:
                print(resp_body.decode("utf-8", errors="replace"), file=sys.stderr)
            return False

        delay = float(retry_after) if retry_after and str(retry_after).isdigit() else min(60.0, 2.0**attempt)
        delay += random.uniform(0, 1.0)
        log_event("submit_retry", attempt=attempt, http_status=status, delay_seconds=round(delay, 2))
        time.sleep(delay)

    log_event("submit_failed", reason="max_attempts_exceeded")
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

    deleted_urls: list[str] = []
    before = args.before.strip()
    after = args.after.strip() or _git_head()

    if args.urls.strip():
        raw = [u.strip() for u in args.urls.split(",") if u.strip()]
        candidates = filter_allowlisted_urls(raw, allow, context="explicit_urls")
        update_candidates = candidates
    elif args.all:
        update_candidates = filter_allowlisted_urls(sorted(allow), allow, context="all")
    else:
        changed, deleted_paths = git_changed_files(before, after)
        if not changed and not deleted_paths:
            log_event("run_complete", reason="no_changed_files")
            return 0
        deleted_urls = detect_deleted_urls(before, after, data, deleted_paths)
        deleted_urls = filter_allowlisted_urls(deleted_urls, set(deleted_urls), context="deletion")
        route_change = "seo/public-routes.json" in changed
        updates = changed_files_to_urls(changed, data)
        if route_change:
            for url in canonical_urls(data):
                updates.append(url)
        update_candidates = filter_allowlisted_urls(updates, allow, context="push")

    state = load_state(args.state_file)
    for url in deleted_urls:
        state.pop(url, None)
        log_event("state_cleared", url=url, reason="removed_route")

    to_submit_updates, new_hashes = filter_by_content_hash(update_candidates, data, state)
    removed_set = set(deleted_urls)
    to_submit = sorted(set(to_submit_updates) | removed_set)

    if not to_submit:
        log_event("submit_skipped", reason="no_urls_after_filters")
        return 0

    log_event("submit_plan", update_count=len(to_submit_updates), removed_count=len(deleted_urls), total=len(to_submit))

    if not args.dry_run and not args.skip_wait:
        if not wait_for_deploy(to_submit, key, args.host, args.wait_timeout, args.poll_interval, removed_set):
            log_event("submit_skipped", reason="deploy_wait_failed")
            return 0

    ok = submit_indexnow(args.host, key, to_submit, dry_run=args.dry_run)
    if ok and not args.dry_run:
        for url in to_submit_updates:
            state[url] = new_hashes[url]
        save_state(args.state_file, state)
    if not ok and not args.dry_run:
        log_event("submit_warning", reason="non_blocking_failure")
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