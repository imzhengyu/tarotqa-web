#!/usr/bin/env python3
"""生成中国省市两级经纬度数据 → web/public/china-geo.json（供星盘出生地选择使用）。

    python scripts/build_china_geo.py                 # 默认从 GeoNames 拉取（需网络/代理）
    python scripts/build_china_geo.py --refresh       # 忽略本地缓存重新下载

数据源：GeoNames（https://download.geonames.org/export/dump/，CC BY 4.0）
  * CN.zip 里的 cities1000.txt：地名 + 经纬度 + admin1(省) / admin2(地级市) 编码 + 人口
  * admin1CodesASCII.txt / admin2Codes.txt：编码 → 名称
做法：
  * 以 ADM2 行政区要素确定「地级市」清单（保证每个地级市都有，不会漏深圳这类没有 cities1000 条目的市）；
  * 坐标优先取该市**人口最多的地名点**（PPL/PPLA/PPLC，比行政区质心更贴近真实城区）；
  * 地名点缺失或与行政区中心偏离 > 3°（多半是 admin2 归属错误）时回退到 ADM2 坐标。
输出结构：
  { "source": "...", "license": "CC BY 4.0", "generatedAt": "...",
    "provinces": [ { "name": "北京市", "cities": [ { "name": "北京市", "lat": 39.905, "lon": 116.401 } ] } ] }
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import urllib.error
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "china-geo.json"
CACHE = ROOT / "scripts" / ".geo-cache"

# GeoNames 的 CN 数据不含港澳台，这里按官方公布的城市坐标补齐（省级单位共 34 个）
SUPPLEMENT = {
    "香港特别行政区": [{"name": "香港", "lat": 22.3193, "lon": 114.1694}],
    "澳门特别行政区": [{"name": "澳门", "lat": 22.1987, "lon": 113.5439}],
    "台湾省": [
        {"name": "台北", "lat": 25.033, "lon": 121.5654},
        {"name": "新北", "lat": 25.0169, "lon": 121.4628},
        {"name": "桃园", "lat": 24.9936, "lon": 121.301},
        {"name": "台中", "lat": 24.1477, "lon": 120.6736},
        {"name": "台南", "lat": 22.9997, "lon": 120.227},
        {"name": "高雄", "lat": 22.6273, "lon": 120.3014},
    ],
}

MIRRORS = [
    "https://download.geonames.org/export/dump",
    "https://download.geonames.org/export/dump",  # 保留占位，便于将来加镜像
]

DEBUG = False
MAX_PPL_DRIFT = 3.0  # 地名点与行政区中心的最大允许偏差（度）


def download(name: str, refresh: bool) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / name
    if cached.exists() and not refresh:
        return cached.read_bytes()

    last_error: Exception | None = None
    for base in dict.fromkeys(MIRRORS):
        url = f"{base}/{name}"
        try:
            print(f"  下载 {url}")
            with urllib.request.urlopen(url, timeout=120) as response:
                data = response.read()
            cached.write_bytes(data)
            return data
        except (urllib.error.URLError, OSError) as error:
            last_error = error
            print(f"    失败：{error}")
    raise SystemExit(f"[geo] 下载 {name} 失败：{last_error}")


def parse_admin_codes(raw: bytes) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for line in raw.decode("utf-8", "replace").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].startswith("CN."):
            mapping[parts[0]] = parts[1]
    return mapping


CJK = re.compile(r"[\u4e00-\u9fff]")


def chinese_name(alternates: str, fallback: str) -> str:
    """GeoNames 的 alternatenames 里通常带中文（如 上海,上海市,沪,Shanghai）。

    注意要取**最长**的中文名：里面还混着单字简称（粤/沪/川），取最短会把"广东省"变成"粤"。
    超过 12 字的通常是别名/古名，排除。
    """
    candidates = [part.strip() for part in alternates.split(",") if part.strip()]
    # 必须是"纯中文"：alternatenames 里混着日文（内モンゴル自治区）等变体
    chinese = [name for name in candidates if re.fullmatch(r"[\u4e00-\u9fff]{2,12}", name)]
    if not chinese:
        return fallback
    return max(chinese, key=len)


def build(refresh: bool) -> dict:
    admin1 = parse_admin_codes(download("admin1CodesASCII.txt", refresh))
    admin2 = parse_admin_codes(download("admin2Codes.txt", refresh))
    archive = zipfile.ZipFile(io.BytesIO(download("CN.zip", refresh)))
    if DEBUG:
        print(f"[debug] admin1 编码 {len(admin1)} 条，admin2 编码 {len(admin2)} 条")
        print(f"[debug] CN.zip 条目：{archive.namelist()[:5]}")
        print(f"[debug] admin1 样例：{list(admin1.items())[:2]}")

    # 取行政区要素：ADM1 = 省/直辖市，ADM2 = 地级市；同时记录各地级市内人口最多的地名点
    provinces_raw: dict[str, dict] = {}
    cities_raw: dict[tuple[str, str], dict] = {}
    places_raw: dict[tuple[str, str], dict] = {}
    names = archive.namelist()
    entry = next((name for name in names if name.upper() == "CN.TXT"), None)
    if not entry:
        entry = max(
            (name for name in names if name.lower().endswith(".txt") and "readme" not in name.lower()),
            key=lambda name: archive.getinfo(name).file_size,
            default=None,
        )
    if not entry:
        raise SystemExit(f"[geo] CN.zip 内没有可用数据文件：{names[:5]}")
    with archive.open(entry) as handle:
        for index, raw_line in enumerate(handle):
            fields = raw_line.decode("utf-8", "replace").rstrip("\n").split("\t")
            if DEBUG and index < 3:
                print(f"[debug] 行{index} 列数={len(fields)} → {fields[:12]}")
            if len(fields) < 15:
                continue
            # GeoNames allCountries 列序：0 geonameid / 1 name / 4 lat / 5 lon / 6 class
            # 7 code / 8 country / 9 cc2 / 10 admin1 / 11 admin2 / 14 population
            name = fields[1]
            lat, lon = fields[4], fields[5]
            feature_class = fields[6]
            feature_code = fields[7]
            admin1_code, admin2_code = fields[10], fields[11]
            population = int(fields[14] or 0)

            if feature_class != "A" or not admin1_code:
                if feature_class == "P" and population > 0 and admin1_code and admin2_code:
                    key = (f"CN.{admin1_code}", f"CN.{admin1_code}.{admin2_code}")
                    if key not in places_raw or population > places_raw[key]["population"]:
                        places_raw[key] = {"lat": float(lat), "lon": float(lon), "population": population}
                continue
            admin1_key = f"CN.{admin1_code}"
            if feature_code == "ADM1":
                # 人口用于同名去重（保留人口最大的那个）
                if admin1_key not in provinces_raw or population > provinces_raw[admin1_key]["population"]:
                    provinces_raw[admin1_key] = {
                        "name": chinese_name(fields[3], name),
                        "lat": float(lat),
                        "lon": float(lon),
                        "population": population,
                    }
            elif feature_code == "ADM2" and admin2_code:
                key = (admin1_key, f"{admin1_key}.{admin2_code}")
                if key not in cities_raw or population > cities_raw[key]["population"]:
                    cities_raw[key] = {
                        "name": chinese_name(fields[3], name),
                        "lat": float(lat),
                        "lon": float(lon),
                        "population": population,
                    }

    provinces: dict[str, list[dict]] = defaultdict(list)
    drifted = 0
    for (admin1_key, admin2_key), city in cities_raw.items():
        province = provinces_raw.get(admin1_key)
        if not province or not city["name"]:
            continue
        lat, lon = city["lat"], city["lon"]
        place = places_raw.get((admin1_key, admin2_key))
        if place:
            # 经纬度粗略换算成公里级偏差：1° 纬度 ≈ 111km，经度按 cos(lat) 收缩
            if abs(place["lat"] - lat) <= MAX_PPL_DRIFT and abs(place["lon"] - lon) <= MAX_PPL_DRIFT:
                lat, lon = place["lat"], place["lon"]
            else:
                drifted += 1
                if DEBUG:
                    print(f"[debug] {city['name']} 地名点偏离行政区中心 > {MAX_PPL_DRIFT}°，回退 ADM2 坐标")
        provinces[province["name"]].append({
            "name": city["name"],
            "lat": round(lat, 4),
            "lon": round(lon, 4),
        })
    if DEBUG:
        print(f"[debug] 地名点 {len(places_raw)} 个，偏离回退 {drifted} 个")

    ordered = []
    # 直辖市/特别行政区等没有下级地级市的，本级即一个选项
    for province in provinces_raw.values():
        province["name"] = province["name"] or ""
        provinces.setdefault(province["name"], [])
    for province in provinces_raw.values():
        if not provinces.get(province["name"]):
            provinces[province["name"]] = [{
                "name": province["name"],
                "lat": round(province["lat"], 4),
                "lon": round(province["lon"], 4),
            }]
    for province, cities in SUPPLEMENT.items():
        provinces[province] = cities
    for province in sorted(provinces):
        cities = sorted(provinces[province], key=lambda item: item["name"])
        ordered.append({"name": province, "cities": cities})

    return {
        "source": "GeoNames (ADM1/ADM2 行政区 + 最大人口地名点)",
        "sourceUrl": "https://download.geonames.org/export/dump/",
        "license": "CC BY 4.0",
        "attribution": "Contains data from GeoNames, licensed under CC BY 4.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "granularity": "province-city",
        "provinces": ordered,
    }


def main(argv: list[str] | None = None) -> int:
    global DEBUG
    parser = argparse.ArgumentParser(description="生成省市经纬度数据")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--debug", action="store_true", help="打印数据源解析细节")
    args = parser.parse_args(argv or [])
    DEBUG = args.debug

    data = build(args.refresh)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    province_count = len(data["provinces"])
    city_count = sum(len(item["cities"]) for item in data["provinces"])
    # 中国 34 个省级单位 + 330 个左右地级行政区；低于此数说明数据源解析有问题
    if province_count < 33 or city_count < 330:
        print(f"[geo] 数据量异常：省 {province_count} / 市 {city_count}，请检查数据源")
        return 1
    print(f"已生成 {OUT.relative_to(ROOT)}：{province_count} 个省级、{city_count} 个市级")
    print("  省级名单：" + "、".join(item["name"] for item in data["provinces"]))
    for province, city in (("北京", "北京"), ("上海", "上海"), ("广东", "深圳"), ("四川", "成都")):
        entry = next((item for item in data["provinces"] if province in item["name"]), None)
        cities = entry["cities"] if entry else []
        match = next((c for c in cities if city in c["name"]), None)
        detail = match or f"缺失（该省 {len(cities)} 个城市：{', '.join(c['name'] for c in cities)}）"
        print(f"  校验 {province}/{city}：{detail}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
