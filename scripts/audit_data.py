"""Audit all rdocs data files for the Career Intelligence Knowledge Base."""

import csv
import io
import json
import os
import zipfile
from collections import Counter
from pathlib import Path

RDOCS = Path(__file__).resolve().parent.parent / "rdocs"
EXTRACTED = RDOCS / "extracted" / "main research files"


def detect_delimiter(first_line: str) -> str:
    """Detect delimiter from header line."""
    if "\t" in first_line:
        return "\t"
    if "|" in first_line:
        return "|"
    return ","


def read_file(path: Path) -> tuple[list[str], list[dict]]:
    """Read CSV/TSV file, return (headers, rows_as_dicts)."""
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    first_line = text.split("\n")[0]
    delim = detect_delimiter(first_line)
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    headers = reader.fieldnames or []
    rows = list(reader)
    return headers, rows


def parse_salary(raw: str) -> tuple[float | None, float | None]:
    """Try to parse salary range strings."""
    if not raw or raw.strip() in ("", "N/A", "Not specified", "-"):
        return None, None
    raw = raw.strip().replace("$", "").replace(",", "").replace("₹", "").replace("INR", "").strip()
    raw = raw.replace("K", "000").replace("k", "000")
    # Handle ranges
    for sep in [" - ", "-", "–", "~", "to"]:
        if sep in raw:
            parts = raw.split(sep, 1)
            try:
                lo = float(parts[0].strip())
                hi = float(parts[1].strip())
                return lo, hi
            except ValueError:
                pass
    # Single value
    try:
        v = float(raw.strip())
        return v, v
    except ValueError:
        return None, None


def audit():
    all_files = []
    # Standalone files
    for f in [RDOCS / "science_careers_research_100.csv", RDOCS / "careers_research_output.tsv", RDOCS / "careers_150_combined.csv"]:
        if f.exists():
            all_files.append(f)
    # Extracted files
    for f in sorted(EXTRACTED.glob("*")):
        if f.suffix in (".csv", ".tsv"):
            all_files.append(f)

    print(f"=" * 80)
    print(f"CAREER INTELLIGENCE DATA AUDIT REPORT")
    print(f"=" * 80)
    print(f"\nTotal files found: {len(all_files)}\n")

    all_careers = []  # (title, file, row_num)
    all_headers = set()
    file_stats = []
    skill_counter = Counter()
    degree_counter = Counter()
    college_counter = Counter()
    exam_counter = Counter()
    scholarship_counter = Counter()
    salary_issues = []
    empty_titles = []
    duplicate_titles = Counter()
    field_coverage = Counter()

    for fpath in all_files:
        headers, rows = read_file(fpath)
        fname = fpath.name
        delimiter = detect_delimiter(open(fpath, encoding="utf-8-sig").readline())

        empty_desc = 0
        salary_parsed = 0
        salary_failed = 0

        for i, row in enumerate(rows, 1):
            title = (row.get("Career Title") or "").strip()
            if not title:
                empty_titles.append((fname, i))
                continue
            all_careers.append((title.lower(), fname, i, row))
            duplicate_titles[title.lower()] += 1
            all_headers.update(headers)

            # Track field coverage
            for h in headers:
                val = (row.get(h) or "").strip()
                if val and val not in ("", "N/A", "Not specified", "-", "None"):
                    field_coverage[h] += 1

            # Parse skills
            for field in ["Required Technical Skills", "Required Soft Skills", "Optional Skills"]:
                raw = (row.get(field) or "").strip()
                if raw and raw not in ("N/A", "-", ""):
                    skills = [s.strip() for s in raw.replace(";", ",").split(",") if s.strip()]
                    for s in skills:
                        skill_counter[s.lower()] += 1

            # Parse degrees
            raw_deg = (row.get("Preferred Degree(s)") or row.get("Top Relevant Degrees") or "").strip()
            if raw_deg and raw_deg not in ("N/A", "-", ""):
                degrees = [d.strip() for d in raw_deg.replace(";", ",").split(",") if d.strip()]
                for d in degrees:
                    degree_counter[d.lower()] += 1

            # Parse colleges
            raw_col = (row.get("Top Colleges / Universities") or "").strip()
            if raw_col and raw_col not in ("N/A", "-", ""):
                colleges = [c.strip() for c in raw_col.replace(";", ",").split(",") if c.strip()]
                for c in colleges:
                    college_counter[c.lower()] += 1

            # Parse exams
            raw_exam = (row.get("Entrance Exams") or "").strip()
            if raw_exam and raw_exam not in ("N/A", "-", ""):
                exams = [e.strip() for e in raw_exam.replace(";", ",").split(",") if e.strip()]
                for e in exams:
                    exam_counter[e.lower()] += 1

            # Parse scholarships
            raw_sch = (row.get("Scholarships") or "").strip()
            if raw_sch and raw_sch not in ("N/A", "-", ""):
                schs = [s.strip() for s in raw_sch.replace(";", ",").split(",") if s.strip()]
                for s in schs:
                    scholarship_counter[s.lower()] += 1

            # Parse salaries
            for sal_field in ["Entry-Level Salary", "Mid-Level Salary", "Senior-Level Salary", "Highest Typical Salary"]:
                raw_sal = (row.get(sal_field) or "").strip()
                if raw_sal and raw_sal not in ("N/A", "-", ""):
                    lo, hi = parse_salary(raw_sal)
                    if lo is None:
                        salary_failed += 1
                        salary_issues.append((fname, i, title, sal_field, raw_sal))
                    else:
                        salary_parsed += 1

            # Check description
            desc = (row.get("Short Description") or row.get("Detailed Description") or "").strip()
            if not desc or desc in ("N/A", "-", ""):
                empty_desc += 1

        file_stats.append({
            "file": fname,
            "delimiter": repr(delimiter),
            "headers": len(headers),
            "rows": len(rows),
            "empty_desc": empty_desc,
            "salary_parsed": salary_parsed,
            "salary_failed": salary_failed,
        })

    # Dedup analysis
    title_counts = {t: c for t, c in duplicate_titles.items() if c > 1}

    print(f"--- FILE SUMMARY ---")
    total_rows = 0
    for fs in file_stats:
        print(f"  {fs['file']}: {fs['rows']} rows, {fs['headers']} cols, delim={fs['delimiter']}, empty_desc={fs['empty_desc']}, salary_ok={fs['salary_parsed']}, salary_fail={fs['salary_failed']}")
        total_rows += fs["rows"]
    print(f"\n  TOTAL ROWS (with duplicates across files): {total_rows}")
    print(f"  UNIQUE CAREER TITLES: {len(duplicate_titles)}")
    print(f"  DUPLICATE TITLES: {len(title_counts)} titles appear 2+ times")

    if title_counts:
        print(f"\n  Top duplicates:")
        for t, c in duplicate_titles.most_common(20):
            print(f"    '{t}' appears {c} times")

    print(f"\n  Empty titles: {len(empty_titles)}")

    print(f"\n--- FIELD COVERAGE ---")
    for h in sorted(field_coverage.keys()):
        pct = field_coverage[h] / len(all_careers) * 100 if all_careers else 0
        print(f"  {h}: {field_coverage[h]}/{len(all_careers)} ({pct:.0f}%)")

    print(f"\n--- ENTITY COUNTS ---")
    print(f"  Unique skills: {len(skill_counter)}")
    print(f"  Unique degrees: {len(degree_counter)}")
    print(f"  Unique colleges: {len(college_counter)}")
    print(f"  Unique exams: {len(exam_counter)}")
    print(f"  Unique scholarships: {len(scholarship_counter)}")

    print(f"\n  Top 20 skills:")
    for s, c in skill_counter.most_common(20):
        print(f"    {s}: {c}")

    print(f"\n  Top 10 degrees:")
    for d, c in degree_counter.most_common(10):
        print(f"    {d}: {c}")

    print(f"\n  Top 10 colleges:")
    for c, n in college_counter.most_common(10):
        print(f"    {c}: {n}")

    print(f"\n  Top 10 exams:")
    for e, c in exam_counter.most_common(10):
        print(f"    {e}: {c}")

    print(f"\n--- SALARY PARSING ---")
    print(f"  Successfully parsed: {sum(fs['salary_parsed'] for fs in file_stats)}")
    print(f"  Failed to parse: {sum(fs['salary_failed'] for fs in file_stats)}")
    if salary_issues:
        print(f"\n  Sample salary parse failures:")
        for fi, row_n, title, field, raw in salary_issues[:10]:
            print(f"    [{fi}] row {row_n} '{title}' field={field}: '{raw}'")

    print(f"\n--- ALL HEADERS ACROSS FILES ---")
    for h in sorted(all_headers):
        print(f"  {h}")

    print(f"\n{'=' * 80}")
    print(f"AUDIT COMPLETE")
    print(f"{'=' * 80}")


if __name__ == "__main__":
    audit()
