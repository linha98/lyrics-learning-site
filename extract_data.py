#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
历史脚本：从腾讯文档《无望之泪歌词-语法解析完善》抽取所有歌曲数据，生成 data.json。

当前项目以本地 data.json 为唯一维护来源，日常不要运行本脚本；
运行会重新生成并覆盖 data.json。
每首歌是一个子表(sheet)，通常 4 列：
  A(0) 日文歌词(假名/汉字)  B(1) 罗马音  C(2) 中文  D(3) 语法解释
特殊：无望之泪(000001) 的解释在 G 列(6)。
空行用于分隔段落(stanza)。
"""
import json
import subprocess
import csv
import io
import os

SKILL_DIR = "/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/resources/builtin-plugins/tencent-docs-plugin/skills/tencent-docs"
FILE_ID = "DwlTcwewGyNk"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")


def call(service, tool, args):
    p = subprocess.run(
        ["python3", "tencentdocs.py", "tdoc_call", service, tool, json.dumps(args, ensure_ascii=False)],
        cwd=SKILL_DIR, capture_output=True, text=True,
    )
    if p.returncode != 0:
        raise RuntimeError(p.stderr or p.stdout)
    data = json.loads(p.stdout)
    if "error" in data:
        raise RuntimeError(str(data["error"]))
    return data["result"]


def get_sheets():
    res = call("sheet-mcp", "get_sheet_info", {"file_id": FILE_ID})
    return res["structuredContent"]["sheets"]


def get_csv(sheet_id, end_row=199, end_col=7):
    res = call("sheet-mcp", "get_cell_data", {
        "file_id": FILE_ID, "sheet_id": sheet_id,
        "start_row": 0, "start_col": 0,
        "end_row": end_row, "end_col": end_col,
        "return_csv": True,
    })
    return res["structuredContent"].get("csv_data", "")


def parse_rows(csv_text):
    reader = csv.reader(io.StringIO(csv_text))
    return [row for row in reader]


def build_song(sheet, expl_col):
    """把行解析成 stanzas 列表。每个 stanza 是 lines 列表，line={jp,romaji,cn,note}"""
    rows = parse_rows(get_csv(sheet["sheet_id"]))
    stanzas = []
    cur = []

    def cell(row, i):
        return row[i].strip() if i < len(row) else ""

    for row in rows:
        jp = cell(row, 0)
        romaji = cell(row, 1)
        cn = cell(row, 2)
        note = cell(row, expl_col)
        # 判定空行：主要看前三列都为空
        if not (jp or romaji or cn or note):
            if cur:
                stanzas.append(cur)
                cur = []
            continue
        # 跳过表头行；不同子表可能把 ROMAJI 放在第一列或第二列
        jp_upper = jp.upper()
        romaji_upper = romaji.upper()
        if (
            jp_upper.startswith("KANJI")
            or jp_upper in ("ROMAJI", "ROMA")
            or romaji_upper in ("ROMAJI", "ROMA")
        ):
            continue
        cur.append({"jp": jp, "romaji": romaji, "cn": cn, "note": note})
    if cur:
        stanzas.append(cur)
    # 去掉完全空的 stanza
    stanzas = [s for s in stanzas if any(l["jp"] or l["romaji"] or l["cn"] or l["note"] for l in s)]
    return {
        "id": sheet["sheet_id"],
        "title": sheet["sheet_name"],
        "stanzas": stanzas,
    }


def main():
    sheets = get_sheets()
    songs = []
    for sh in sheets:
        expl_col = 6 if sh["sheet_id"] == "000001" else 3
        song = build_song(sh, expl_col)
        n = sum(len(s) for s in song["stanzas"])
        print(f"  {sh['sheet_name']}: {len(song['stanzas'])} 段, {n} 行")
        songs.append(song)
    out = {"source": "无望之泪歌词-语法解析完善", "songs": songs}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\n已写入 {OUT}，共 {len(songs)} 首歌。")


if __name__ == "__main__":
    main()
