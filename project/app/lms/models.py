from django.db import models
from django.db.models.fields import related
from django.utils import timezone
import os, bleach, uuid
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from datetime import datetime
# from app.users.models import User

def get_document_upload_path(instance, filename):
    # Get current date
    now = datetime.now()
    # Define the path with prefix and current date
    date_path = now.strftime('%Y/%m/%d')
    return os.path.join('post', date_path, filename)

class UploadedFile(models.Model):
    file = models.FileField(upload_to="uploads/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self) -> str:
        return '{}'.format(self.file)

# Create your models here.
class College(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)

    def __str__(self) -> str:
        return "{}".format(self.name)


class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    college = models.ForeignKey(College, on_delete=models.PROTECT, related_name="departments")

    def __str__(self) -> str:
        return "{}".format(self.name)
    

class SchoolYear(models.Model):
    
    SEMESTER_CHOICES = [
        ('1st Semester', '1st Semester'),
        ('2nd Semester', '2nd Semester'),
        ('Midyear', 'Midyear')
    ]

    name = models.CharField(max_length=50)
    startYear = models.IntegerField(null=True)
    endYear = models.IntegerField(null=True)
    start = models.DateField(null=True)
    end = models.DateField(null=True)
    semester = models.CharField(max_length=12, choices=SEMESTER_CHOICES, default='1st Semester')

    def __str__(self) -> str:
        return "{} - {}".format(self.semester, self.name)


class YearLevel(models.Model):
    level = models.CharField(max_length=10)

    def __str__(self) -> str:
        super().__str__()
        return "{}".format(self.level)

class Section(models.Model):
    tblYearLevel = models.ForeignKey(YearLevel, on_delete=models.PROTECT, null=True, blank=True)
    section = models.CharField(max_length=10)

    def __str__(self) -> str:
        return "{}".format(self.section)


class Subject(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    year_level = models.ForeignKey(YearLevel, on_delete=models.SET_NULL, null=True)
    bayanihan_leader = models.ForeignKey('users.User', null=True, on_delete=models.SET_NULL)

    def __str__(self) -> str:
        super().__str__()
        return "{}".format(self.name)


class Class(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True)
    school_year = models.ForeignKey(SchoolYear, on_delete=models.PROTECT)
    year_level = models.ForeignKey(YearLevel, on_delete=models.PROTECT)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    section = models.ForeignKey(Section, on_delete=models.PROTECT)
    teacher = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='teacher')
    students = models.ManyToManyField('users.User', related_name='student')
    is_active = models.BooleanField(default=True)
    lessons = models.ManyToManyField('lms.Lesson', through='ClassLessons')

    def __str__(self) -> str:
        return '{}-{} ({})'.format(self.year_level, self.section, self.subject)

class Status(models.Model):
    name = models.CharField(max_length=15)

    def __str__(self) -> str:
        return "{}".format(self.name)


class Attendance(models.Model):
    student = models.ForeignKey('users.User', on_delete=models.PROTECT)
    classroom = models.ForeignKey(Class, on_delete=models.PROTECT, null=True)
    status = models.ForeignKey(Status, on_delete=models.PROTECT, null=True)
    is_present = models.BooleanField(default=False)
    date = models.DateField()

class Post(models.Model):
    uuid = models.UUIDField(unique=True, primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey('users.User', on_delete=models.PROTECT, related_name='created_by')
    description = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    image = models.ImageField(upload_to=get_document_upload_path, null=True, blank=True)
    
    def __str__(self):
        try:
            return f'{self.uuid}'
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

    def save(self, *args, **kwargs):
        try:
            super().save(*args, **kwargs)
            # self.override_event()
        except ValidationError as e:
            # Convert Django ValidationError to DRF ValidationError for JSON response
            raise DRFValidationError(e.message_dict)

class Module(models.Model):
    name = models.CharField(max_length=255)
    
    def __str__(self) -> str:
        return '{}'.format(self.name)

class Lesson(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    authors = models.ManyToManyField("users.User", related_name='authors')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    module = models.ForeignKey(Module, on_delete=models.PROTECT)
    archive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self) -> str:
        return '{}'.format(self.title)

    @property
    def excerpt(self) -> str:
        return '{}'.format(self.content[:100] + '...' if len(self.content) > 100 else self.content)


class ClassLessons(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT)
    classroom = models.ForeignKey(Class, on_delete=models.PROTECT)
    student = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL)
    activate = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    create_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return '{}-{}-{}'.format(self.lesson, self.classroom, self.student)
