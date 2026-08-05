"""Small dependency-free API load test for a running AssetFlow gateway."""
import argparse
import concurrent.futures
import json
import statistics
import time
import urllib.error
import urllib.request


def request(base, path, token=None, method="GET", body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = None if body is None else json.dumps(body).encode()
    started = time.perf_counter()
    try:
        req = urllib.request.Request(base.rstrip("/") + path, data=payload, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as response:
            response.read()
            return response.status, (time.perf_counter() - started) * 1000
    except urllib.error.HTTPError as error:
        return error.code, (time.perf_counter() - started) * 1000
    except Exception:
        return 0, (time.perf_counter() - started) * 1000


def login(base, email, password):
    req = urllib.request.Request(
        base.rstrip("/") + "/api/auth/login",
        data=json.dumps({"email": email, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.loads(response.read())
    return data["data"]["accessToken"]


def percentile(values, p):
    ordered = sorted(values)
    index = min(len(ordered) - 1, int(round((p / 100) * (len(ordered) - 1))))
    return ordered[index]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--email", default="admin.alpha@assetflow.test")
    parser.add_argument("--password", default="AdminA@12345")
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--requests", type=int, default=120)
    args = parser.parse_args()
    token = login(args.base, args.email, args.password)
    paths = ["/asset/asset", "/dashboard", "/report/assets", "/notification"]
    jobs = [paths[i % len(paths)] for i in range(args.requests)]

    def run(path):
        return path, request(args.base, path, token)

    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(run, jobs))
    elapsed = time.perf_counter() - started
    durations = [result[1][1] for result in results]
    passed = [result for result in results if 200 <= result[1][0] < 300]
    failed = [result for result in results if result[1][0] < 200 or result[1][0] >= 300]
    print(f"requests={len(results)} workers={args.workers} elapsed_s={elapsed:.2f} throughput_rps={len(results)/elapsed:.2f}")
    print(f"passed={len(passed)} failed={len(failed)} p50_ms={percentile(durations,50):.1f} p95_ms={percentile(durations,95):.1f} p99_ms={percentile(durations,99):.1f} max_ms={max(durations):.1f}")
    for path in paths:
        subset = [result[1] for result in results if result[0] == path]
        print(f"{path}: count={len(subset)} avg_ms={statistics.mean(item[1] for item in subset):.1f} statuses={sorted({item[0] for item in subset})}")
    if failed:
        print("sample_failures=", failed[:5])
        raise SystemExit(1)


if __name__ == "__main__":
    main()
