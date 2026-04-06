from django.core.management.base import BaseCommand
from users.models import Role

class Command(BaseCommand):
    help = "Seed the database with default roles"

    DEFAULT_ROLES = [
        ("ADMIN", "Admin"),
        ("AUDITOR", "Auditor"),
        ("CHAIRPERSON", "Chairperson"),
        ("DEAN", "Dean"),
        ("BAYANIHAN_LEADER", "Bayanihan Leader"),
        ("BAYANIHAN_TEACHER", "Bayanihan Teacher"),
    ]

    def handle(self, *args, **kwargs):
        for code, label in self.DEFAULT_ROLES:
            role, created = Role.objects.get_or_create(name=code)
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created role: {label}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Role already exists: {label}"))
        self.stdout.write(self.style.SUCCESS("🎉 Roles seeding complete!"))
