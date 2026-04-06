# Database Seeding Guide

## Quick Start

### 1️⃣ Run the Seed Command (First Time Setup)

```bash
cd project
python manage.py seed_db
```

**Output will show:**

- ✅ 6 Roles created (Admin, Faculty, Staff, Student, Chairman, Guest)
- ✅ 5 Colleges created
- ✅ 7 Departments created
- ✅ 4 Year Levels created
- ✅ 20 Sections created (5 sections per year level)
- ✅ 3 School Years created (2026-2027 with 3 semesters)
- ✅ 8 Subjects created

---

## What Gets Seeded

### 📋 Core Data Structure

```
System
├── Roles (6)
│   ├── Admin (rank 100)
│   ├── Chairman (rank 90)
│   ├── Faculty (rank 80)
│   ├── Staff (rank 60)
│   ├── Student (rank 40)
│   └── Guest (rank 10)
│
├── Colleges (5)
│   ├── CITC (College of Information and Communications Technology)
│   ├── CED (College of Education)
│   ├── CEng (College of Engineering)
│   ├── CS (College of Science)
│   └── CIT (College of Industrial Technology)
│
├── Departments (7) - Each belongs to a College
│   ├── IT (Information Technology) → CITC
│   ├── CS (Computer Science) → CITC
│   ├── IS (Information Systems) → CITC
│   ├── EM (Engineering Mathematics) → CEng
│   ├── GE (General Education) → CED
│   ├── AS (Applied Science) → CS
│   └── IE (Industrial Engineering) → CIT
│
├── Year Levels (4)
│   ├── 1st Year
│   ├── 2nd Year
│   ├── 3rd Year
│   └── 4th Year
│
├── Sections (20)
│   └── Each Year Level has A, B, C, D, E sections
│       └── e.g., "1st Year-A", "1st Year-B", etc.
│
├── School Years (3)
│   ├── 2026-2027 1st Semester (Aug 2026 - Dec 2026)
│   ├── 2026-2027 2nd Semester (Jan 2027 - May 2027)
│   └── 2026-2027 Midyear (Jun 2027 - Jul 2027)
│
└── Subjects (8)
    ├── CS101 (Introduction to Programming) → IT, 1st Year
    ├── CS102 (Data Structures) → IT, 2nd Year
    ├── CS103 (Web Development) → IT, 2nd Year
    ├── CS104 (Database Management Systems) → CS, 3rd Year
    ├── CS105 (Machine Learning) → CS, 4th Year
    ├── IS101 (Systems Administration) → IS, 3rd Year
    ├── GE101 (English 101) → GE, 1st Year
    └── EM101 (Mathematics 101) → EM, 1st Year
```

---

## Using the Seeded Data

### 🎯 In User Management UI

1. **Login** to CITC Portal
2. Go to **User Management** in sidebar
3. Click **Add New User**
4. Fill in user details:
   - Email, ID Number, Names
   - **Select Role** → All 6 roles from dropdown ✅
   - **Select Department** → All 7 departments from dropdown ✅
5. Click **Save**

### 🐍 In Python Code

#### Example 1: Create User with Role

```python
from app.users.models import User, Role
from app.lms.models import Department

# Get the data
admin_role = Role.objects.get(name='Admin')
it_dept = Department.objects.get(code='IT')

# Create user
user = User.objects.create_user(
    id_number='2024001',
    email='john.doe@citc.edu',
    first_name='John',
    last_name='Doe',
    password='SecurePass123!',
    department=it_dept,
)

# Assign role
user.roles.add(admin_role)
```

#### Example 2: Create a Class

```python
from app.lms.models import Class, Subject, Section, SchoolYear

# Get seeded data
subject = Subject.objects.get(code='CS101')
section = Section.objects.get(section='1st Year-A')
school_year = SchoolYear.objects.get(
    name='2026-2027',
    semester='1st Semester'
)
teacher = User.objects.get(id_number='2024001')

# Create class
class_obj = Class.objects.create(
    department=teacher.department,
    school_year=school_year,
    year_level=section.tblYearLevel,
    subject=subject,
    section=section,
    teacher=teacher
)
```

#### Example 3: Query All Departments

```python
from app.lms.models import Department

# Get all departments
all_depts = Department.objects.all()

# Filter by college
citc_depts = Department.objects.filter(college__code='CITC')

# Get specific department
it = Department.objects.get(code='IT')
print(f"IT Department: {it.name}")
print(f"College: {it.college.name}")
```

---

## Reference Files

### 📄 SEED_REFERENCE.md

Complete guide with:

- All IDs with UUIDs
- How to use each entity type
- Code examples
- Django shell commands

### 📊 SEED_DATA.json

Machine-readable format with:

- All roles, colleges, departments, etc.
- IDs and codes
- Relationships between entities
- Metadata

### 🔧 Seed Command

**Location:** `project/app/lms/management/commands/seed_db.py`

Customizable seed script that creates all the data above.

---

## How to Add More Data

### Option 1: Add to Seed Command

Edit `project/app/lms/management/commands/seed_db.py`:

```python
# Add to subjects_data list
subjects_data = [
    # ... existing subjects ...
    {'name': 'Your New Subject', 'code': 'YNS101', 'dept': 'IT', 'level': '1st Year'},
]
```

Then re-run:

```bash
python manage.py seed_db
```

### Option 2: Django Shell

```bash
python manage.py shell
```

```python
from app.lms.models import Subject, Department, YearLevel

# Create new subject
it_dept = Department.objects.get(code='IT')
year1 = YearLevel.objects.get(level='1st Year')

new_subject = Subject.objects.create(
    name='Advanced Programming',
    code='CS201',
    department=it_dept,
    year_level=year1
)

print(f"Created: {new_subject.name} ({new_subject.code})")
```

### Option 3: Django Admin

Go to: `http://localhost:8000/admin/`

Log in and add data via the admin interface.

---

## Common Queries

### Get All Roles

```python
from app.users.models import Role
Role.objects.all().values('name', 'rank')
```

### Get IT Department Users

```python
from app.users.models import User
from app.lms.models import Department

it_dept = Department.objects.get(code='IT')
it_users = User.objects.filter(department=it_dept)
```

### Get All Classes in 1st Semester

```python
from app.lms.models import Class, SchoolYear

sy = SchoolYear.objects.get(name='2026-2027', semester='1st Semester')
classes = Class.objects.filter(school_year=sy)
```

### Get Subject Details

```python
from app.lms.models import Subject

cs101 = Subject.objects.get(code='CS101')
print(f"Subject: {cs101.name}")
print(f"Code: {cs101.code}")
print(f"Department: {cs101.department.name}")
print(f"Year Level: {cs101.year_level}")
```

---

## Idempotent

The seed command is **idempotent** - running it multiple times is safe:

```bash
# First run
python manage.py seed_db
# ✅ Creates all data

# Second run
python manage.py seed_db
# ✅ Skips existing data, creates only new items
```

---

## Troubleshooting

### "Command 'seed_db' not found"

The management command location might not exist. Create these directories:

```
project/
  app/
    lms/
      management/
        __init__.py
        commands/
          __init__.py
          seed_db.py
```

Then try again.

### IDs Not Showing in Dropdown

1. Go to **User Management** page
2. Open browser **Developer Tools** (F12)
3. Check **Console** for fetch errors
4. Verify roles endpoint: `GET http://localhost:3000/api/v1/auth/roles/`

### Foreign Key Constraints Error

Make sure you run migrations first:

```bash
python manage.py migrate
```

---

## Next Steps

After seeding:

1. ✅ Seed database with `python manage.py seed_db`
2. ✅ Create test users via **User Management** UI
3. ✅ Assign roles and departments to users
4. ✅ Create classes with seeded subjects and departments
5. ✅ Enroll students in classes
6. ✅ Start using the system!

---

## Need Help?

- 📖 Read: `SEED_REFERENCE.md` (detailed reference)
- 📊 Check: `SEED_DATA.json` (for all IDs)
- 🔧 Edit: `project/app/lms/management/commands/seed_db.py` (to customize)
- 💬 Ask: Use the User Management UI for most operations
