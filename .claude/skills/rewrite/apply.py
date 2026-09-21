#!/usr/bin/env python3
"""Apply a JSON map of exact-source-string -> replacement to a linscript, check widths,
then compile/decompile with the CLI and diff the text lines.

usage: apply.py <file.linscript> <map.json>
Run from the repository root (needs projects/cli/src/cli.ts).
"""
import json, os, re, subprocess, sys, tempfile

MAX_LINES, MAX_WIDTH = 2, 56
path, mappath = sys.argv[1], sys.argv[2]
R = json.load(open(mappath, encoding="utf-8"))
src = open(path, encoding="utf-8").read()

def visible(s):
    return re.sub(r"<[^>]*>", "", s).replace('\\"', '"').split("\\n")

bad = []
for k, v in R.items():
    vis = visible(v)
    if len(vis) > MAX_LINES or any(len(l) > MAX_WIDTH for l in vis):
        bad.append(f"WIDTH {[len(l) for l in vis]}: {v}")
    ko, kc = k.count("<thought>"), k.count("</thought>")
    vo, vc = v.count("<thought>"), v.count("</thought>")
    if (ko - kc) != (vo - vc):
        bad.append(f"THOUGHT TAG BALANCE differs from source: {v}")
if bad:
    print("\n".join(bad)); sys.exit(1)

used, count = set(), 0
def sub(m):
    global count
    body = m.group(2)
    if body in R:
        used.add(body); count += 1
        return f'{m.group(1) or ""}Text("{R[body]}"'
    return m.group(0)
out = re.sub(r'(Raw)?Text\("((?:[^"\\]|\\.)*)"', sub, src)
missing = [k for k in R if k not in used]
if missing:
    print("UNMATCHED KEYS:"); [print("  ", k) for k in missing]; sys.exit(1)
open(path, "w", encoding="utf-8").write(out)

tmp = tempfile.mkdtemp()
lin, back = os.path.join(tmp, "out.lin"), os.path.join(tmp, "back.linscript")
cli = ["node", "projects/cli/src/cli.ts", "-s"]
for cmd in (cli + [path, lin], cli + ["-d", lin, back]):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("CLI FAILED:", " ".join(cmd)); print(r.stdout, r.stderr); sys.exit(1)
texts = lambda p: [l.strip() for l in open(p, encoding="utf-8") if re.match(r"\s*(Raw)?Text\(", l)]
a, b = texts(path), texts(back)
if a != b:
    print("TEXT ROUND-TRIP DIFFERS:")
    for x, y in zip(a, b):
        if x != y: print("  src :", x); print("  back:", y)
    sys.exit(1)
print(f"OK: replaced {count} text lines ({len(used)} distinct), round-trip clean")
