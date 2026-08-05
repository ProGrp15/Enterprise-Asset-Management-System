"""Provision three isolated tenants with 50 assets and run a concurrent read load test."""
import argparse
import concurrent.futures
import json
import statistics
import time
import urllib.error
import urllib.request


def call(base, path, token=None, method="GET", payload=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(base.rstrip("/") + path, data=data, headers=headers, method=method)
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read()
            return response.status, (time.perf_counter() - started) * 1000, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        return error.code, (time.perf_counter() - started) * 1000, {}
    except Exception:
        return 0, (time.perf_counter() - started) * 1000, {}


def data(response):
    return response[2].get("data", response[2])


def percentile(values, p):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(round((p / 100) * (len(ordered) - 1))))]


def provision(base, index, assets):
    stamp = str(int(time.time() * 1000))
    password = "ScaleAdmin@123"
    email = f"scale.admin.{stamp}.{index}@assetflow.test"
    status, _, response = call(base, "/api/auth/register-company", method="POST", payload={
        "companyName": f"AssetFlow Scale Company {index} {stamp}",
        "officialEmail": email, "mobileNumber": f"99999999{index:02d}",
        "industry": "Technology", "companySize": "1-50", "address": "Scale Street",
        "city": "Pune", "state": "Maharashtra", "country": "India", "postalCode": "411001",
        "adminName": f"Scale Admin {index}", "password": password,
    })
    if status < 200 or status >= 300:
        raise RuntimeError(f"company registration failed: {status}")
    admin = data((status, 0, response))
    token = admin["accessToken"]
    category = data(call(base, "/api/category", token, "POST", {"categoryName": f"Scale Laptop {index}"}))["category_id"]
    vendor = data(call(base, "/api/vendor", token, "POST", {"vendorName": f"Scale Vendor {index}", "email": f"vendor{index}@assetflow.test"}))["vendor_id"]
    location = data(call(base, "/api/location", token, "POST", {"name": f"Scale Office {index}", "city": "Pune"}))["location_id"]
    ids = []
    for offset in range(assets):
        status, _, response = call(base, "/api/asset", token, "POST", {
            "categoryId": category, "vendorId": vendor, "locationId": location,
            "assetName": f"Scale Asset {index}-{offset}", "assetTag": f"SCALE-{index}-{stamp}-{offset}",
            "serialNumber": f"SCALE-SN-{index}-{stamp}-{offset}", "purchaseDate": "2026-08-05",
            "purchaseCost": 1000, "status": "AVAILABLE",
        })
        if status < 200 or status >= 300:
            raise RuntimeError(f"asset creation failed: {status}")
        ids.append(data((status, 0, response))["asset_id"])
    return {"email": email, "password": password, "token": token, "asset_ids": ids}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--companies", type=int, default=3)
    parser.add_argument("--assets", type=int, default=50)
    parser.add_argument("--workers", type=int, default=30)
    parser.add_argument("--requests", type=int, default=300)
    args = parser.parse_args()
    per_company = [args.assets // args.companies] * args.companies
    for i in range(args.assets % args.companies):
        per_company[i] += 1
    tenants = [provision(args.base, i + 1, count) for i, count in enumerate(per_company)]
    for tenant in tenants:
        status, _, response = call(args.base, "/api/asset", tenant["token"])
        rows = data((status, 0, response))
        if status != 200 or len(rows) != len(tenant["asset_ids"]):
            raise RuntimeError(f"tenant asset isolation failed: status={status} count={len(rows)}")
    cross_status, _, _ = call(args.base, f"/api/asset/{tenants[0]['asset_ids'][0]}", tenants[1]["token"])
    if cross_status != 404:
        raise RuntimeError(f"cross-tenant asset access was not blocked: status={cross_status}")
    jobs = [(tenant["token"], path) for i in range(args.requests) for tenant, path in [(tenants[i % len(tenants)], ["/api/asset", "/api/notification", "/api/audit"][i % 3])]]
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda job: (job[1], call(args.base, job[1], job[0])), jobs))
    elapsed = time.perf_counter() - started
    durations = [result[1][1] for result in results]
    failed = [result for result in results if not 200 <= result[1][0] < 300]
    print(f"companies={args.companies} assets={args.assets} requests={len(results)} workers={args.workers} elapsed_s={elapsed:.2f} throughput_rps={len(results)/elapsed:.2f}")
    print(f"passed={len(results)-len(failed)} failed={len(failed)} p50_ms={percentile(durations, 50):.1f} p95_ms={percentile(durations, 95):.1f} p99_ms={percentile(durations, 99):.1f} max_ms={max(durations):.1f}")
    if failed:
        print("sample_failures=", failed[:5])
        raise SystemExit(1)


if __name__ == "__main__":
    main()
