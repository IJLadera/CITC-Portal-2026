from bdb import effective
from time import timezone
from django.db import models
from django.utils import timezone 
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

from academics.models import Course, College, Department, Program, Curriculum, ProgramOutcome, PEO
from bayanihan.models import BayanihanGroup 
from users.models import User

# Create your models here.

# Syllabus Template and Sections    
class SyllabusTemplate(models.Model):  
    code_no = models.CharField(max_length=50, editable=False, default="FM-USTP-ACAD-01") 
    title = models.CharField(max_length=255, editable=False, default="Syllabus") 
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

    def __str__(self):
        return f"Syllabus Template v{self.revision_no} (Effective {self.effective_date})"

    def save(self, *args, **kwargs):
        """
        When saving a new template, automatically assign a new revision_no number
        and deactivate previous revision_nos.
        """
        if not self.pk:  # only on create
            latest = SyllabusTemplate.objects.filter(is_active=True).order_by("-revision_no").first() 
            
            if latest: 
                latest.is_active = False
                latest.save(update_fields=["is_active"]) 

        super().save(*args, **kwargs)  
    
    
class Syllabus(models.Model):  
    syllabus_template = models.ForeignKey(
        SyllabusTemplate, on_delete=models.PROTECT, related_name="syllabi", blank=True, null=True
    )
    bayanihan_group = models.ForeignKey(
        BayanihanGroup, on_delete=models.PROTECT, related_name="syllabi"
    )
    course = models.ForeignKey(
        Course, on_delete=models.PROTECT, related_name="syllabi"
    )
    college = models.ForeignKey(
        College, on_delete=models.PROTECT, related_name="syllabi"
    ) 
    program = models.ForeignKey(
        Program, on_delete=models.PROTECT, related_name="syllabi"
    )
    curriculum = models.ForeignKey(
        Curriculum, on_delete=models.PROTECT, related_name="syllabi"
    )
    
    peos = models.ManyToManyField(
        PEO, related_name="syllabi", blank=True
    )
    program_outcomes = models.ManyToManyField(
        ProgramOutcome, related_name="syllabi", blank=True
    )
    
    effective_date = models.DateField(blank=True, null=True)
    
    class_schedules = models.TextField(blank=True, null=True)
    building_room = models.TextField(blank=True, null=True)
    class_contact = models.TextField(blank=True, null=True)
    
    consultation_hours = models.TextField(blank=True, null=True)
    consultation_room = models.TextField(blank=True, null=True)
    consultation_contact = models.TextField(blank=True, null=True)
    
    course_description = models.TextField(blank=True, null=True)  
    course_requirements = models.TextField(blank=True, null=True)
    
    chair_submitted_at = models.DateTimeField(blank=True, null=True)
    chair_rejected_at = models.DateTimeField(blank=True, null=True)
    dean_submitted_at = models.DateTimeField(blank=True, null=True)
    dean_rejected_at = models.DateTimeField(blank=True, null=True)
    dean_approved_at = models.DateTimeField(blank=True, null=True)
    
    status = models.CharField(max_length=50, blank=True, null=True)
    version = models.PositiveIntegerField() 

    dean = models.JSONField(null=True, blank=True)
    chair = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Syllabus v{self.version or '1'} for {self.course.course_code} - {self.course.course_semester} - {self.bayanihan_group.school_year}"


class SyllabusInstructor(models.Model): 
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="instructors")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} teaches {self.syllabus.course.course_code}, {self.syllabus.course.course_year_level} - {self.syllabus.bayanihan_group.school_year}"
    
    
class SyllabusCourseOutcome(models.Model): 
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name="course_outcomes")
    
    co_code = models.CharField(max_length=20)
    co_description = models.TextField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.co_code} - {self.co_description[:30]}"
        
        
class SyllCoPo(models.Model): 
    syllabus = models.ForeignKey(
        Syllabus, on_delete=models.CASCADE, related_name="syllcopos"
    )
    
    course_outcome = models.ForeignKey(
        SyllabusCourseOutcome, on_delete=models.CASCADE, related_name="syllcopos"
    )
    program_outcome = models.ForeignKey(
        ProgramOutcome, on_delete=models.CASCADE
    ) 
    
    syllabus_co_po_code = models.CharField(max_length=5, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("course_outcome", "program_outcome")

    def __str__(self):
        return f"{self.course_outcome.co_code} → {self.program_outcome.po_letter}"
        

class SyllabusCourseOutline(models.Model):
    TERM_CHOICES = [
        ("PRELIM", "Prelim"),
        ("MIDTERM", "Midterm"),
        ("PRE-FINALS", "Pre-finals"),
        ("FINALS", "Finals"),
    ]
    
    syllabus = models.ForeignKey(
        Syllabus, on_delete=models.CASCADE, related_name="course_outlines"
    )
    
    syllabus_term = models.CharField(max_length=20, choices=TERM_CHOICES)
    row_no = models.PositiveIntegerField(blank=True, null=True)
    allotted_hour = models.PositiveIntegerField()
    allotted_time = models.TextField(blank=True, null=True)
    intended_learning = models.TextField(blank=True, null=True)
    topics = models.TextField()
    suggested_readings = models.TextField(blank=True, null=True)
    learning_activities = models.TextField(blank=True, null=True)
    assessment_tools = models.TextField(blank=True, null=True)
    grading_criteria = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.syllabus.course.course_code} - {self.syllabus.course.course_semester} - {self.syllabus.bayanihan_group.school_year} Outline (Row {self.row_no or '-'})"
    

class SyllabusCotCo(models.Model): 
    course_outline = models.ForeignKey(
        SyllabusCourseOutline, on_delete=models.CASCADE, related_name="cotcos"
    )
    course_outcome = models.ForeignKey(
        SyllabusCourseOutcome, on_delete=models.CASCADE, related_name="cotcos"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("course_outline", "course_outcome")

    def __str__(self):
        return f"{self.course_outline} ↔ {self.course_outcome}" 


class SyllabusDeanFeedback(models.Model): 
    syllabus = models.OneToOneField(
        Syllabus,
        on_delete=models.CASCADE,
        related_name="dean_feedback"
    ) 
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    feedback_text = models.TextField() 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback by {self.user.first_name} on {self.syllabus}"


class SyllabusComment(models.Model):
    """
    Comment model tied to a specific section of a Syllabus.
    Sections can be logical areas like: 
    """
    SECTION_CHOICES = [
        ("header_1", "Header 1 - Department Info"), 
        ("header_2", "Header 2 - Course Info"),
        ("section_1", "Section 1 - Class Schedule / Rooms"),
        ("section_2", "Section 2 - Pre-req / Co-req"),
        ("section_3", "Section 3 - Instructor Details"),
        ("section_4", "Section 4 - Consultation Details"),
        ("course_description", "Course Description"),
        ("course_outcomes", "Course Outcomes"),
        ("course_outlines", "Course Outlines"),
        ("course_requirements", "Course Requirements"),
        ("side_vision_mission", "University Vision/Mission/Core Values"),
        ("side_peos", "Program Educational Objectives (PEOs)"),
        ("side_pos", "Program Outcomes (POs)"),
    ] 

    # --- metadata ---
    syllabus = models.ForeignKey(
        Syllabus,
        on_delete=models.CASCADE,
        related_name="comments",
        help_text="The syllabus this comment is associated with."
    )

    section = models.CharField(
        max_length=50,
        choices=SECTION_CHOICES,
        help_text="Which section of the syllabus this comment refers to."
    ) # type: ignore

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.get_full_name()} → {self.section} ({self.syllabus})"

    def resolve(self):
        """Mark the comment as resolved."""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()
        
    
# Syllabus Review Form Template 
class ReviewFormTemplate(models.Model):
    """The overall syllabus review form (like FM-USTP-ACAD-12 Rev 00 or Rev 01)."""
    code_no = models.CharField(max_length=50, default="FM-USTP-ACAD-12") 
    title = models.CharField(max_length=255, default="Syllabus Review Form")
    revision_no = models.PositiveIntegerField(default=0)
    effective_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)   

    def __str__(self):
        return f"Syllabus Review Form Template v{self.revision_no} (Effective {self.effective_date})"

    class Meta:
        ordering = ["-revision_no"]
        verbose_name = "Review Form Template"
        verbose_name_plural = "Review Form Templates"

class ReviewFormItem(models.Model):
    """Represents either a part header or an indicator in the syllabus review checklist."""
    PART = "part"
    INDICATOR = "indicator"
    ITEM_TYPES = [
        (PART, "Part Header"),
        (INDICATOR, "Indicator"),
    ] 
 
    SYLLABUS_SECTION = [
        ("format", "Format"), 
        ("header_1", "Header 1"),
        ("header_2", "Header 2"),
        ("section_1", "Section 1"),
        ("section_2", "Section 2"),
        ("section_3", "Section 3"),
        ("section_4", "Section 4"),
        ("side_section", "Side Section"),
        ("course_description", "Course Description"),
        ("course_outcomes", "Course Outcomes"),
        ("course_outlines", "Course Outlines"), 
        ("course_requirements", "Course Requirements"),  
    ] 
     
    # 🔥 changed from ForeignKey → CharField
    syllabus_section = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        choices=SYLLABUS_SECTION,
        help_text="Name of the syllabus section this indicator validates."
    )
    
    form_template = models.ForeignKey(
        ReviewFormTemplate,
        related_name="items",
        on_delete=models.CASCADE
    )
    
    type = models.CharField(max_length=20, choices=ITEM_TYPES, default=INDICATOR)
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"[{self.get_type_display()}] {self.text[:50]}"
    
    # def save(self, *args, **kwargs):
    #     if self.pk is not None:
    #         raise ValueError(
    #             f"{self.__class__.__name__} instances are immutable. "
    #             "Create a new template version instead."
    #         )
    #     super().save(*args, **kwargs)
 
    class Meta:
        ordering = ["order"]

class ReviewFormField(models.Model):
    """
    Represents dynamic fields that appear outside the checklist indicators,
    such as 'Course Code', 'Faculty', 'Additional Comments', etc.
    """
    TEXT = "text"
    TEXTAREA = "textarea"
    DATE = "date"

    FIELD_TYPES = [
        (TEXT, "Text"),
        (TEXTAREA, "Textarea"),
        (DATE, "Date"),
    ]

    # NEW: Auto-fill sources
    PREFILL_CHOICES = [
        ("none", "None"),
        
        ("course_code", "Course Code"),
        ("course_title", "Course Title"),
        ("course_year_level", "Course Year Level"),
        ("program_code", "Program Code"),
        ("program_name", "Program Name"),
        ("department_code", "Department Code"),
        ("department_name", "Department Name"),
        ("college_code", "College Code"),
        ("college_name", "College Name"),
        ("faculty", "Faculty"), 
        ("semester", "Semester"), 

        # Combined fields
        ("course_code_title", "Course Code + Course Title"),
        ("semester_and_year", "Semester + School Year"),  
    ]

    form_template = models.ForeignKey(
        ReviewFormTemplate, related_name="fields", on_delete=models.CASCADE
    )
    
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES, default=TEXT)
    is_required = models.BooleanField(default=False)
 
    prefill_source = models.CharField(
        max_length=50,
        choices=PREFILL_CHOICES,
        default="none",
        help_text="If set, this field will automatically pull data from the Syllabus."
    )

    position = models.CharField(
        max_length=20,
        choices=[("header", "Header"), ("footer", "Footer")],
        default="header",
    )

    # Structured grid placement (for table-like layouts)
    row = models.PositiveIntegerField(default=0, help_text="Row index within section.")
    column = models.PositiveIntegerField(default=0, help_text="Column index within section.")
    span_full = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)  

    def __str__(self): 
        field_type_display = self.get_field_type_display() 
        return f"{self.form_template.title} → [{field_type_display}] {self.label} ({self.position} r{self.row}c{self.column})" 
    
    # def save(self, *args, **kwargs):
    #     if self.pk is not None:
    #         raise ValueError(
    #             f"{self.__class__.__name__} instances are immutable. "
    #             "Create a new template version instead."
    #         )
    #     super().save(*args, **kwargs) 
    
    class Meta:
        ordering = ["position", "row", "column", "display_order"]
    

# Syllabus Review Form Records
class SRFForm(models.Model):  
    class Action(models.IntegerChoices):
        REJECTED = 0, "Rejected"
        APPROVED = 1, "Approved"
 
    form_template = models.ForeignKey(ReviewFormTemplate, on_delete=models.PROTECT)
    syllabus = models.OneToOneField(
        Syllabus,
        on_delete=models.CASCADE,
        related_name="review_form"
    )
    user = models.ForeignKey( 
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="syllabus_reviewings"
    )
    
    effective_date = models.DateField(blank=True, null=True) 

    review_date = models.DateField(auto_now_add=True)
    reviewed_by_snapshot = models.CharField(max_length=255)  # preserve history
    action = models.IntegerField(choices=Action.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.Action(self.action).label} - {self.syllabus.course.course_code} ({self.syllabus})"

    class Meta:
        ordering = ["-review_date", "-created_at"]
        verbose_name = "Syllabus Review Form"
        verbose_name_plural = "Syllabus Review Forms"
         
class SRFIndicator(models.Model): 
    class Response(models.TextChoices):
        YES = "yes", "Yes"
        NO = "no", "No"

    review_form = models.ForeignKey(
        SRFForm,
        on_delete=models.CASCADE,
        related_name="indicators"
    )
    item = models.ForeignKey(
        ReviewFormItem,
        on_delete=models.PROTECT,
        related_name="responses"
    )
    response = models.CharField(max_length=3, null=True, choices=Response.choices)
    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        label = self.Response(self.response).label if self.response else "No response"
        return f"{self.item.text[:25]} - {label}"

    class Meta:
        unique_together = ("review_form", "item")
        ordering = ["item__order"]
        verbose_name = "SRF Checklist Item"
        verbose_name_plural = "SRF Checklist Items"

class SRFFieldValue(models.Model):
    review_form = models.ForeignKey(
        SRFForm,
        on_delete=models.CASCADE,
        related_name="field_values"
    )
    field = models.ForeignKey(
        ReviewFormField,
        on_delete=models.PROTECT
    )
    value = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.field.label}: {self.value}"
    