#!/usr/bin/env python3
"""Snapshot the current SDK wire shapes and runtime semantic support for the site.

The website builds from the JSON snapshot. Updating it requires explicit source
paths, so builds never depend on a particular neighboring checkout layout.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


def identifier(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


def referenced_names(value: object) -> set[str]:
    if isinstance(value, list):
        return set().union(*(referenced_names(item) for item in value))
    if not isinstance(value, dict):
        return set()
    result: set[str] = set()
    if "$ref" in value:
        reference = value["$ref"]
        if not isinstance(reference, str) or not reference.startswith("#/$defs/"):
            raise ValueError(f"Only local definition references are supported: {reference}")
        result.add(reference.removeprefix("#/$defs/"))
    for item in value.values():
        result.update(referenced_names(item))
    return result


def type_label(schema: dict) -> str:
    if "$ref" in schema:
        return schema["$ref"].removeprefix("#/$defs/")
    if "const" in schema:
        return json.dumps(schema["const"], ensure_ascii=False)
    if "enum" in schema:
        return " | ".join(json.dumps(value, ensure_ascii=False) for value in schema["enum"])
    union = schema.get("oneOf", schema.get("anyOf"))
    if union and "type" not in schema:
        return " | ".join(type_label(branch) for branch in union)
    kind = schema.get("type", "JSON value")
    if isinstance(kind, list):
        return " | ".join(kind)
    if kind == "array":
        return f"Array<{type_label(schema.get('items', {}))}>"
    if kind == "object" and "properties" not in schema:
        additional = schema.get("additionalProperties", True)
        return f"Map<string, {type_label(additional)}>" if isinstance(additional, dict) else "JSON object"
    return kind


def fields(schema: dict) -> list[dict]:
    required = set(schema.get("required", []))
    return [
        {
            "name": name,
            "type": type_label(value),
            "required": name in required,
            "description": value.get("description", ""),
            "references": sorted(referenced_names(value)),
            "constraints": {
                key: value[key]
                for key in ("minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "minLength", "maxLength", "minItems", "maxItems", "pattern", "format", "default")
                if key in value
            },
        }
        for name, value in schema.get("properties", {}).items()
    ]


def snapshot(schema_path: Path, support_path: Path) -> dict:
    schema_bytes = schema_path.read_bytes()
    support_bytes = support_path.read_bytes()
    schema = json.loads(schema_bytes)
    support = json.loads(support_bytes)
    definitions = schema["$defs"]
    missing = referenced_names(schema) - definitions.keys()
    if missing:
        raise ValueError(f"Unresolved schema definitions: {sorted(missing)}")

    def shape(value: dict) -> dict:
        name = value.get("$ref", "").removeprefix("#/$defs/")
        resolved = definitions[name] if name else value
        return {"type": type_label(value), "reference": name or None, "fields": fields(resolved)}

    commands = []
    for command in sorted(schema["commands"], key=lambda item: item["name"]):
        name = command["name"]
        if not name.startswith("Mimic."):
            raise ValueError(f"Expected a Mimic extension command: {name}")
        declaration = support[name]
        if not declaration.get("status") or not declaration.get("notes"):
            raise ValueError(f"Missing semantic support declaration: {name}")
        commands.append({
            "id": identifier(name.removeprefix("Mimic.")),
            "name": name,
            "scope": command["scope"],
            "description": command.get("description") or declaration["notes"],
            "status": declaration["status"],
            "notes": declaration["notes"],
            "params": shape(command["params"]),
            "result": shape(command["result"]),
        })
    if len({command["id"] for command in commands}) != len(commands):
        raise ValueError("Duplicate command anchor")
    if {command["name"] for command in commands} != {name for name in support if name.startswith("Mimic.")}:
        raise ValueError("SDK schema and runtime Mimic command inventories differ")
    return {
        "metadata": {
            "title": schema["title"],
            "schemaSource": "schema/mimic/protocol.json",
            "supportSource": "internal/cdp/protocol_support.json",
            "schemaSha256": hashlib.sha256(schema_bytes).hexdigest(),
            "supportSha256": hashlib.sha256(support_bytes).hexdigest(),
            "description": "Current SDK wire shapes with runtime semantic support. Shape coverage is not a release availability or Chrome compatibility guarantee.",
        },
        "commands": commands,
        "definitions": [
            {
                "id": f"type-{identifier(name)}",
                "name": name,
                "type": type_label(value),
                "description": value.get("description", ""),
                "fields": fields(value),
                "references": sorted(referenced_names(value)),
                "schema": value,
            }
            for name, value in sorted(definitions.items())
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schema", type=Path, required=True)
    parser.add_argument("--support", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "src/lib/mimic-reference.json")
    parser.add_argument("--check", action="store_true", help="Fail if the committed snapshot differs; do not write.")
    options = parser.parse_args()
    try:
        payload = json.dumps(snapshot(options.schema, options.support), indent=2, ensure_ascii=False) + "\n"
        if options.check:
            if not options.output.is_file() or options.output.read_text(encoding="utf-8") != payload:
                raise ValueError("API reference snapshot is stale; run this command without --check")
            print("API reference snapshot matches its sources")
        else:
            options.output.parent.mkdir(parents=True, exist_ok=True)
            options.output.write_text(payload, encoding="utf-8", newline="\n")
            print(f"Wrote {options.output.name}")
        return 0
    except (OSError, ValueError, KeyError) as error:
        print(f"API reference: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
