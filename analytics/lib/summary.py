"""
Notebook Summary Generator

Standardized YAML output for Astro pages. Called from notebook final cells.
Outputs to: public/analysis/{project_id}/{notebook_id}.yaml
"""

import yaml
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class Metric:
    """A single metric with optional delta and context."""
    label: str
    value: str
    delta: Optional[str] = None
    delta_direction: Optional[str] = None  # "up" | "down" | "neutral"
    context: Optional[str] = None


@dataclass
class NotebookSummary:
    """Standardized notebook summary schema."""
    title: str
    status: str  # "significant" | "not_significant" | "inconclusive" | "error"
    decision: str  # One-line recommendation
    metrics: list[Metric] = field(default_factory=list)

    # Optional sections
    power_analysis: Optional[str] = None
    warnings: list[str] = field(default_factory=list)
    methodology: Optional[str] = None

    # Metadata
    generated_at: Optional[str] = None
    notebook_path: Optional[str] = None


def write_notebook_summary(
    project_id: str,
    notebook_id: str,
    title: str,
    status: str,
    decision: str,
    metrics: list[dict],
    power_analysis: Optional[str] = None,
    warnings: Optional[list[str]] = None,
    methodology: Optional[str] = None
) -> str:
    """
    Write standardized YAML summary for Astro consumption.

    Args:
        project_id: Project folder name (e.g., "ab-simulator")
        notebook_id: Notebook identifier (e.g., "ab-test-analysis")
        title: Display title
        status: One of "significant", "not_significant", "inconclusive", "error"
        decision: One-line actionable recommendation
        metrics: List of metric dicts with keys: label, value, delta?, delta_direction?, context?
        power_analysis: Optional power analysis summary
        warnings: Optional list of warning strings
        methodology: Optional methodology note

    Returns:
        Path to written YAML file
    """
    from datetime import datetime

    # Resolve output path relative to repo root
    # This works both locally and in CI
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent.parent
    output_dir = repo_root / "public" / "analysis" / project_id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{notebook_id}.yaml"

    # Build summary
    summary = {
        "title": title,
        "status": status,
        "decision": decision,
        "metrics": metrics,
        "generated_at": datetime.now().isoformat(),
    }

    if power_analysis:
        summary["power_analysis"] = power_analysis
    if warnings:
        summary["warnings"] = warnings
    if methodology:
        summary["methodology"] = methodology

    # Write YAML
    with open(output_path, "w") as f:
        yaml.dump(summary, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    print(f"✓ Summary written: {output_path.relative_to(repo_root)}")
    return str(output_path)
