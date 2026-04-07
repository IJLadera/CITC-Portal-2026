from django.core.management.base import BaseCommand
from app.base_application.models import App


class Command(BaseCommand):
    help = 'Seed the database with default apps'

    def handle(self, *args, **options):
        apps_data = [
            {
                'name': 'Syllabease',
                'description': 'Manage syllabi and course materials',
                'logo_url': 'https://via.placeholder.com/100?text=Syllabease',
                'url': '/syllabease/dashboard/',
                'is_active': True,
                'is_visible_to_users': True,
                'display_order': 1,
            },
            {
                'name': 'UniEventify',
                'description': 'Event management and announcements',
                'logo_url': 'https://via.placeholder.com/100?text=UniEventify',
                'url': '/unieventify/app/dashboard/',
                'is_active': True,
                'is_visible_to_users': True,
                'display_order': 2,
            },
            {
                'name': 'LMS',
                'description': 'Learning Management System',
                'logo_url': 'https://via.placeholder.com/100?text=LMS',
                'url': '/lms/',
                'is_active': True,
                'is_visible_to_users': True,
                'display_order': 3,
            },
            {
                'name': 'Exam Sync',
                'description': 'Synchronized exam scheduling',
                'logo_url': 'https://via.placeholder.com/100?text=ExamSync',
                'url': '/examsync/dashboard/',
                'is_active': False,
                'is_visible_to_users': False,
                'display_order': 4,
            },
        ]

        for app_data in apps_data:
            app, created = App.objects.get_or_create(
                name=app_data['name'],
                defaults=app_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created app: {app_data["name"]}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'App already exists: {app_data["name"]}')
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded apps'))
