"""
Django Management Command to Seed Initial Data

This command creates all necessary seed data including:
- Roles (Admin, Faculty, Staff, Student, Guest, Chairman)
- Colleges
- Departments
- Year Levels
- Sections
- School Years
- Subjects
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from app.users.models import Role, User
from app.lms.models import College, Department, YearLevel, Section, SchoolYear, Subject
from django.utils import timezone
from datetime import datetime, timedelta
import uuid


class Command(BaseCommand):
    help = 'Seed the database with initial data (Roles, Colleges, Departments, etc.)'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # ==================== ROLES ====================
        self.stdout.write(self.style.WARNING('\n[1/7] Creating Roles...'))
        roles_data = [
            {'name': 'Admin', 'rank': 100},
            {'name': 'Chairman', 'rank': 90},
            {'name': 'Faculty', 'rank': 80},
            {'name': 'Staff', 'rank': 60},
            {'name': 'Student', 'rank': 40},
            {'name': 'Guest', 'rank': 10},
        ]
        
        roles = {}
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'rank': role_data['rank']}
            )
            roles[role_data['name']] = role
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {role_data['name']} (rank: {role_data['rank']}) - {status}")
        
        # ==================== COLLEGES ====================
        self.stdout.write(self.style.WARNING('\n[2/7] Creating Colleges...'))
        colleges_data = [
            {'name': 'College of Information and Communications Technology', 'code': 'CITC'},
            {'name': 'College of Education', 'code': 'CED'},
            {'name': 'College of Engineering', 'code': 'CEng'},
            {'name': 'College of Science', 'code': 'CS'},
            {'name': 'College of Industrial Technology', 'code': 'CIT'},
        ]
        
        colleges = {}
        for college_data in colleges_data:
            college, created = College.objects.get_or_create(
                code=college_data['code'],
                defaults={'name': college_data['name']}
            )
            colleges[college_data['code']] = college
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {college_data['code']} - {college_data['name']} - {status}")

        # ==================== DEPARTMENTS ====================
        self.stdout.write(self.style.WARNING('\n[3/7] Creating Departments...'))
        departments_data = [
            {'name': 'Information Technology', 'code': 'IT', 'college': 'CITC'},
            {'name': 'Computer Science', 'code': 'CS', 'college': 'CITC'},
            {'name': 'Information Systems', 'code': 'IS', 'college': 'CITC'},
            {'name': 'Engineering Mathematics', 'code': 'EM', 'college': 'CEng'},
            {'name': 'General Education', 'code': 'GE', 'college': 'CED'},
            {'name': 'Applied Science', 'code': 'AS', 'college': 'CS'},
            {'name': 'Industrial Engineering', 'code': 'IE', 'college': 'CIT'},
        ]
        
        departments = {}
        for dept_data in departments_data:
            college = colleges[dept_data['college']]
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                college=college,
                defaults={'name': dept_data['name']}
            )
            departments[dept_data['code']] = dept
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {dept_data['code']} - {dept_data['name']} - {status}")

        # ==================== YEAR LEVELS ====================
        self.stdout.write(self.style.WARNING('\n[4/7] Creating Year Levels...'))
        year_levels_data = ['1st Year', '2nd Year', '3rd Year', '4th Year']
        
        year_levels = {}
        for level in year_levels_data:
            year_level, created = YearLevel.objects.get_or_create(level=level)
            year_levels[level] = year_level
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {level} - {status}")

        # ==================== SECTIONS ====================
        self.stdout.write(self.style.WARNING('\n[5/7] Creating Sections...'))
        sections_data = ['A', 'B', 'C', 'D', 'E']
        
        sections = {}
        for section_name in sections_data:
            # Create sections for each year level
            for year_level_name, year_level in year_levels.items():
                section_key = f"{year_level_name}-{section_name}"
                section, created = Section.objects.get_or_create(
                    section=f"{year_level_name}-{section_name}",
                    tblYearLevel=year_level
                )
                sections[section_key] = section
                status = 'Created' if created else 'Already exists'
                self.stdout.write(f"  ✓ {section_key} - {status}")

        # ==================== SCHOOL YEARS ====================
        self.stdout.write(self.style.WARNING('\n[6/7] Creating School Years...'))
        current_year = datetime.now().year
        school_years_data = [
            {
                'name': f'{current_year}-{current_year + 1}',
                'sem': '1st Semester',
                'startYear': current_year,
                'endYear': current_year + 1,
                'start': datetime(current_year, 8, 1).date(),
                'end': datetime(current_year, 12, 31).date(),
            },
            {
                'name': f'{current_year}-{current_year + 1}',
                'sem': '2nd Semester',
                'startYear': current_year,
                'endYear': current_year + 1,
                'start': datetime(current_year + 1, 1, 1).date(),
                'end': datetime(current_year + 1, 5, 31).date(),
            },
            {
                'name': f'{current_year}-{current_year + 1}',
                'sem': 'Midyear',
                'startYear': current_year,
                'endYear': current_year + 1,
                'start': datetime(current_year + 1, 6, 1).date(),
                'end': datetime(current_year + 1, 7, 31).date(),
            },
        ]
        
        school_years = {}
        for sy_data in school_years_data:
            sy, created = SchoolYear.objects.get_or_create(
                name=sy_data['name'],
                semester=sy_data['sem'],
                defaults={
                    'startYear': sy_data['startYear'],
                    'endYear': sy_data['endYear'],
                    'start': sy_data['start'],
                    'end': sy_data['end'],
                }
            )
            school_years[f"{sy_data['name']}-{sy_data['sem']}"] = sy
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {sy_data['name']} - {sy_data['sem']} - {status}")

        # ==================== SUBJECTS ====================
        self.stdout.write(self.style.WARNING('\n[7/7] Creating Subjects...'))
        subjects_data = [
            {'name': 'Introduction to Programming', 'code': 'CS101', 'dept': 'IT', 'level': '1st Year'},
            {'name': 'Data Structures', 'code': 'CS102', 'dept': 'IT', 'level': '2nd Year'},
            {'name': 'Web Development', 'code': 'CS103', 'dept': 'IT', 'level': '2nd Year'},
            {'name': 'Database Management Systems', 'code': 'CS104', 'dept': 'CS', 'level': '3rd Year'},
            {'name': 'Machine Learning', 'code': 'CS105', 'dept': 'CS', 'level': '4th Year'},
            {'name': 'Systems Administration', 'code': 'IS101', 'dept': 'IS', 'level': '3rd Year'},
            {'name': 'English 101', 'code': 'GE101', 'dept': 'GE', 'level': '1st Year'},
            {'name': 'Mathematics 101', 'code': 'EM101', 'dept': 'EM', 'level': '1st Year'},
        ]
        
        subjects = {}
        for subject_data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                code=subject_data['code'],
                defaults={
                    'name': subject_data['name'],
                    'department': departments[subject_data['dept']],
                    'year_level': year_levels[subject_data['level']],
                }
            )
            subjects[subject_data['code']] = subject
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"  ✓ {subject_data['code']} - {subject_data['name']} - {status}")

        # ==================== SUMMARY ====================
        self.stdout.write(self.style.SUCCESS('\n✓ Database seeding completed successfully!'))
        self.stdout.write(self.style.WARNING('\n=== SUMMARY ==='))
        self.stdout.write(f'  Roles: {len(roles)}')
        self.stdout.write(f'  Colleges: {len(colleges)}')
        self.stdout.write(f'  Departments: {len(departments)}')
        self.stdout.write(f'  Year Levels: {len(year_levels)}')
        self.stdout.write(f'  Sections: {len(sections)}')
        self.stdout.write(f'  School Years: {len(school_years)}')
        self.stdout.write(f'  Subjects: {len(subjects)}')
        self.stdout.write(self.style.SUCCESS('\n✓ You can now use User Management to add test users!'))
