import ast
import logging
import pathlib


def _assert_no_direct_supabase_imports(py_file: pathlib.Path, tree: ast.AST) -> None:
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                assert not name.name.startswith("supabase"), (
                    f"Architecture Violation in {py_file.name}: direct Supabase import '{name.name}' is forbidden for agents."
                )
        elif isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("supabase"):
            raise AssertionError(
                f"Architecture Violation in {py_file.name}: direct Supabase import 'from {node.module}' is forbidden for agents."
            )


def test_no_supabase_imports():
    """
    Ensure that agent code does not import the Supabase SDK directly.
    Agent code must go through sanctioned application services and wrappers.
    """
    agents_dir = pathlib.Path(__file__).resolve().parent.parent.parent / "app" / "agents"

    for py_file in agents_dir.rglob("*.py"):
        try:
            tree = ast.parse(py_file.read_text())
        except Exception as e:
            logging.error(f"Failed to parse {py_file}: {e}")
            continue

        _assert_no_direct_supabase_imports(py_file, tree)
