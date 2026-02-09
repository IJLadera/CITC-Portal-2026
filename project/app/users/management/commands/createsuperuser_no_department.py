"""
Create a superuser without the department field
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser without requiring department field'

    def add_arguments(self, parser):
        parser.add_argument(
            '--id-number',
            dest='id_number',
            help='ID number for the superuser',
        )
        parser.add_argument(
            '--email',
            dest='email',
            help='Email address for the superuser',
        )
        parser.add_argument(
            '--first-name',
            dest='first_name',
            help='First name for the superuser',
        )
        parser.add_argument(
            '--last-name',
            dest='last_name',
            help='Last name for the superuser',
        )
        parser.add_argument(
            '--password',
            dest='password',
            help='Password for the superuser (required in non-interactive mode)',
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            dest='noinput',
            help='Run in non-interactive mode (requires all arguments)',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        id_number = options.get('id_number')
        email = options.get('email')
        first_name = options.get('first_name')
        last_name = options.get('last_name')
        noinput = options.get('noinput')

        if not noinput:
            self.stdout.write(self.style.SUCCESS('Creating superuser...'))
            
            if not id_number:
                id_number = input('ID Number: ')
            if not email:
                email = input('Email address: ')
            if not first_name:
                first_name = input('First name: ')
            if not last_name:
                last_name = input('Last name: ')
            
            password = getpass.getpass('Password: ')
            password_confirm = getpass.getpass('Password (again): ')
            
            if password != password_confirm:
                self.stdout.write(self.style.ERROR('Error: Passwords do not match.'))
                return
            
            if not password:
                self.stdout.write(self.style.ERROR('Error: Password cannot be empty.'))
                return
        else:
            if not all([id_number, email, first_name, last_name]):
                self.stdout.write(self.style.ERROR(
                    'Error: In non-interactive mode, you must provide: '
                    '--id-number, --email, --first-name, --last-name, --password'
                ))
                return
            
            password = options.get('password')
            if not password:
                self.stdout.write(self.style.ERROR('Error: --password must be provided in non-interactive mode.'))
                return

        if User.objects.filter(id_number=id_number).exists():
            self.stdout.write(self.style.ERROR(f'Error: User with ID number "{id_number}" already exists.'))
            return
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'Error: User with email "{email}" already exists.'))
            return

        try:
            user = User(
                id_number=id_number,
                email=email,
                first_name=first_name,
                last_name=last_name,
                department=None,
                is_active=True,
                is_staff=True,
                is_superuser=True,
            )
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Superuser "{email}" created successfully with ID number "{id_number}".'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))
            raise
