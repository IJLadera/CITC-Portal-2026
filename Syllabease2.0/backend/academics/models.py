from django.db import models
from django.conf import settings
from users.models import User
from django.db.models import JSONField

# Create your models here.
class College(models.Model): 
    college_code = models.CharField(max_length=50)
    college_description = models.CharField(max_length=255)
    college_status = models.CharField(max_length=50, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"{self.college_code} - {self.college_description}"
        
        
class Department(models.Model): 
    college = models.ForeignKey(
        College, on_delete=models.PROTECT, related_name="departments"
    )
    department_code = models.CharField(max_length=50)
    department_name = models.CharField(max_length=255)  
    department_status = models.CharField(max_length=50, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)     

    def __str__(self):
        return f"{self.department_code} - {self.department_name}"
        

class Program(models.Model):
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="programs"
    )
    program_code = models.CharField(max_length=50)
    program_name = models.CharField(max_length=255)
    program_status = models.CharField(max_length=50, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)     

    def __str__(self):
        return f"{self.program_code} - {self.program_name}"
    
    
class Curriculum(models.Model): 
    program = models.ForeignKey(
        Program, on_delete=models.PROTECT, related_name="curricula"
    )
    curr_code = models.CharField(max_length=50)
    effectivity = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    
    def __str__(self):
        return f"{self.curr_code} - {self.effectivity} ({self.program.program_code})"
 

class Course(models.Model): 
    SEMESTER_CHOICES = [
        ("1ST", "1st Semester"),
        ("2ND", "2nd Semester"),
        ("MID_YEAR", "Mid Year"),
        ("SUMMER", "Summer"),
    ]
    
    YEAR_LEVEL_CHOICES = [
        ("1", "1st Year"),
        ("2", "2nd Year"),
        ("3", "3rd Year"),
        ("4", "4th Year"),
        ("5", "5th Year"),
    ]
    
    curriculum = models.ForeignKey(
        Curriculum, on_delete=models.PROTECT, related_name="courses"
    )
    course_title = models.CharField(max_length=255)
    course_code = models.CharField(max_length=50)
    course_unit_lec = models.PositiveSmallIntegerField(default=0)
    course_unit_lab = models.PositiveSmallIntegerField(default=0)
    course_credit_unit = models.PositiveSmallIntegerField(default=0)
    
    course_hrs_lec = models.PositiveSmallIntegerField(default=0)
    course_hrs_lab = models.PositiveSmallIntegerField(default=0)
    
    course_pre_req = models.CharField(max_length=255, blank=True)
    course_co_req = models.CharField(max_length=255, blank=True)
    course_year_level = models.CharField(max_length=2, choices=YEAR_LEVEL_CHOICES)
    course_semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    def __str__(self):
        return f"{self.course_code} - {self.course_title}"
        
        
class PEO(models.Model):
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name="peos"
    )
    peo_code = models.CharField(max_length=50)
    peo_description = models.TextField() 
    is_active = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return  f"({self.program.program_code}) {self.peo_code}"
 

class ProgramOutcome(models.Model):
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name="program_outcomes"
    )
    po_letter = models.CharField(max_length=10)
    po_description = models.TextField() 
    is_active = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"({self.program.program_code}) {self.po_letter}: - {self.po_description}"


class Memo(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='memos',
        null=True,
        blank=True
    )

    # ✨ NEW FIELDS
    memo_no = models.CharField(max_length=50, null=True, blank=True)
    series_year = models.CharField(max_length=10, null=True, blank=True)
    from_field = models.TextField(null=True, blank=True)
    to_field = models.TextField(null=True, blank=True)
    subject = models.TextField(null=True, blank=True)
    rows = JSONField(null=True, blank=True)

    # EXISTING FIELDS
    title = models.TextField()
    description = models.TextField(null=True, blank=True)
    file_name = models.FileField(upload_to="memos/", null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    recipients = models.ManyToManyField(
        User,
        related_name="memos_received",
        blank=True
    )

    def __str__(self):
        return f"Memo: {self.title}"

 