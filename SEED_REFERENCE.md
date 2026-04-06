# Database Seed Reference Guide

## Overview

This document provides a complete reference of all seeded IDs and data that can
be used throughout the CITC Portal system.

**Last Seeded:** April 6, 2026

---

## 1. ROLES (6 Total)

| Name     | UUID                                 | Rank | Purpose                                     |
| -------- | ------------------------------------ | ---- | ------------------------------------------- |
| Admin    | fd4ae3f2-13f6-4454-bda6-a5a127844be2 | 100  | Full system access, manage users & settings |
| Chairman | ee3ae6a1-d20f-4d75-987d-946c110ff795 | 90   | Department/College leadership               |
| Faculty  | ee6dcd57-8faf-40b2-8bfd-c63cc0997160 | 80   | Instructors, manage classes & students      |
| Staff    | b433a889-7f9a-47ab-8560-a4297be2b437 | 60   | Administrative staff                        |
| Student  | 6f4788c9-c0b8-47a2-9c80-98c82d057f51 | 40   | Students enrolled in classes                |
| Guest    | ee13e878-0bb7-4eaa-9634-980fdcd92681 | 10   | Limited system access                       |

### To Assign Roles to Users:

Use the **User Management** page → Add/Edit User → Select roles from dropdown

---

## 2. COLLEGES (5 Total)

| Code | Name                                                 | ID |
| ---- | ---------------------------------------------------- | -- |
| CITC | College of Information and Communications Technology | 1  |
| CED  | College of Education                                 | 2  |
| CEng | College of Engineering                               | 3  |
| CS   | College of Science                                   | 4  |
| CIT  | College of Industrial Technology                     | 5  |

### Query Example:

```python
from app.lms.models import College
citc = College.objects.get(code='CITC')
```

---

## 3. DEPARTMENTS (7 Total)

| Code | Name                    | College | ID |
| ---- | ----------------------- | ------- | -- |
| IT   | Information Technology  | CITC    | 1  |
| CS   | Computer Science        | CITC    | 2  |
| IS   | Information Systems     | CITC    | 3  |
| EM   | Engineering Mathematics | CEng    | 4  |
| GE   | General Education       | CED     | 5  |
| AS   | Applied Science         | CS      | 6  |
| IE   | Industrial Engineering  | CIT     | 7  |

### To Assign to Users:

Use the **User Management** page → Add/Edit User → Select Department dropdown

### Query Example:

```python
from app.lms.models import Department
it_dept = Department.objects.get(code='IT')
```

---

## 4. YEAR LEVELS (4 Total)

| Level    | ID |
| -------- | -- |
| 1st Year | 1  |
| 2nd Year | 2  |
| 3rd Year | 3  |
| 4th Year | 4  |

---

## 5. SECTIONS (20 Total)

Created for each Year Level (A, B, C, D, E):

| Year     | Sections                                                   |
| -------- | ---------------------------------------------------------- |
| 1st Year | 1st Year-A, 1st Year-B, 1st Year-C, 1st Year-D, 1st Year-E |
| 2nd Year | 2nd Year-A, 2nd Year-B, 2nd Year-C, 2nd Year-D, 2nd Year-E |
| 3rd Year | 3rd Year-A, 3rd Year-B, 3rd Year-C, 3rd Year-D, 3rd Year-E |
| 4th Year | 4th Year-A, 4th Year-B, 4th Year-C, 4th Year-D, 4th Year-E |

---

## 6. SCHOOL YEARS (3 Total)

| Name      | Semester     | Academic Year       | ID |
| --------- | ------------ | ------------------- | -- |
| 2026-2027 | 1st Semester | Aug 2026 - Dec 2026 | 1  |
| 2026-2027 | 2nd Semester | Jan 2027 - May 2027 | 2  |
| 2026-2027 | Midyear      | Jun 2027 - Jul 2027 | 3  |

---

## 7. SUBJECTS (8 Total)

| Code  | Name                        | Department | Year Level | ID |
| ----- | --------------------------- | ---------- | ---------- | -- |
| CS101 | Introduction to Programming | IT         | 1st Year   | 1  |
| CS102 | Data Structures             | IT         | 2nd Year   | 2  |
| CS103 | Web Development             | IT         | 2nd Year   | 3  |
| CS104 | Database Management Systems | CS         | 3rd Year   | 4  |
| CS105 | Machine Learning            | CS         | 4th Year   | 5  |
| IS101 | Systems Administration      | IS         | 3rd Year   | 6  |
| GE101 | English 101                 | GE         | 1st Year   | 7  |
| EM101 | Mathematics 101             | EM         | 1st Year   | 8  |

---

## How to Add More Seed Data

### Option 1: Update the Seed Command

Edit: `project/app/lms/management/commands/seed_db.py`

Add your data to the respective `_data` dictionaries and re-run:

```bash
python manage.py seed_db
```

### Option 2: Use Django Shell

```bash
python manage.py shell
```

Then:

```python
from app.lms.models import College, Department, Role
from app.users.models import User

# Create a new college
new_college = College.objects.create(name='My College', code='MC')

# Create a new department
new_dept = Department.objects.create(
    name='My Department',
    code='MD',
    college=new_college
)

# Create a new role
new_role = Role.objects.create(name='Manager', rank=70)
```

### Option 3: Use User Management Interface

For **Colleges**, **Departments**, **Subjects**, etc., you can:

1. Login to Django Admin: `/admin/`
2. Use the admin interface to add new data
3. Or create a custom admin page in the frontend

---

## Using IDs in Code

### Example 1: Create a User with Role and Department

```python
from app.users.models import User, Role
from app.lms.models import Department

admin_role = Role.objects.get(name='Admin')
it_dept = Department.objects.get(code='IT')

user = User.objects.create_user(
    id_number='2024001',
    email='admin@citc.com',
    first_name='John',
    last_name='Doe',
    password='securepassword',
    department=it_dept,
    is_staff=True
)

user.roles.add(admin_role)
```

### Example 2: Create a Class

```python
from app.lms.models import Class, Department, SchoolYear, YearLevel, Subject, Section

dept = Department.objects.get(code='IT')
school_year = SchoolYear.objects.get(name='2026-2027', semester='1st Semester')
year_level = YearLevel.objects.get(level='1st Year')
subject = Subject.objects.get(code='CS101')
section = Section.objects.get(section='1st Year-A')
teacher = User.objects.get(id_number='2024001')

class_obj = Class.objects.create(
    department=dept,
    school_year=school_year,
    year_level=year_level,
    subject=subject,
    section=section,
    teacher=teacher
)
```

---

## Quick Commands

### Re-seed the Database

```bash
cd project
python manage.py seed_db
```

### View All Roles

```bash
python manage.py shell
```

```python
from app.users.models import Role
Role.objects.all().values('uuid', 'name', 'rank')
```

### View All Departments

```python
from app.lms.models import Department
Department.objects.all().values('code', 'name', 'college__code')
```

### View All Subjects

```python
from app.lms.models import Subject
Subject.objects.all().values('code', 'name', 'department__code')
```

---

## Notes

- **UUID vs ID**: Roles use UUID as primary key; other models use
  auto-incrementing integers (ID)
- **Hierarchy**: Colleges → Departments; YearLevels → Sections; SchoolYears have
  Semesters
- **Constraints**: Departments reference Colleges, Subjects reference
  Departments
- **Extensibility**: You can easily add more roles, colleges, and departments by
  re-running seed_db with updated data

---

## Support

For questions about seeding or IDs, check:

1. This reference guide
2. Django models: `project/app/lms/models.py` and `project/app/users/models.py`
3. Seed command: `project/app/lms/management/commands/seed_db.py`
