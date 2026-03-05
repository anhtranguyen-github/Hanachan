import json
import os

def explore_schema(obj, schema, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else k
            if path not in schema:
                schema[path] = {"types": set(), "count": 0}
            schema[path]["count"] += 1
            type_name = type(v).__name__
            if v is None:
                type_name = "NoneType"
            schema[path]["types"].add(type_name)
            explore_schema(v, schema, path)
    elif isinstance(obj, list):
        if not obj:
             # empty list, path already recorded by caller if it was a dict value
             pass
        for item in obj:
            # Items in list share the same base path but might have different structures
            # We record them under path[]
            list_path = prefix + "[]"
            if list_path not in schema:
                schema[list_path] = {"types": set(), "count": 0}
            schema[list_path]["count"] += 1
            type_name = type(item).__name__
            if item is None:
                type_name = "NoneType"
            schema[list_path]["types"].add(type_name)
            explore_schema(item, schema, list_path)

def analyze_file(file_path):
    schema = {} 
    total_lines = 0
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"\n{'='*20}\nAnalyzing {file_path}...\n{'='*20}")
    
    is_jsonl = file_path.endswith('.jsonl')
    
    try:
        if is_jsonl:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line: continue
                    total_lines += 1
                    data = json.loads(line)
                    explore_schema(data, schema)
        else: # assuming standard JSON
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    total_lines = len(data)
                    for item in data:
                        explore_schema(item, schema)
                else:
                    total_lines = 1
                    explore_schema(data, schema)
    except Exception as e:
        print(f"Error reading file: {e}")
        return
                
    if total_lines == 0:
        print("No data found.")
        return

    # Presence tracking
    schema_presence = {} 
    if is_jsonl:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line: continue
                data = json.loads(line)
                paths = set()
                def get_paths(o, p=""):
                    if isinstance(o, dict):
                        for k, v in o.items():
                            curr = f"{p}.{k}" if p else k
                            paths.add(curr); get_paths(v, curr)
                    elif isinstance(o, list):
                        for item in o:
                            curr = p + "[]"; paths.add(curr); get_paths(item, curr)
                get_paths(data)
                for p in paths:
                    schema_presence[p] = schema_presence.get(p, 0) + 1
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            full_data = json.load(f)
            records = full_data if isinstance(full_data, list) else [full_data]
            for record in records:
                paths = set()
                def get_paths(o, p=""):
                    if isinstance(o, dict):
                        for k, v in o.items():
                            curr = f"{p}.{k}" if p else k
                            paths.add(curr); get_paths(v, curr)
                    elif isinstance(o, list):
                        for item in o:
                            curr = p + "[]"; paths.add(curr); get_paths(item, curr)
                get_paths(record)
                for p in paths:
                    schema_presence[p] = schema_presence.get(p, 0) + 1

    print(f"\nSchema Table (Total records: {total_lines}):\n")
    print("| Field Path | Types | Presence |")
    print("|:-----------|:------|:---------|")
    for path in sorted(schema.keys()):
        info = schema[path]
        types_str = ", ".join(sorted(info["types"]))
        presence_count = schema_presence.get(path, 0)
        presence_pct = (presence_count / total_lines) * 100
        print(f"| {path} | {types_str} | {presence_pct:.1f}% |")

if __name__ == "__main__":
    analyze_file("/home/tra01/project/hanachan_v2_final/data/vocab.jsonl")
    analyze_file("/home/tra01/project/hanachan_v2_final/data/radicals.json")
    analyze_file("/home/tra01/project/hanachan_v2_final/data/kanji.jsonl")

