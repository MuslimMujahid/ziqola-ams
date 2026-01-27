# CSV Seed Data Generator

Generates deterministic Indonesian school data in CSV format for Prisma seeding.

## Usage

1. Install dependencies:

- `pip install -r packages/db/scripts/requirements.txt`

2. Generate CSVs:

- `python packages/db/scripts/generate_school_data.py`

Optional configuration flags:

- `--seed 2026`
- `--female-ratio 0.4`
- `--class-size-min 25`
- `--class-size-max 32`
- `--teacher-count 40`
- `--subject-count 10`
- `--classes-per-grade 8`
- `--tenant-name "Demo School"`
- `--tenant-slug demo-school`
- `--education-level SMA`
- `--domain demo.school`

CSV files are written to:

- packages/db/prisma/data/seed

## CSV Files

- tenant.csv
- academic_year.csv
- academic_period.csv
- user.csv
- teacher_profile.csv
- student_profile.csv
- group.csv
- class.csv
- class_group.csv
- homeroom_assignment.csv
- subject.csv
- class_subject.csv
- class_enrollment.csv
- tenant_assessment_type.csv
- assessment_type_weight.csv
- assessment_component.csv
- assessment_score.csv

## Notes

- CSV columns use snake_case matching Prisma schema fields.
- UUIDs are deterministic based on the seed.
- Password hashes are created in the seeder (not stored in CSV).
- Latest academic year is marked as ACTIVE and linked via `active_academic_year_id`.
- Academic periods are marked DRAFT for the active year and ARCHIVED for previous years.
