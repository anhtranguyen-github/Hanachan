import ast
import os
import pathlib

def test_no_supabase_imports():
    """
    Ensure that no file in the fastapi-agents source directory imports 'supabase'.
    This is an architectural rule: agents are untrusted and MUST NOT access Supabase directly.
    """
    app_dir = pathlib.Path(__file__).parent.parent / "app"
    
    for py_file in app_dir.rglob("*.py"):
        try:
            tree = ast.parse(py_file.read_text())
        except Exception:
            continue
            
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    assert not name.name.startswith("supabase"), f"Architecture Violation in {py_file.name}: direct Supabase import '{name.name}' is forbidden for agents."
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.startswith("supabase"):
                    assert False, f"Architecture Violation in {py_file.name}: direct Supabase import 'from {node.module}' is forbidden for agents."
