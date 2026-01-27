from __future__ import annotations

import argparse
import csv
import json
import random
import re
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable

from faker import Faker  # type: ignore[import-not-found]


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-")


def to_iso(value: date | datetime | None) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    return datetime.combine(value, datetime.min.time()).isoformat()


@dataclass
class GeneratorConfig:
    seed: int
    output_dir: Path
    tenant_name: str
    tenant_slug: str
    education_level: str
    year_count: int
    periods_per_year: int
    subject_count: int
    teacher_count: int
    classes_per_grade: int
    class_size_min: int
    class_size_max: int
    female_ratio: float
    domain: str


DEFAULT_SUBJECTS = [
    "Matematika",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "Fisika",
    "Kimia",
    "Biologi",
    "Sejarah",
    "Geografi",
    "Ekonomi",
    "PPKn",
    "Seni Budaya",
    "PJOK",
]


ASSESSMENT_TYPES = [
    {"key": "quiz", "label": "Kuis", "description": "Kuis singkat", "order": 1},
    {"key": "assignment", "label": "Tugas", "description": "Penugasan", "order": 2},
    {"key": "midterm", "label": "UTS", "description": "Ujian Tengah Semester", "order": 3},
    {"key": "final", "label": "UAS", "description": "Ujian Akhir Semester", "order": 4},
]

ASSESSMENT_TYPE_WEIGHTS = {
    "quiz": 20,
    "assignment": 30,
    "midterm": 25,
    "final": 25,
}

COMPONENT_DEFINITIONS = {
    "quiz": ["Kuis 1", "Kuis 2"],
    "assignment": ["Tugas 1", "Tugas 2"],
    "midterm": ["UTS"],
    "final": ["UAS"],
}


class IdFactory:
    def __init__(self, seed: int) -> None:
        namespace = uuid.uuid5(uuid.NAMESPACE_DNS, f"ziqola-seed:{seed}")
        self._namespace = namespace

    def make(self, *parts: str) -> str:
        key = "|".join(parts)
        return str(uuid.uuid5(self._namespace, key))


class Dataset:
    def __init__(self) -> None:
        self.data: dict[str, list[dict[str, Any]]] = {}

    def add(self, name: str, row: dict[str, Any]) -> None:
        self.data.setdefault(name, []).append(row)

    def rows(self, name: str) -> list[dict[str, Any]]:
        return self.data.get(name, [])


def build_academic_years(
    config: GeneratorConfig, id_factory: IdFactory
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str, str]:
    today = date.today()
    current_year = today.year
    current_start_year = current_year if today.month >= 7 else current_year - 1
    start_year = current_start_year - (config.year_count - 1)

    academic_years: list[dict[str, Any]] = []
    academic_periods: list[dict[str, Any]] = []
    active_year_id = ""
    active_period_id = ""

    for index in range(config.year_count):
        year_start = start_year + index
        year_end = year_start + 1
        label = f"{year_start}/{year_end}"
        year_id = id_factory.make("academic_year", label)
        status = "ACTIVE" if index == config.year_count - 1 else "ARCHIVED"

        academic_years.append(
            {
                "id": year_id,
                "tenant_id": id_factory.make("tenant", config.tenant_slug),
                "label": label,
                "status": status,
                "start_date": to_iso(date(year_start, 7, 1)),
                "end_date": to_iso(date(year_end, 6, 30)),
                "active_period_id": "",
            }
        )

        period_1_id = id_factory.make("academic_period", label, "semester-1")
        period_2_id = id_factory.make("academic_period", label, "semester-2")

        academic_periods.extend(
            [
                {
                    "id": period_1_id,
                    "tenant_id": id_factory.make("tenant", config.tenant_slug),
                    "academic_year_id": year_id,
                    "name": "Semester 1",
                    "start_date": to_iso(date(year_start, 7, 1)),
                    "end_date": to_iso(date(year_start, 12, 31)),
                    "order_index": 1,
                    "status": "DRAFT" if status == "ACTIVE" else "ARCHIVED",
                },
                {
                    "id": period_2_id,
                    "tenant_id": id_factory.make("tenant", config.tenant_slug),
                    "academic_year_id": year_id,
                    "name": "Semester 2",
                    "start_date": to_iso(date(year_end, 1, 1)),
                    "end_date": to_iso(date(year_end, 6, 30)),
                    "order_index": 2,
                    "status": "DRAFT" if status == "ACTIVE" else "ARCHIVED",
                },
            ]
        )

        if status == "ACTIVE":
            active_year_id = year_id
            if today.month >= 7:
                active_period_id = period_1_id
            else:
                active_period_id = period_2_id

    for year in academic_years:
        if year["id"] == active_year_id:
            year["active_period_id"] = active_period_id
            break

    return academic_years, academic_periods, active_year_id, active_period_id


def build_groups(config: GeneratorConfig, id_factory: IdFactory) -> list[dict[str, Any]]:
    grade_map = {"X": "Kelas 10", "XI": "Kelas 11", "XII": "Kelas 12"}
    groups: list[dict[str, Any]] = []

    for grade in ["X", "XI", "XII"]:
        groups.append(
            {
                "id": id_factory.make("group", grade),
                "tenant_id": id_factory.make("tenant", config.tenant_slug),
                "name": grade_map[grade],
                "type": "GRADE",
            }
        )

    for stream in ["IPA", "IPS"]:
        groups.append(
            {
                "id": id_factory.make("group", stream),
                "tenant_id": id_factory.make("tenant", config.tenant_slug),
                "name": stream,
                "type": "STREAM",
            }
        )

    return groups


def build_classes(
    config: GeneratorConfig,
    id_factory: IdFactory,
    academic_years: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[tuple[str, str, str, int], str]]:
    class_rows: list[dict[str, Any]] = []
    class_group_rows: list[dict[str, Any]] = []
    class_map: dict[tuple[str, str, str, int], str] = {}

    grade_labels = ["X", "XI", "XII"]
    streams = ["IPA", "IPS"]
    classes_per_stream = config.classes_per_grade // len(streams)

    for year in academic_years:
        year_id = year["id"]
        for grade_label in grade_labels:
            for stream in streams:
                for section in range(1, classes_per_stream + 1):
                    class_name = f"{grade_label} {stream} {section}"
                    class_id = id_factory.make("class", year_id, class_name)
                    class_rows.append(
                        {
                            "id": class_id,
                            "tenant_id": id_factory.make("tenant", config.tenant_slug),
                            "academic_year_id": year_id,
                            "name": class_name,
                        }
                    )
                    class_map[(year_id, grade_label, stream, section)] = class_id

                    grade_group_id = id_factory.make("group", grade_label)
                    stream_group_id = id_factory.make("group", stream)

                    class_group_rows.append(
                        {
                            "tenant_id": id_factory.make("tenant", config.tenant_slug),
                            "class_id": class_id,
                            "group_id": grade_group_id,
                        }
                    )
                    class_group_rows.append(
                        {
                            "tenant_id": id_factory.make("tenant", config.tenant_slug),
                            "class_id": class_id,
                            "group_id": stream_group_id,
                        }
                    )

    return class_rows, class_group_rows, class_map


def build_users_and_profiles(
    config: GeneratorConfig, id_factory: IdFactory, faker: Faker, rng: random.Random
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    users: list[dict[str, Any]] = []
    teacher_profiles: list[dict[str, Any]] = []
    student_profiles: list[dict[str, Any]] = []

    email_registry: set[str] = set()

    def next_email(name: str) -> str:
        base = slugify(name)
        candidate = f"{base}@{config.domain}"
        counter = 1
        while candidate in email_registry:
            candidate = f"{base}{counter}@{config.domain}"
            counter += 1
        email_registry.add(candidate)
        return candidate

    def pick_gender() -> str:
        return "FEMALE" if rng.random() < config.female_ratio else "MALE"

    def birth_date_for(gender: str, min_age: int, max_age: int) -> date:
        age = rng.randint(min_age, max_age)
        year = date.today().year - age
        month = rng.randint(1, 12)
        day = rng.randint(1, 28)
        return date(year, month, day)

    # Admin staff
    admin_name = faker.name()
    users.append(
        {
            "id": id_factory.make("user", "admin"),
            "tenant_id": id_factory.make("tenant", config.tenant_slug),
            "email": next_email(admin_name),
            "name": admin_name,
            "role": "ADMIN_STAFF",
            "status": "ACTIVE",
            "gender": pick_gender(),
            "date_of_birth": to_iso(birth_date_for("MALE", 30, 50)),
            "phone_number": faker.phone_number(),
        }
    )

    # Principal
    principal_name = faker.name()
    users.append(
        {
            "id": id_factory.make("user", "principal"),
            "tenant_id": id_factory.make("tenant", config.tenant_slug),
            "email": next_email(principal_name),
            "name": principal_name,
            "role": "PRINCIPAL",
            "status": "ACTIVE",
            "gender": pick_gender(),
            "date_of_birth": to_iso(birth_date_for("MALE", 35, 55)),
            "phone_number": faker.phone_number(),
        }
    )

    # Teachers
    for index in range(config.teacher_count):
        name = faker.name()
        gender = pick_gender()
        user_id = id_factory.make("user", "teacher", str(index))
        email = next_email(name)
        users.append(
            {
                "id": user_id,
                "tenant_id": id_factory.make("tenant", config.tenant_slug),
                "email": email,
                "name": name,
                "role": "TEACHER",
                "status": "ACTIVE",
                "gender": gender,
                "date_of_birth": to_iso(birth_date_for(gender, 24, 55)),
                "phone_number": faker.phone_number(),
            }
        )

        teacher_profile_id = id_factory.make("teacher_profile", user_id)
        nip = f"{rng.randint(1970, 1995)}{rng.randint(1,12):02d}{rng.randint(1,28):02d}{rng.randint(2005,2020)}{rng.randint(100000,999999)}"
        nuptk = f"{rng.randint(1000000000000000, 9999999999999999)}"
        teacher_profiles.append(
            {
                "id": teacher_profile_id,
                "tenant_id": id_factory.make("tenant", config.tenant_slug),
                "user_id": user_id,
                "hired_at": to_iso(date(rng.randint(2005, 2023), rng.randint(1, 12), 1)),
                "additional_identifiers": json.dumps({"nip": nip, "nuptk": nuptk}),
            }
        )

    return users, teacher_profiles, student_profiles


def build_student_cohorts(
    config: GeneratorConfig,
    id_factory: IdFactory,
    faker: Faker,
    rng: random.Random,
    users: list[dict[str, Any]],
    student_profiles: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    streams = ["IPA", "IPS"]
    classes_per_stream = config.classes_per_grade // len(streams)

    cohort_definitions = {
        "A": [(0, 0), (1, 1), (2, 2)],
        "B": [(0, 1), (1, 2)],
        "C": [(0, 2)],
        "D": [(1, 0), (2, 1)],
        "E": [(2, 0)],
    }

    email_registry = {row["email"] for row in users}

    def next_email(name: str) -> str:
        base = slugify(name)
        candidate = f"{base}@{config.domain}"
        counter = 1
        while candidate in email_registry:
            candidate = f"{base}{counter}@{config.domain}"
            counter += 1
        email_registry.add(candidate)
        return candidate

    def pick_gender() -> str:
        return "FEMALE" if rng.random() < config.female_ratio else "MALE"

    cohort_students: dict[str, list[dict[str, Any]]] = {key: [] for key in cohort_definitions}

    for cohort_key in cohort_definitions:
        for stream in streams:
            for section in range(1, classes_per_stream + 1):
                size = rng.randint(config.class_size_min, config.class_size_max)
                for student_index in range(size):
                    name = faker.name()
                    gender = pick_gender()
                    user_id = id_factory.make(
                        "user",
                        "student",
                        cohort_key,
                        stream,
                        str(section),
                        str(student_index),
                    )
                    email = next_email(name)
                    users.append(
                        {
                            "id": user_id,
                            "tenant_id": id_factory.make("tenant", config.tenant_slug),
                            "email": email,
                            "name": name,
                            "role": "STUDENT",
                            "status": "ACTIVE",
                            "gender": gender,
                            "date_of_birth": to_iso(
                                date(rng.randint(2006, 2012), rng.randint(1, 12), rng.randint(1, 28))
                            ),
                            "phone_number": faker.phone_number(),
                        }
                    )

                    student_profile_id = id_factory.make("student_profile", user_id)
                    nis = f"{rng.randint(2020,2026)}{rng.randint(1000,9999)}"
                    nisn = f"{rng.randint(1000000000, 9999999999)}"
                    student_profiles.append(
                        {
                            "id": student_profile_id,
                            "tenant_id": id_factory.make("tenant", config.tenant_slug),
                            "user_id": user_id,
                            "additional_identifiers": json.dumps({"nis": nis, "nisn": nisn}),
                        }
                    )

                    cohort_students[cohort_key].append(
                        {
                            "student_profile_id": student_profile_id,
                            "stream": stream,
                            "section": section,
                        }
                    )

    return cohort_students


def build_enrollments(
    config: GeneratorConfig,
    id_factory: IdFactory,
    academic_years: list[dict[str, Any]],
    class_map: dict[tuple[str, str, str, int], str],
    cohort_students: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    grade_labels = ["X", "XI", "XII"]
    year_map = {year_index: year for year_index, year in enumerate(academic_years)}

    cohort_assignments = {
        "A": [(0, 0), (1, 1), (2, 2)],
        "B": [(0, 1), (1, 2)],
        "C": [(0, 2)],
        "D": [(1, 0), (2, 1)],
        "E": [(2, 0)],
    }

    enrollments: list[dict[str, Any]] = []

    for cohort_key, student_entries in cohort_students.items():
        for year_index, grade_index in cohort_assignments[cohort_key]:
            year = year_map[year_index]
            for student_entry in student_entries:
                class_id = class_map[
                    (
                        year["id"],
                        grade_labels[grade_index],
                        student_entry["stream"],
                        student_entry["section"],
                    )
                ]
                end_date = "" if year["status"] == "ACTIVE" else year["end_date"]
                enrollments.append(
                    {
                        "id": id_factory.make(
                            "class_enrollment",
                            cohort_key,
                            year["id"],
                            student_entry["student_profile_id"],
                        ),
                        "tenant_id": id_factory.make("tenant", config.tenant_slug),
                        "class_id": class_id,
                        "student_profile_id": student_entry["student_profile_id"],
                        "start_date": year["start_date"],
                        "end_date": end_date,
                    }
                )

    return enrollments


def build_class_schedule(
    config: GeneratorConfig,
    id_factory: IdFactory,
    rng: random.Random,
    active_year_id: str,
    active_period_id: str,
    classes: list[dict[str, Any]],
    class_subjects: list[dict[str, Any]],
    excluded_teacher_profile_id: str | None,
    class_ids_with_enrollments: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    target_class = next(
        (
            row
            for row in classes
            if row["academic_year_id"] == active_year_id
            and (
                class_ids_with_enrollments is None
                or row["id"] in class_ids_with_enrollments
            )
        ),
        None,
    )
    if not target_class:
        return [], []

    class_id = target_class["id"]
    subject_rows = [
        row
        for row in class_subjects
        if row["class_id"] == class_id and row["academic_year_id"] == active_year_id
    ]
    if excluded_teacher_profile_id:
        filtered_rows = [
            row for row in subject_rows if row["teacher_profile_id"] != excluded_teacher_profile_id
        ]
        if filtered_rows:
            subject_rows = filtered_rows
    if not subject_rows:
        return [], []

    schedule_rows: list[dict[str, Any]] = []
    session_rows: list[dict[str, Any]] = []

    base_date = date.today().replace(day=1)
    base_year = base_date.year
    base_month = base_date.month
    if base_month == 12:
        next_month = date(base_year + 1, 1, 1)
    else:
        next_month = date(base_year, base_month + 1, 1)
    last_day = next_month - timedelta(days=1)

    tenant_id = id_factory.make("tenant", config.tenant_slug)

    subject_index = 0
    for day_of_week in range(1, 6):
        total_hours = rng.randint(6, 8)
        remaining = total_hours
        start_hour = 7
        block_index = 0

        while remaining > 0:
            duration = 2 if remaining >= 2 and rng.random() < 0.5 else 1
            if duration > remaining:
                duration = remaining

            start_time = datetime(base_year, base_month, 1, start_hour, 0)
            end_time = datetime(base_year, base_month, 1, start_hour + duration, 0)

            subject = subject_rows[subject_index % len(subject_rows)]
            subject_index += 1
            schedule_id = id_factory.make(
                "schedule",
                class_id,
                active_period_id,
                str(day_of_week),
                str(block_index),
                subject["id"],
            )

            schedule_rows.append(
                {
                    "id": schedule_id,
                    "tenant_id": tenant_id,
                    "class_id": class_id,
                    "academic_period_id": active_period_id,
                    "class_subject_id": subject["id"],
                    "teacher_profile_id": subject["teacher_profile_id"],
                    "day_of_week": day_of_week,
                    "start_time": to_iso(start_time),
                    "end_time": to_iso(end_time),
                }
            )

            start_hour += duration
            remaining -= duration
            block_index += 1

    current = base_date
    while current <= last_day:
        if 1 <= current.isoweekday() <= 5:
            day_schedules = [
                row for row in schedule_rows if row["day_of_week"] == current.isoweekday()
            ]
            for schedule in day_schedules:
                start_dt = datetime.combine(
                    current, datetime.fromisoformat(schedule["start_time"]).time()
                )
                end_dt = datetime.combine(
                    current, datetime.fromisoformat(schedule["end_time"]).time()
                )
                session_rows.append(
                    {
                        "id": id_factory.make(
                            "session",
                            schedule["id"],
                            current.isoformat(),
                        ),
                        "tenant_id": tenant_id,
                        "class_id": class_id,
                        "academic_period_id": active_period_id,
                        "class_subject_id": schedule["class_subject_id"],
                        "schedule_id": schedule["id"],
                        "date": to_iso(current),
                        "start_time": to_iso(start_dt),
                        "end_time": to_iso(end_dt),
                    }
                )
        current = current + timedelta(days=1)

    return schedule_rows, session_rows


def build_teacher_schedule(
    config: GeneratorConfig,
    id_factory: IdFactory,
    rng: random.Random,
    active_period_id: str,
    teacher_profiles: list[dict[str, Any]],
    class_subjects: list[dict[str, Any]],
    active_year_id: str,
    class_ids_with_enrollments: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if not teacher_profiles:
        return [], []

    teacher_profile_id = teacher_profiles[0]["id"]
    subject_rows = [
        row
        for row in class_subjects
        if row["teacher_profile_id"] == teacher_profile_id
        and row["academic_year_id"] == active_year_id
    ]
    if class_ids_with_enrollments is not None:
        subject_rows = [
            row for row in subject_rows if row["class_id"] in class_ids_with_enrollments
        ]
    if not subject_rows:
        return [], []

    schedule_rows: list[dict[str, Any]] = []
    session_rows: list[dict[str, Any]] = []

    base_date = date.today().replace(day=1)
    base_year = base_date.year
    base_month = base_date.month
    if base_month == 12:
        next_month = date(base_year + 1, 1, 1)
    else:
        next_month = date(base_year, base_month + 1, 1)
    last_day = next_month - timedelta(days=1)

    tenant_id = id_factory.make("tenant", config.tenant_slug)

    daily_hours = [3, 3, 3, 3, 3]
    for _ in range(18 - sum(daily_hours)):
        daily_hours[rng.randint(0, 4)] += 1

    class_order: list[str] = []
    class_subjects_by_class: dict[str, list[dict[str, Any]]] = {}
    for row in subject_rows:
        class_subjects_by_class.setdefault(row["class_id"], []).append(row)
    class_order = list(class_subjects_by_class.keys())
    rng.shuffle(class_order)
    class_index = 0

    for day_offset, total_hours in enumerate(daily_hours, start=1):
        remaining = total_hours
        start_hour = 7
        block_index = 0

        while remaining > 0:
            duration = 2 if remaining >= 2 and rng.random() < 0.5 else 1
            if duration > remaining:
                duration = remaining

            start_time = datetime(base_year, base_month, 1, start_hour, 0)
            end_time = datetime(base_year, base_month, 1, start_hour + duration, 0)

            class_id = class_order[class_index % len(class_order)]
            class_index += 1
            class_subject_list = class_subjects_by_class[class_id]
            subject = class_subject_list[block_index % len(class_subject_list)]
            schedule_id = id_factory.make(
                "schedule",
                class_id,
                active_period_id,
                teacher_profile_id,
                str(day_offset),
                str(block_index),
                subject["id"],
            )

            schedule_rows.append(
                {
                    "id": schedule_id,
                    "tenant_id": tenant_id,
                    "class_id": class_id,
                    "academic_period_id": active_period_id,
                    "class_subject_id": subject["id"],
                    "teacher_profile_id": teacher_profile_id,
                    "day_of_week": day_offset,
                    "start_time": to_iso(start_time),
                    "end_time": to_iso(end_time),
                }
            )

            start_hour += duration
            remaining -= duration
            block_index += 1

    current = base_date
    while current <= last_day:
        if 1 <= current.isoweekday() <= 5:
            day_schedules = [
                row for row in schedule_rows if row["day_of_week"] == current.isoweekday()
            ]
            for schedule in day_schedules:
                start_dt = datetime.combine(
                    current, datetime.fromisoformat(schedule["start_time"]).time()
                )
                end_dt = datetime.combine(
                    current, datetime.fromisoformat(schedule["end_time"]).time()
                )
                session_rows.append(
                    {
                        "id": id_factory.make(
                            "session",
                            schedule["id"],
                            current.isoformat(),
                        ),
                        "tenant_id": tenant_id,
                        "class_id": schedule["class_id"],
                        "academic_period_id": active_period_id,
                        "class_subject_id": schedule["class_subject_id"],
                        "schedule_id": schedule["id"],
                        "date": to_iso(current),
                        "start_time": to_iso(start_dt),
                        "end_time": to_iso(end_dt),
                    }
                )
        current = current + timedelta(days=1)

    return schedule_rows, session_rows


def build_attendances(
    config: GeneratorConfig,
    id_factory: IdFactory,
    rng: random.Random,
    sessions: list[dict[str, Any]],
    enrollments_by_class: dict[str, list[str]],
) -> list[dict[str, Any]]:
    attendance_rows: list[dict[str, Any]] = []
    tenant_id = id_factory.make("tenant", config.tenant_slug)

    status_weights = [
        ("PRESENT", 0.88),
        ("EXCUSED", 0.04),
        ("SICK", 0.04),
        ("ABSENT", 0.04),
    ]
    remarks_by_status = {
        "EXCUSED": ["Izin keluarga", "Kegiatan sekolah"],
        "SICK": ["Sakit", "Periksa dokter"],
        "ABSENT": ["Tanpa keterangan", "Alpa"],
    }

    def pick_status() -> str:
        roll = rng.random()
        cumulative = 0.0
        for status, weight in status_weights:
            cumulative += weight
            if roll <= cumulative:
                return status
        return "PRESENT"

    for session in sessions:
        class_id = session["class_id"]
        students = enrollments_by_class.get(class_id, [])
        for student_profile_id in students:
            status = pick_status()
            remark = ""
            if status in remarks_by_status and rng.random() < 0.5:
                remark = rng.choice(remarks_by_status[status])

            attendance_rows.append(
                {
                    "id": id_factory.make(
                        "attendance",
                        session["id"],
                        student_profile_id,
                    ),
                    "tenant_id": tenant_id,
                    "session_id": session["id"],
                    "student_profile_id": student_profile_id,
                    "status": status,
                    "remarks": remark,
                }
            )

    return attendance_rows


def write_csv(output_dir: Path, name: str, rows: Iterable[dict[str, Any]]) -> None:
    rows = list(rows)
    if not rows:
        return
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{name}.csv"
    headers = list(rows[0].keys())

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in headers})


def generate_dataset(config: GeneratorConfig) -> Dataset:
    faker = Faker("id_ID")
    faker.seed_instance(config.seed)
    rng = random.Random(config.seed)
    id_factory = IdFactory(config.seed)

    dataset = Dataset()
    tenant_id = id_factory.make("tenant", config.tenant_slug)

    academic_years, academic_periods, active_year_id, active_period_id = build_academic_years(
        config, id_factory
    )

    dataset.add(
        "tenant",
        {
            "id": tenant_id,
            "name": config.tenant_name,
            "slug": config.tenant_slug,
            "education_level": config.education_level,
            "active_academic_year_id": active_year_id,
        },
    )

    for row in academic_years:
        dataset.add("academic_year", row)
    for row in academic_periods:
        dataset.add("academic_period", row)

    groups = build_groups(config, id_factory)
    for row in groups:
        dataset.add("group", row)

    classes, class_groups, class_map = build_classes(config, id_factory, academic_years)
    for row in classes:
        dataset.add("class", row)
    for row in class_groups:
        dataset.add("class_group", row)

    users, teacher_profiles, student_profiles = build_users_and_profiles(
        config, id_factory, faker, rng
    )

    cohort_students = build_student_cohorts(
        config, id_factory, faker, rng, users, student_profiles
    )

    for row in users:
        dataset.add("user", row)
    for row in teacher_profiles:
        dataset.add("teacher_profile", row)
    for row in student_profiles:
        dataset.add("student_profile", row)

    homeroom_assignments: list[dict[str, Any]] = []
    teacher_profile_ids = [profile["id"] for profile in teacher_profiles]
    for index, class_row in enumerate(classes):
        teacher_profile_id = teacher_profile_ids[index % len(teacher_profile_ids)]
        homeroom_assignments.append(
            {
                "id": id_factory.make("homeroom_assignment", class_row["id"]),
                "tenant_id": tenant_id,
                "class_id": class_row["id"],
                "academic_year_id": class_row["academic_year_id"],
                "teacher_profile_id": teacher_profile_id,
                "assigned_at": to_iso(datetime.now()),
                "ended_at": "",
                "is_active": "true" if class_row["academic_year_id"] == active_year_id else "false",
            }
        )

    for row in homeroom_assignments:
        dataset.add("homeroom_assignment", row)

    subject_names = DEFAULT_SUBJECTS[: config.subject_count]
    subjects = []
    for name in subject_names:
        subjects.append(
            {
                "id": id_factory.make("subject", name),
                "tenant_id": tenant_id,
                "name": name,
                "is_deleted": "false",
                "deleted_at": "",
            }
        )

    for row in subjects:
        dataset.add("subject", row)

    class_subjects: list[dict[str, Any]] = []
    for index, class_row in enumerate(classes):
        for subject_index, subject in enumerate(subjects):
            teacher_profile_id = teacher_profile_ids[(index + subject_index) % len(teacher_profile_ids)]
            class_subjects.append(
                {
                    "id": id_factory.make(
                        "class_subject",
                        class_row["id"],
                        subject["id"],
                    ),
                    "tenant_id": tenant_id,
                    "class_id": class_row["id"],
                    "academic_year_id": class_row["academic_year_id"],
                    "subject_id": subject["id"],
                    "teacher_profile_id": teacher_profile_id,
                    "is_deleted": "false",
                    "deleted_at": "",
                }
            )

    for row in class_subjects:
        dataset.add("class_subject", row)

    teacher_subjects: list[dict[str, Any]] = []
    teacher_subject_map: dict[tuple[str, str], str] = {}
    for class_subject in class_subjects:
        key = (class_subject["teacher_profile_id"], class_subject["subject_id"])
        if key in teacher_subject_map:
            continue
        teacher_subject_id = id_factory.make(
            "teacher_subject",
            class_subject["teacher_profile_id"],
            class_subject["subject_id"],
        )
        teacher_subject_map[key] = teacher_subject_id
        teacher_subjects.append(
            {
                "id": teacher_subject_id,
                "tenant_id": tenant_id,
                "teacher_profile_id": class_subject["teacher_profile_id"],
                "subject_id": class_subject["subject_id"],
            }
        )

    for row in teacher_subjects:
        dataset.add("teacher_subject", row)

    enrollments = build_enrollments(
        config, id_factory, academic_years, class_map, cohort_students
    )
    for row in enrollments:
        dataset.add("class_enrollment", row)

    enrollments_by_class: dict[str, list[str]] = {}
    for enrollment in enrollments:
        enrollments_by_class.setdefault(enrollment["class_id"], []).append(
            enrollment["student_profile_id"]
        )

    active_year_class_ids = {
        row["id"] for row in classes if row["academic_year_id"] == active_year_id
    }
    class_ids_with_enrollments = set(enrollments_by_class.keys()) & active_year_class_ids

    primary_teacher_id = teacher_profiles[0]["id"] if teacher_profiles else None
    class_schedules, class_sessions = build_class_schedule(
        config,
        id_factory,
        rng,
        active_year_id,
        active_period_id,
        classes,
        class_subjects,
        primary_teacher_id,
        class_ids_with_enrollments,
    )
    teacher_schedules, teacher_sessions = build_teacher_schedule(
        config,
        id_factory,
        rng,
        active_period_id,
        teacher_profiles,
        class_subjects,
        active_year_id,
        class_ids_with_enrollments,
    )

    for row in class_schedules + teacher_schedules:
        dataset.add("schedule", row)
    for row in class_sessions + teacher_sessions:
        dataset.add("session", row)

    assessment_types = []
    for entry in ASSESSMENT_TYPES:
        assessment_types.append(
            {
                "id": id_factory.make("tenant_assessment_type", entry["key"]),
                "tenant_id": tenant_id,
                "key": entry["key"],
                "label": entry["label"],
                "description": entry["description"],
                "order": entry["order"],
                "is_enabled": "true",
            }
        )
    for row in assessment_types:
        dataset.add("tenant_assessment_type", row)

    assessment_type_weights: list[dict[str, Any]] = []
    assessment_components: list[dict[str, Any]] = []

    periods_by_year = {}
    for period in academic_periods:
        periods_by_year.setdefault(period["academic_year_id"], []).append(period)

    assessment_type_map = {row["key"]: row for row in assessment_types}

    weight_keys: set[tuple[str, str, str]] = set()
    for class_subject in class_subjects:
        teacher_subject_id = teacher_subject_map.get(
            (class_subject["teacher_profile_id"], class_subject["subject_id"])
        )
        if not teacher_subject_id:
            continue

        year_periods = periods_by_year.get(class_subject["academic_year_id"], [])
        for period in year_periods:
            for assessment_key, weight in ASSESSMENT_TYPE_WEIGHTS.items():
                assessment_type = assessment_type_map[assessment_key]
                weight_key = (
                    teacher_subject_id,
                    period["id"],
                    assessment_type["id"],
                )
                if weight_key not in weight_keys:
                    weight_keys.add(weight_key)
                    assessment_type_weights.append(
                        {
                            "id": id_factory.make(
                                "assessment_type_weight",
                                teacher_subject_id,
                                period["id"],
                                assessment_type["id"],
                            ),
                            "tenant_id": tenant_id,
                            "teacher_subject_id": teacher_subject_id,
                            "academic_period_id": period["id"],
                            "assessment_type_id": assessment_type["id"],
                            "weight": weight,
                        }
                    )

                for component_name in COMPONENT_DEFINITIONS[assessment_key]:
                    assessment_components.append(
                        {
                            "id": id_factory.make(
                                "assessment_component",
                                class_subject["id"],
                                period["id"],
                                assessment_key,
                                component_name,
                            ),
                            "tenant_id": tenant_id,
                            "class_subject_id": class_subject["id"],
                            "academic_period_id": period["id"],
                            "assessment_type_id": assessment_type["id"],
                            "name": component_name,
                            "weight": 0,
                        }
                    )

    for row in assessment_type_weights:
        dataset.add("assessment_type_weight", row)
    for row in assessment_components:
        dataset.add("assessment_component", row)

    class_subject_class_map = {
        class_subject["id"]: class_subject["class_id"]
        for class_subject in class_subjects
    }

    assessment_scores: list[dict[str, Any]] = []
    for component_index, component in enumerate(assessment_components):
        class_id = class_subject_class_map.get(component["class_subject_id"])
        if not class_id:
            continue
        students = enrollments_by_class.get(class_id, [])
        for student_index, student_profile_id in enumerate(students):
            base_score = 65 + ((student_index * 7 + component_index * 3) % 31)
            score_value = min(100, max(0, base_score + rng.randint(0, 10)))
            assessment_scores.append(
                {
                    "id": id_factory.make(
                        "assessment_score",
                        component["id"],
                        student_profile_id,
                    ),
                    "tenant_id": tenant_id,
                    "component_id": component["id"],
                    "student_profile_id": student_profile_id,
                    "score": f"{score_value:.2f}",
                    "is_locked": "false",
                    "locked_at": "",
                }
            )

    for row in assessment_scores:
        dataset.add("assessment_score", row)

    attendances = build_attendances(
        config,
        id_factory,
        rng,
        class_sessions + teacher_sessions,
        enrollments_by_class,
    )
    for row in attendances:
        dataset.add("attendance", row)

    return dataset


def parse_args() -> GeneratorConfig:
    parser = argparse.ArgumentParser(description="Generate CSV seed data for Ziqola AMS")
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("../data/seed"),
    )
    parser.add_argument("--tenant-name", type=str, default="Demo School")
    parser.add_argument("--tenant-slug", type=str, default="demo-school")
    parser.add_argument("--education-level", type=str, default="SMA")
    parser.add_argument("--year-count", type=int, default=3)
    parser.add_argument("--periods-per-year", type=int, default=2)
    parser.add_argument("--subject-count", type=int, default=10)
    parser.add_argument("--teacher-count", type=int, default=40)
    parser.add_argument("--classes-per-grade", type=int, default=8)
    parser.add_argument("--class-size-min", type=int, default=25)
    parser.add_argument("--class-size-max", type=int, default=32)
    parser.add_argument("--female-ratio", type=float, default=0.4)
    parser.add_argument("--domain", type=str, default="demo.school")

    args = parser.parse_args()

    return GeneratorConfig(
        seed=args.seed,
        output_dir=args.output_dir,
        tenant_name=args.tenant_name,
        tenant_slug=args.tenant_slug,
        education_level=args.education_level,
        year_count=args.year_count,
        periods_per_year=args.periods_per_year,
        subject_count=args.subject_count,
        teacher_count=args.teacher_count,
        classes_per_grade=args.classes_per_grade,
        class_size_min=args.class_size_min,
        class_size_max=args.class_size_max,
        female_ratio=args.female_ratio,
        domain=args.domain,
    )


def main() -> None:
    config = parse_args()
    dataset = generate_dataset(config)

    for name, rows in dataset.data.items():
        write_csv(config.output_dir, name, rows)

    print(f"✅ CSV seed data generated in {config.output_dir}")


if __name__ == "__main__":
    main()
