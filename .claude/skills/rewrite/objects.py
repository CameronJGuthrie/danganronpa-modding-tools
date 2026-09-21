#!/usr/bin/env python3
"""List text lines of a linscript with speaker and OnObject context, plus Meta() state.

usage: objects.py <file.linscript>
"""
import re, sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().split("\n")
speaker = obj = None
print(f"== {path}")
for i, raw in enumerate(lines, 1):
    s = raw.strip()
    if m := re.match(r"OnObject\((\w+)\)", s):
        obj = m.group(1); print(f"--- OnObject({obj})")
    elif m := re.match(r"Speaker\((\w+)\)", s):
        speaker = m.group(1)
    elif m := re.match(r'(Raw)?Text\("((?:[^"\\]|\\.)*)"', s):
        kind = "RAW " if m.group(1) else "    "
        print(f"{i:5} {kind}{speaker or '?':8} {m.group(2)[:100]}")
    elif m := re.match(r"Option\((\w+), \"", s):
        print(f"{i:5}      option   {s[:100]}")

numeric = sorted({int(n) for n in re.findall(r"\b(?:OnObject|ObjectState)\((\d+)[,)]", "\n".join(lines))})
handlers = {int(n) for n in re.findall(r"^OnObject\((\d+)\)", "\n".join(lines), re.M)}
print("\n== numeric object ids:", numeric)
print("   with handler:", sorted(handlers & set(numeric)))
print("   state-only (no handler):", sorted(set(numeric) - handlers))
meta = "\n".join(lines).split("\nMeta()\n")
print("== Meta():", meta[1].strip() if len(meta) > 1 else "(none)")
