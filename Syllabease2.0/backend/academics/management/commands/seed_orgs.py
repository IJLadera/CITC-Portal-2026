from django.core.management.base import BaseCommand
from academics.models import College, Department, Program
from django.db import connection 

class Command(BaseCommand):
    help = "Seed the database with default colleges, departments, and programs"

    COLLEGES = [
        ("CEA", "College of Engineering and Architecture", "Active"),
        ("CITC", "College of Information Technology and Computing", "Active"),
        ("CSM", "College of Science and Mathematics", "Active"),
        ("CSTE", "College of Science and Technology Education", "Active"),
        ("CoT", "College of Technology", "Active"),
    ]

    DEPARTMENTS = [
        # college_code, dep_code, dep_name, dep_status
        ("CEA", "DA", "Department of Architecture", "Active"),
        ("CEA", "DCE", "Department of Civil Engineering", "Active"),
        ("CEA", "DME", "Department of Mechanical Engineering", "Active"),
        ("CEA", "DCpE", "Department of Computer Engineering", "Active"),
        ("CEA", "DGE", "Department of Geodetic Engineering", "Active"),
        ("CEA", "DELECTRICAL", "Department of Electrical Engineering", "Active"),
        ("CEA", "DELECTRONICS", "Department of Electronics Engineering", "Active"),

        ("CITC", "DIT", "Department of Information Technology", "Active"),
        ("CITC", "DTCM", "Department of Technology Communication Management", "Active"),
        ("CITC", "DDS", "Department of Data Science", "Active"),
        ("CITC", "DCS", "Department of Computer Science", "Active"),

        ("CSM", "DAPPLIEDMATH", "Department of Applied Mathematics", "Active"),
        ("CSM", "DAPPLIEDPHYSICS", "Department of Applied Physics", "Active"),
        ("CSM", "DCHEM", "Department of Chemistry", "Active"),
        ("CSM", "DENVISCI", "Department of Environmental Science", "Active"),
        ("CSM", "DFOODTECH", "Department of Food Technology", "Active"),

        ("CSTE", "DEDMS", "Department of Secondary Education Major in Science", "Active"),
        ("CSTE", "DEMS", "Department of Secondary Education Major in Mathematics", "Active"),
        ("CSTE", "DTLED", "Department of Technology and Livelihood Education", "Active"),
        ("CSTE", "DTVTED", "Department of Technical-Vocational Teacher Education", "Active"),

        ("CoT", "DET", "Department of Electronics Technology", "Active"),
        ("CoT", "DAUTOTRONICS", "Department of Autotronics", "Active"),
        ("CoT", "DESM", "Department of Energy Systems and Management", "Active"),
        ("CoT", "DEMT", "Department of Electro-Mechanical Technology", "Active"),
        ("CoT", "DMET", "Department of Manufacturing Engineering Technology", "Active"),
    ]

    PROGRAMS = {
        "DA": [("BSA", "Bachelor of Science in Architecture")],
        "DCE": [("BSCE", "Bachelor of Science in Civil Engineering")],
        "DME": [("BSME", "Bachelor of Science in Mechanical Engineering")],
        "DCpE": [("BSCpE", "Bachelor of Science in Computer Engineering")],
        "DGE": [("BSGE", "Bachelor of Science in Geodetic Engineering")],
        "DELECTRICAL": [("BSEE", "Bachelor of Science in Electrical Engineering")],
        "DELECTRONICS": [("BSECE", "Bachelor of Science in Electronics Engineering")],

        "DIT": [
            ("BSIT", "Bachelor of Science in Information Technology"),
            ("MIT", "Master in Information Technology"),
        ],
        "DTCM": [("BSTCM", "Bachelor of Science in Technology Communication Management")],
        "DDS": [("BSDS", "Bachelor of Science in Data Science")],
        "DCS": [("BSCS", "Bachelor of Science in Computer Science")],

        "DAPPLIEDMATH": [("BSAM", "Bachelor of Science in Applied Mathematics")],
        "DAPPLIEDPHYSICS": [("BSAP", "Bachelor of Science in Applied Physics")],
        "DCHEM": [("BSCHEM", "Bachelor of Science in Chemistry")],
        "DENVISCI": [("BSENVISCI", "Bachelor of Science in Environmental Science")],
        "DFOODTECH": [("BSFT", "Bachelor of Science in Food Technology")],

        "DEDMS": [("BSED-SCI", "Bachelor in Secondary Education Major in Science")],
        "DEMS": [("BSED-MATH", "Bachelor in Secondary Education Major in Mathematics")],
        "DTLED": [("BTLED", "Bachelor in Technology and Livelihood Education")],
        "DTVTED": [("BTVTED", "Bachelor in Technical-Vocational Teacher Education")],

        "DET": [("BSET", "Bachelor of Science in Electronics Technology")],
        "DAUTOTRONICS": [("BSAUTO", "Bachelor of Science in Autotronics")],
        "DESM": [("BSESM", "Bachelor of Science in Energy Systems and Management")],
        "DEMT": [("BSEMT", "Bachelor of Science in Electro-Mechanical Technology")],
        "DMET": [("BSMET", "Bachelor of Science in Manufacturing Engineering Technology")],
    }

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("⚠️ Deleting existing Colleges, Departments, and Programs..."))
        Program.objects.all().delete()
        Department.objects.all().delete()
        College.objects.all().delete()

        # Reset AUTO_INCREMENT for MySQL
        with connection.cursor() as cursor:
            cursor.execute("ALTER TABLE academics_college AUTO_INCREMENT = 1;")
            cursor.execute("ALTER TABLE academics_department AUTO_INCREMENT = 1;")
            cursor.execute("ALTER TABLE academics_program AUTO_INCREMENT = 1;")

        # Seed Colleges
        for code, desc, status in self.COLLEGES:
            College.objects.create(
                college_code=code,
                college_description=desc,
                college_status=status,
            )
            self.stdout.write(self.style.SUCCESS(f"🏛️ Created college: {desc}"))

        # Seed Departments + Programs
        for college_code, dep_code, dep_name, dep_status in self.DEPARTMENTS:
            try:
                college = College.objects.get(college_code=college_code)
                department = Department.objects.create(
                    college=college,
                    department_code=dep_code,
                    department_name=dep_name,
                    department_status=dep_status,
                )
                self.stdout.write(self.style.SUCCESS(f"🏫 Created department: {dep_name}"))

                # Add programs for department
                programs = self.PROGRAMS.get(dep_code, [])
                for prog_code, prog_name in programs:
                    Program.objects.create(
                        department=department,
                        program_code=prog_code,
                        program_name=prog_name,
                        program_status="Active",
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f"    🎓 Added program: {prog_code} - {prog_name}")
                    )

            except College.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"❌ College not found: {college_code}"))

        self.stdout.write(self.style.SUCCESS("🎉 Colleges, Departments, and Programs seeded successfully!"))