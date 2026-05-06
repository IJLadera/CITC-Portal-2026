# Generated data migration to add GreenWatts IoT application

import uuid
from django.db import migrations


def add_greenwatts_app(apps, schema_editor):
    """Add GreenWatts IoT application to the App model"""
    App = apps.get_model('base_application', 'App')
    
    # Create GreenWatts app entry
    App.objects.get_or_create(
        name='GreenWatts',
        defaults={
            'uuid': uuid.uuid4(),
            'description': 'IoT Energy Management and Monitoring System',
            'url': 'greenwatts/',
            'logo_url': 'https://via.placeholder.com/100?text=GreenWatts',  # Placeholder URL
            'is_active': True,
            'is_visible_to_users': True,
            'display_order': 2,
        }
    )


def remove_greenwatts_app(apps, schema_editor):
    """Remove GreenWatts IoT application (reverse migration)"""
    App = apps.get_model('base_application', 'App')
    App.objects.filter(name='GreenWatts').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('base_application', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_greenwatts_app, remove_greenwatts_app),
    ]
