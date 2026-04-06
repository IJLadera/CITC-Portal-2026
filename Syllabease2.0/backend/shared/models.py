from django.db import models 
from django.utils import timezone
from academics.models import College
from bayanihan.models import BayanihanGroup
from syllabi.models import Syllabus
from tos.models import TOS
from users.models import User

# Create your models here. 
class Deadline(models.Model): 
    """Stores deadlines for syllabi and TOS per school year/semester"""

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    ]
    
    SEMESTER_CHOICES = [
        ("1ST", "1st Semester"),
        ("2ND", "2nd Semester"),
        ("SUMMER", "Summer"),
    ]
    
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="deadlines"
    )
    college = models.ForeignKey(
        College, on_delete=models.CASCADE, related_name="deadlines"
    )

    syll_deadline = models.DateTimeField(blank=True, null=True)
    syll_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="ACTIVE"
    )

    tos_midterm_deadline = models.DateTimeField(blank=True, null=True)
    tos_midterm_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="ACTIVE"
    )

    tos_final_deadline = models.DateTimeField(blank=True, null=True)
    tos_final_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="ACTIVE"
    )

    school_year = models.CharField(max_length=10)   # ex: 2024-2025
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta: 
        unique_together = ("college", "school_year", "semester")  # prevent duplicate deadlines
        ordering = ["-created_at"]

    def __str__(self):
        return f"Deadlines ({self.school_year}, {self.semester}) - {self.college}"
         

class Report(models.Model):   
    """
    Tracks submission, return, and approval timeline for a specific Syllabus.
    A new Report record is created for every new version or resubmission cycle.
    """ 
    bayanihan_group = models.ForeignKey(
        BayanihanGroup,
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="Bayanihan group associated with the syllabus.",
    )
    
    syllabus = models.ForeignKey(
        Syllabus,
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="The syllabus this report is tracking.",
    ) 

    # ---- Version tracking ----
    version = models.PositiveIntegerField(default=1)

    # ---- Timeline tracking fields ----
    chair_submitted_at = models.DateTimeField(blank=True, null=True) 
    chair_rejected_at = models.DateTimeField(blank=True, null=True)
    dean_submitted_at = models.DateTimeField(blank=True, null=True)
    dean_rejected_at = models.DateTimeField(blank=True, null=True)
    dean_approved_at = models.DateTimeField(blank=True, null=True) 
    
    # ---- Metadata ----
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Syllabus Reports {self.syllabus.course.course_title} (v{self.version})"

    # ---- Convenience methods ----
    def mark_chair_submitted(self):
        self.chair_submitted_at = timezone.now()
        self.save(update_fields=["chair_submitted_at", "updated_at"])
        
    def mark_chair_rejected(self):
        self.chair_rejected_at = timezone.now()
        self.save(update_fields=["chair_rejected_at", "updated_at"]) 
        
    def mark_dean_submitted(self):
        self.dean_submitted_at = timezone.now()
        self.save(update_fields=["dean_submitted_at", "updated_at"]) 
        
    def mark_dean_rejected(self):
        self.dean_rejected_at = timezone.now()
        self.save(update_fields=["dean_rejected_at", "updated_at"])

    def mark_dean_approved(self):
        self.dean_approved_at = timezone.now()
        self.save(update_fields=["dean_approved_at", "updated_at"])
        
   
class TOSReport(models.Model):
    """
    Tracks submission timeline for a specific TOS.
    No dean involvement.
    """
    bayanihan_group = models.ForeignKey(
        BayanihanGroup,
        on_delete=models.CASCADE,
        related_name="tos_reports",
        help_text="Bayanihan group associated with the TOS.",
    )

    tos = models.ForeignKey(
        TOS,
        on_delete=models.CASCADE,
        related_name="reports",
        help_text="The TOS this report is tracking.",
    )

    version = models.PositiveIntegerField(default=1)

    # Chair timeline
    chair_submitted_at = models.DateTimeField(blank=True, null=True)
    chair_returned_at = models.DateTimeField(blank=True, null=True)
    chair_approved_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]   

    def __str__(self):
        return f"TOS Reports {self.tos.course.course_title} (v{self.version})"

    # ---- Convenience methods ----
    def mark_chair_submitted(self):
        self.chair_submitted_at = timezone.now()
        self.save(update_fields=["chair_submitted_at", "updated_at"])
        
    def mark_chair_returned(self):
        self.chair_returned_at = timezone.now()
        self.save(update_fields=["chair_returned_at", "updated_at"]) 
        
    def mark_chair_approved(self):
        self.chair_approved_at = timezone.now()
        self.save(update_fields=["chair_approved_at", "updated_at"])  
