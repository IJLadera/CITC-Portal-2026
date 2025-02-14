from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import pre_save
from django.dispatch import receiver
from rest_framework.exceptions import ValidationError as DRFValidationError
# import PyPDF2
from django.core.mail import send_mail
from datetime import datetime
from cloudinary_storage.storage import RawMediaCloudinaryStorage
import os
import bleach
from auditlog.registry import auditlog
from app.users.models import User
from app.lms.models import Department, SchoolYear

# from .managers import CustomUserManager
import logging

logger = logging.getLogger(__name__)


class tblstudentOrg(models.Model):
    studentOrgType = models.CharField(max_length=255)
    studentOrgName = models.CharField(max_length=255)

    def __str__(self):
        try:
            return f'{self.studentOrgName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'


class tblEventType(models.Model):
    eventTypeName = models.CharField(max_length=255)

    def __str__(self):
        try:
            return f'{self.eventTypeName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    
class tblEventCategory(models.Model):
    eventCategoryName = models.CharField(max_length=255)

    def __str__(self):
        try:
            return f'{self.eventCategoryName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'

class tblVenue(models.Model):
    venueName = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True)

    def __str__(self):
        try:
            return f'{self.venueName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'

class tblSetup(models.Model):
    setupName = models.CharField(max_length=255)

    def __str__(self):
        try:
            return f'{self.setupName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    
class tblStatus(models.Model):
    statusName = models.CharField(max_length=255)

    def __str__(self):
        try:
            return f'{self.statusName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    

def get_image_upload_path(instance, filename):
    # Get current date
    now = datetime.now()
    # Define the path with prefix and current date
    date_path = now.strftime('%Y/%m/%d')
    return os.path.join('eventImages', date_path, filename)

def get_document_upload_path(instance, filename):
    # Get current date
    now = datetime.now()
    # Define the path with prefix and current date
    date_path = now.strftime('%Y/%m/%d')
    return os.path.join('eventFiles', date_path, filename)
    
class tblEvent(models.Model):
    eventType = models.ForeignKey(tblEventType, on_delete=models.CASCADE, null=True, blank=True)
    eventCategory = models.ForeignKey(tblEventCategory, on_delete=models.CASCADE, null=True, blank=True)
    venue = models.ForeignKey(tblVenue, on_delete=models.CASCADE, null=True, blank=True)
    setup = models.ForeignKey(tblSetup, on_delete=models.CASCADE, null=True, blank=True)
    status = models.ForeignKey(tblStatus, on_delete=models.CASCADE, null=True, blank=True)
    department = models.ManyToManyField(Department, blank=True, null=True)
    meetinglink = models.TextField(null=True, blank=True)
    participants = models.ManyToManyField(User, related_name='event_participants', blank=True, null=True)
    eventName = models.TextField()
    eventDescription = models.TextField()
    startDateTime = models.DateTimeField(null=True)
    endDateTime = models.DateTimeField(null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    approveDocuments = models.FileField(upload_to=get_document_upload_path, null=True, blank=True)
    images = models.ImageField(upload_to=get_image_upload_path, null=True, blank=True)
    isAnnouncement = models.BooleanField(null=True)
    isAprrovedByDean = models.BooleanField(null=True)
    isAprrovedByChairman = models.BooleanField(null=True)
    majorEvent = models.BooleanField(null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_createdby', null=True)
    recurrence_type = models.CharField(max_length=10, choices=[('none', 'None'), ('daily', 'Daily'), ('weekly', 'Weekly')], default='none')
    recurrence_days = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        try:
            return f'{self.eventName}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'

    def save_event_description(self, description):
        # List of allowed tags based on Slate.js functionality up to text alignment
        allowed_tags = [
            'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'blockquote', 'code', 
            'h1', 'h2', 'h3', 'h4', 'br', 'div', 'img'
        ]

        # List of allowed attributes
        allowed_attributes = {
            'a': ['href', 'title'],  # Allow links with href and title attributes
            'div': ['style'],        # Allow div with style for text alignment
            'img': ['src', 'alt', 'title', 'width', 'height']  # Allow attributes for images
        }

        # Whitelist specific styles allowed for the 'div' tag
        allowed_styles = ['text-align']
        
        # Clean the description, only allowing the specified tags, attributes, and styles
        sanitized_description = bleach.clean(
            description, 
            tags=allowed_tags, 
            attributes=allowed_attributes, 
            styles=allowed_styles,
            strip=True  # Remove disallowed tags
        )

        # Save the sanitized description to the event
        self.eventDescription = sanitized_description
    

    def clean(self):
        if self.startDateTime and self.endDateTime:
            # Ensure that startDateTime is not greater than endDateTime
            if self.startDateTime > self.endDateTime:
                raise DRFValidationError({
                    "startDateTime": ["The start date and time cannot be later than the end date and time."],
                    "endDateTime": ["The end date and time cannot be earlier than the start date and time."]
                })

        # Exclude events with any category that is not "student-related" or "school-related"
        if self.eventCategory and self.eventCategory.eventCategoryName.lower() not in ['student related', 'school related']:
            return

        # Define the start and end of the school year (August to July)
        now = timezone.now()
        current_year = now.year

        # Create naive datetimes for August 1st of the current year and July 31st of the next year
        august_start = datetime(current_year, 8, 1, 0, 0, 0)
        july_end = datetime(current_year + 1, 7, 31, 23, 59, 59)

        # Extracting the years for the message
        start_month = august_start.strftime("%B")  # 'August'
        end_month = july_end.strftime("%B")  # 'July'
        start_year = august_start.year
        end_year = july_end.year

        # Make them timezone-aware by setting the current timezone
        august_start = august_start.replace(tzinfo=timezone.get_current_timezone())
        july_end = july_end.replace(tzinfo=timezone.get_current_timezone())

        # Check if the event's start and end datetime are within the allowed range
        if not (august_start <= self.startDateTime <= july_end):
            raise DRFValidationError({
                "startDateTime": [f"The event's start date must be in the school year {start_year}-{end_year} ({start_month} {start_year} to {end_month} {end_year})."]
            })

        if not (august_start <= self.endDateTime <= july_end):
            raise DRFValidationError({
                "endDateTime": [f"The event's end date must be between {august_start.date()} and {july_end.date()}."]
            })

        if self.startDateTime > self.endDateTime:
            raise DRFValidationError({
                "date": ["The event's start date must be before the end date."]
            })

    def save(self, *args, **kwargs):
        try:
            self.clean()
            super().save(*args, **kwargs)
            # self.override_event()
        except ValidationError as e:
            # Convert Django ValidationError to DRF ValidationError for JSON response
            raise DRFValidationError(e.message_dict)

class tblEventLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event = models.ForeignKey(tblEvent, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        try:
            return f'{self.user} - {self.event}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'


class tblSemester(models.Model): 
    semesterName = models.CharField(max_length=255)
    startDate = models.DateField()
    endDate = models.DateField()
    schoolYear = models.ForeignKey(SchoolYear, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        try:
            return f'{self.semesterName} - {self.schoolYear}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    
class tblEventSchoolYearAndSemester(models.Model):
    semester = models.ForeignKey(tblSemester, on_delete=models.CASCADE, null=True, blank=True)
    events = models.ManyToManyField(tblEvent, blank=True)

    def __str__(self):
        try:
            return f'{self.semester}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    
class tblEventRemarks(models.Model):
    events = models.ForeignKey(tblEvent, on_delete=models.CASCADE, null=True, blank=True)
    remark = models.TextField()
 
    def __str__(self):
        try:
            return f'{self.events} - {self.remark}'
        except Exception as e:
            return f'Invalid Data ({self.pk}): {e}'
    
auditlog.register(tblEvent)


