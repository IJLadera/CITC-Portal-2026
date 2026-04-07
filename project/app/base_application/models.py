import uuid
from django.db import models
from django.utils import timezone

class App(models.Model):
    """Model for managing CITC Portal applications/capstones"""
    uuid = models.UUIDField(unique=True, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='app_logos/', null=True, blank=True)
    logo_url = models.CharField(max_length=500, blank=True, help_text="External URL for logo image")
    url = models.CharField(max_length=255, help_text="Route path for the app")
    is_active = models.BooleanField(default=True)
    is_visible_to_users = models.BooleanField(default=True, help_text="Show in user dashboard")
    display_order = models.IntegerField(default=0, help_text="Order to display apps")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name
 
