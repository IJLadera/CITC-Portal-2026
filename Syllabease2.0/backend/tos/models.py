from bdb import effective
from django.utils import timezone 
from django.db import models
from academics.models import Course, Program
from bayanihan.models import BayanihanGroup
from syllabi.models import Syllabus
from users.models import User 

# Create your models here.

# TOS Template    
class TOSTemplate(models.Model):  
    code_no = models.CharField(max_length=50, editable=False, default="FM-USTP-ACAD-08") 
    title = models.CharField(max_length=255, editable=False, default="TOS") 
    description = models.TextField(blank=True, null=True)
    revision_no = models.PositiveIntegerField(default=0)
    effective_date = models.DateField(blank=True, null=True)
    header_image = models.ImageField(
        upload_to="documentImages/", 
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    class Meta:
        ordering = ["-created_at"]

    @property
    def revision_no_display(self):
        return f"{self.revision_no:02d}"

    def __str__(self):
        return f"TOS Template v{self.revision_no_display} (Effective {self.effective_date})"

    def save(self, *args, **kwargs):
        """
        When saving a new template, automatically assign a new revision_no number
        and deactivate previous revision_nos.
        """
        if not self.pk:  # only on create
            latest = TOSTemplate.objects.filter(is_active=True).order_by("-revision_no").first()
            
            if latest: 
                latest.is_active = False
                latest.save(update_fields=["is_active"]) 

        super().save(*args, **kwargs)
 
 
class TOS(models.Model):
    TERM_CHOICES = [
        ("PRELIM", "Prelim"),
        ("MIDTERM", "Midterm"),
        ("SEMI-FINALS", "Semi-finals"),
        ("FINALS", "Finals"),
    ]
    
    tos_template = models.ForeignKey(
        TOSTemplate, on_delete=models.CASCADE, related_name="tos_records", blank=True, null=True
    )
    syllabus = models.ForeignKey(
        Syllabus, on_delete=models.CASCADE, related_name="tos_records"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="tos_records"
    )
    bayanihan_group = models.ForeignKey(
        BayanihanGroup, on_delete=models.CASCADE, related_name="tos_records"
    )
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name="tos_records"
    )

    term = models.CharField(max_length=20, choices=TERM_CHOICES)
    effective_date = models.DateField(blank=True, null=True)

    total_items = models.PositiveIntegerField()
    col1_percentage = models.PositiveIntegerField()
    col2_percentage = models.PositiveIntegerField()
    col3_percentage = models.PositiveIntegerField()
    col4_percentage = models.PositiveIntegerField()
    col1_expected = models.PositiveIntegerField(blank=True, null=True)
    col2_expected = models.PositiveIntegerField(blank=True, null=True)
    col3_expected = models.PositiveIntegerField(blank=True, null=True)
    col4_expected = models.PositiveIntegerField(blank=True, null=True)
    
    tos_cpys = models.TextField(blank=True, null=True)
    chair = models.JSONField(null=True, blank=True)
    
    chair_submitted_at = models.DateTimeField(blank=True, null=True)
    chair_returned_at = models.DateTimeField(blank=True, null=True)
    chair_approved_at = models.DateTimeField(blank=True, null=True)
    
    status = models.CharField(max_length=30, blank=True, null=True)
    version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TOS v{self.version} - {self.course.course_code} ({self.term}, {self.bayanihan_group.school_year})"


class TOSRow(models.Model): 
    tos = models.ForeignKey(
        TOS, 
        on_delete=models.CASCADE, 
        related_name="tos_rows")
    
    topic = models.TextField(blank=True, null=True)
    no_hours = models.PositiveIntegerField(blank=True, null=True)
    percent = models.PositiveIntegerField(blank=True, null=True)
    no_items = models.PositiveIntegerField(blank=True, null=True)

    col1_value = models.PositiveIntegerField(blank=True, null=True)
    col2_value = models.PositiveIntegerField(blank=True, null=True)
    col3_value = models.PositiveIntegerField(blank=True, null=True)
    col4_value = models.PositiveIntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TOS Row {self.topic} for {self.tos.course.course_code}"


class TOSComment(models.Model):
    """
    Comment model tied to a specific TOS or a specific TOSRow.
    """
    # --- Relationships ---
    tos = models.ForeignKey(
        TOS,
        on_delete=models.CASCADE,
        related_name="comments",
        help_text="The TOS this comment is associated with."
    ) 
    
    # Make TOSRow optional (nullable). If this is set, the comment is row-specific.
    tos_row = models.ForeignKey(
        'TOSRow',
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True,
        help_text="The specific TOSRow this comment is associated with (optional)."
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        target = "TOS"
        if self.tos_row:
            target = f"TOSRow: {self.tos_row.topic}"  
        return f"{self.user.get_full_name()} → {target} ({self.tos})"

    def resolve(self):
        """Mark the comment as resolved."""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()
        