from pickletools import read_long1
from pyexpat import model
from urllib.parse import urlsplit, urlunsplit
from django.forms import ValidationError
from rest_framework import serializers
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from .models import ( 
    Syllabus, SyllabusInstructor, SyllabusCourseOutcome, 
    SyllCoPo, SyllabusCourseOutline, SyllabusCotCo,
    SyllabusDeanFeedback, SyllabusTemplate, SyllabusComment,
    ReviewFormTemplate, ReviewFormItem, ReviewFormField, 
    SRFForm, SRFIndicator, SRFFieldValue,
)
from bayanihan.models import BayanihanGroup, BayanihanGroupUser
from academics.models import College, Department, Program, Curriculum, Course, PEO, ProgramOutcome
from users.models import UserRole, User
from shared.models import Report

from users.serializers import ProfileSerializer, UserSerializer
from academics.serializers import CollegeSerializer
from bayanihan.serializers import BayanihanGroupSerializer

from typing import Optional


# Syllabus Template Serializers
class SyllabusTemplateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = SyllabusTemplate
        fields = [
            "id", "revision_no", "effective_date", "description",
            "header_image", "is_active", "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "revision_no", "is_active", "created_at", "updated_at"]

    # ✅ On create, deactivate old active templates and activate new one
    def create(self, validated_data):
        # Auto-increment revision_no number
        # last_template = SyllabusTemplate.objects.filter(is_active=True).order_by("-revision_no").first()
        # next_revision_no = (last_template.revision_no + 1) if last_template else 0
        # validated_data["revision_no"] = next_revision_no

        # Deactivate any currently active template
        SyllabusTemplate.objects.filter(is_active=True).update(is_active=False)

        # Automatically set the new one as active 
        template = SyllabusTemplate.objects.create(is_active=True, **validated_data)

        return template

    def update(self, instance, validated_data):
        # 🚫 Completely disallow updates for historical accuracy
        raise serializers.ValidationError(
            "Syllabus Templates cannot be updated to preserve historical accuracy. "
            "Create a new template version instead."
        )
        
        
# Syllabus Creation Serializer
def get_public_url(url: str):
    parts = urlsplit(url)
    # Remove querystring (signed params)
    clean = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
    return clean

def build_user_json(ur: Optional[UserRole], request=None):
    """
    Build JSON with prefix firstname lastname suffix aand signature (absolute URL).nd signature.
    """
    if not ur:
        return None
    
    u = ur.user
    
    prefix = u.prefix or ""
    firstname = u.first_name or ""  # from AbstractUser
    lastname = u.last_name or ""    # from AbstractUser
    suffix = u.suffix or ""

    # Build full name: "Prefix Firstname Lastname Suffix"
    full_name = " ".join(p for p in [prefix, firstname, lastname, suffix] if p).strip()

    # Signature validation 
    if not u.signature:
        raise ValidationError({
            "signature": f"User '{full_name}' must have a signature uploaded."
        })

    # Build absolute signature URL
    raw_url = u.signature.url
    clean_url = get_public_url(raw_url)

    if request:
        signature_url = request.build_absolute_uri(clean_url)
    else:
        signature_url = clean_url

    return {
        "id": u.id, 
        "name": full_name,
        "email": getattr(u, "email", None),
        "signature": signature_url,
        "assigned_at": getattr(ur, "created_at", timezone.now()).isoformat(),
    }

def get_current_dean_json(college: College, request=None):
    ur = (
        UserRole.objects
        .select_related("user", "role")
        .filter(role__name="DEAN", entity_type="College", entity_id=college.pk)
        .order_by("-created_at")
        .first()
    )
    return build_user_json(ur, request)

def get_current_chair_json(department: Department, request=None):
    ur = (
        UserRole.objects
        .select_related("user", "role")
        .filter(role__name="CHAIRPERSON", entity_type="Department", entity_id=department.pk)
        .order_by("-created_at")
        .first()
    )
    return build_user_json(ur, request)

class SyllabusCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used by POST /syllabi/ to create a draft v1 syllabus
    and auto-populate dean/chair & PEO/PO relations.
    """ 
    bayanihan_group_id = serializers.PrimaryKeyRelatedField(
        queryset=BayanihanGroup.objects.all(),
        source="bayanihan_group",
        write_only=True
    ) 

    class Meta:
        model = Syllabus
        fields = [
            "id",
            # write-only inputs for creation 
            "bayanihan_group_id",  

            # readonly auto / derived
            "syllabus_template",
            "status",
            "version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["syllabus_template", "status", "version", "created_at", "updated_at"]

    def validate(self, attrs): 
        bg = attrs.get("bayanihan_group")
        course = bg.course
        curriculum = course.curriculum
        program = curriculum.program
        department = program.department
        college = department.college

        # Uniqueness rule: prevent duplicate syllabus
        if Syllabus.objects.filter(course=course, bayanihan_group=bg).exists():
            raise serializers.ValidationError(
                "This course already has a syllabus for the selected school year."
            )

        # Uniqueness rule: prevent duplicate syllabus
        if not SyllabusTemplate.objects.filter(is_active=True).exists():
            raise serializers.ValidationError(
                "A template for the Syllabus doesn't exist, please inform Admin to create a template first."
            )
    
        # Check if department program has PEOs and Program Outcomes
        peos_count = PEO.objects.filter(program=program, is_active=True).count()
        pos_count = ProgramOutcome.objects.filter(program=program, is_active=True).count()
        if peos_count == 0 or pos_count == 0:
            raise serializers.ValidationError(
                "Cannot create syllabus: the department program must add "
                f"{'PEOs' if peos_count == 0 else ''}"
                f"{' and ' if peos_count == 0 and pos_count == 0 else ''}"
                f"{'Program Outcomes' if pos_count == 0 else ''} first."
            )

        # Check if Dean and Chair are assigned 
        request = self.context.get("request")

        dean_json = get_current_dean_json(college, request)
        chair_json = get_current_chair_json(department, request)

        if dean_json is None or chair_json is None:
            missing = []
            if dean_json is None:
                missing.append("Dean")
            if chair_json is None:
                missing.append("Chairperson")
            raise serializers.ValidationError(
                f"Cannot create syllabus: no {', '.join(missing)} assigned."
            )

        return attrs

    def create(self, validated_data): 
        request = self.context.get("request") 
        bg = validated_data["bayanihan_group"]
        
        course: Course = bg.course
        curriculum: Curriculum = course.curriculum 
        program: Program = curriculum.program
        department: Department = program.department
        college: College = department.college

        # auto fields
        status = "Draft"
        version = 1

        # dean/chair JSON
        dean_json = get_current_dean_json(college, request)
        chair_json = get_current_chair_json(department, request)
        
        syllabus_template = (
            SyllabusTemplate.objects
            .filter(is_active=True)
            .order_by("-revision_no")
            .first()
        ) 
        
        # Create syllabus shell
        syllabus = Syllabus.objects.create(
            syllabus_template=syllabus_template,
            effective_date=syllabus_template.effective_date if syllabus_template and syllabus_template.effective_date else None,
            bayanihan_group=bg,
            course=course,
            college=college,
            program=program,
            curriculum=curriculum,  

            status=status,
            version=version,
            
            dean=dean_json,
            chair=chair_json,
        )

        # Set current program PEOs & POs
        syllabus.peos.set(PEO.objects.filter(program=program, is_active=True))
        syllabus.program_outcomes.set(ProgramOutcome.objects.filter(program=program, is_active=True)) 

        # Create initial Report record for Dean Reports (version 1)
        Report.objects.create(
            syllabus=syllabus,
            bayanihan_group=bg, 
            version=version,
        )

        return syllabus
    

# Syllabus Header Update Serializer
class SyllabusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating syllabus fields after creation.
    Doesn't allow changing bayanihan_group, course, etc.
    """
    instructor_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
        help_text="Replace assigned instructors with this list"
    )

    class Meta:
        model = Syllabus
        fields = [
            "id",
            "effective_date",
            "class_schedules",
            "building_room",
            "class_contact",
            
            "consultation_hours",
            "consultation_room",
            "consultation_contact",
            
            "course_description",
            
            "instructor_ids",  # write-only 
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def update(self, instance, validated_data):
        # Handle instructor replacement if provided
        instructor_users = validated_data.pop("instructor_ids", None)
        if instructor_users is not None:
            instance.instructors.all().delete()  # clear old links
            for user in instructor_users:
                SyllabusInstructor.objects.create(syllabus=instance, user=user)

        # Standard field updates
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance 


# Syllabus Version Read Serializer
class SyllabusVersionSerializer(serializers.ModelSerializer):   
    class Meta:
        model = Syllabus
        fields = [
            "id", 
            "status", 
            "version", 
            "chair_submitted_at", 
            "chair_rejected_at", 
            "dean_submitted_at", 
            "dean_rejected_at", 
            "dean_approved_at" 
        ] 
        read_only_fields = ["id", "status", "version"]


# Syllabus List Serializer
class CourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["course_code", "course_title", "course_year_level", "course_semester"]

class BayanihanListGroupSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = BayanihanGroup
        fields = ["id", "school_year", "course"]

class SyllabusListSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanListGroupSerializer(read_only=True)

    class Meta:
        model = Syllabus
        fields = [
            "id",
            "course",
            "bayanihan_group",
            "chair_submitted_at",
            "dean_approved_at",
            "version",
            "status",
        ]
        

# Syllabus Retrieve Serializer
class InstructorDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "prefix", "first_name", "last_name", "suffix", "email", "phone"]
        
class SyllabusInstructorSerializer(serializers.ModelSerializer):
    user = InstructorDetailsSerializer(read_only=True)

    class Meta:
        model = SyllabusInstructor
        fields = ["id", "user"]
        
class DepartmentReadSerializer(serializers.ModelSerializer):   
    class Meta:
        model = Department
        fields = "__all__" 
            
class ProgramReadSerializer(serializers.ModelSerializer):  
    department = DepartmentReadSerializer(read_only=True)
    class Meta:
        model = Program
        fields = "__all__" 

class CurriculumReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curriculum
        fields = "__all__"
              
class CourseReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"
        
class PEOReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PEO
        fields = "__all__"

class ProgramOutcomeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramOutcome
        fields = "__all__"
        
class SyllabusCourseOutcomeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusCourseOutcome
        fields = "__all__"

class SyllCoPoReadSerializer(serializers.ModelSerializer): 
    course_outcome = SyllabusCourseOutcomeReadSerializer(read_only=True)
    program_outcome = ProgramOutcomeReadSerializer(read_only=True)
 
    class Meta:
        model = SyllCoPo
        fields = [
            "id", 
            "course_outcome",
            "program_outcome", 
            "syllabus_co_po_code",
            "created_at",
            "updated_at",
        ]
    
class SyllabusCotCoReadSerializer(serializers.ModelSerializer):
    course_outcome = SyllabusCourseOutcomeReadSerializer(read_only=True)
    
    class Meta:
        model = SyllabusCotCo
        fields = "__all__"
        
class SyllabusCourseOutlineReadSerializer(serializers.ModelSerializer):
    cotcos = SyllabusCotCoReadSerializer(read_only=True, many=True)
    
    class Meta:
        model = SyllabusCourseOutline
        fields = "__all__"
        
class SyllabusDeanFeedbackReadSerializer(serializers.ModelSerializer): 
    user = ProfileSerializer(read_only=True)
    
    class Meta:
        model = SyllabusDeanFeedback
        fields = ["id", "feedback_text", "user", "created_at", "updated_at"] 

# class ReviewFormFieldReadSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ReviewFormField
#         fields = [
#             "id", "label", "field_type", "is_required",
#         ] 

class ReviewFormItemReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewFormItem
        fields = ["id", "type", "text", "order", "syllabus_section"]

class SRFIndicatorReadSerializer(serializers.ModelSerializer): 
    item = ReviewFormItemReadSerializer(read_only=True) 
    
    class Meta:
        model = SRFIndicator
        fields = ["id", "item", "response", "remarks"]

class SRFFieldValueReadSerializer(serializers.ModelSerializer): 
    class Meta:
        model = SRFFieldValue
        fields = ["id", "field", "value"]

class SRFFormReadSerializer(serializers.ModelSerializer):
    checklist_items = SRFIndicatorReadSerializer(source="indicators", many=True, read_only=True) 
    field_values = SRFFieldValueReadSerializer(many=True, read_only=True)

    class Meta:
        model = SRFForm
        fields = [
            "id", "form_template", "syllabus", "user", "effective_date",
            "review_date", "reviewed_by_snapshot", "action",
            "checklist_items", "field_values"
        ]
        
class SyllabusDetailSerializer(serializers.ModelSerializer):
    syllabus_template = SyllabusTemplateSerializer(read_only=True)
    college = CollegeSerializer(read_only=True)
    program = ProgramReadSerializer(read_only=True)
    curriculum = CurriculumReadSerializer(read_only=True)
    course = CourseReadSerializer(read_only=True)
    bayanihan_group = BayanihanGroupSerializer(read_only=True)
    
    instructors = SyllabusInstructorSerializer(many=True, read_only=True)
    
    peos = PEOReadSerializer(many=True, read_only=True)
    program_outcomes = ProgramOutcomeReadSerializer(many=True, read_only=True)
    syllcopos = SyllCoPoReadSerializer(many=True, read_only=True)
    course_outcomes = SyllabusCourseOutcomeReadSerializer(many=True, read_only=True)
    course_outlines = SyllabusCourseOutlineReadSerializer(many=True, read_only=True)
    
    dean_feedback = SyllabusDeanFeedbackReadSerializer(read_only=True) 
    review_form = SRFFormReadSerializer(read_only=True)
    
    is_latest = serializers.SerializerMethodField()
    previous_version = serializers.SerializerMethodField()  # NEW
    
    class Meta:
        model = Syllabus
        fields = "__all__"  

    def get_is_latest(self, obj):
        latest_version = (
            Syllabus.objects.filter(bayanihan_group_id=obj.bayanihan_group_id)
            .order_by("-version")
            .values_list("version", flat=True)
            .first()
        )
        return obj.version == latest_version

    def get_previous_version(self, obj):
        prev_syllabus = (
            Syllabus.objects.filter(
                bayanihan_group=obj.bayanihan_group, version=obj.version - 1
            ).first()
        )
        if not prev_syllabus:
            return None

        # If Returned by Chair → return only review_form
        if prev_syllabus.status == "Returned by Chair":
            review_form_instance = SRFForm.objects.filter(syllabus=prev_syllabus).first()
            return {
                "id": prev_syllabus.pk,
                "version": prev_syllabus.version,
                "status": prev_syllabus.status,
                "review_form": (
                    SRFFormReadSerializer(review_form_instance).data
                    if review_form_instance
                    else None
                ),
            }

        # If Returned by Dean → return only dean_feedback
        if prev_syllabus.status == "Returned by Dean":
            dean_feedback_instance = SyllabusDeanFeedback.objects.filter(syllabus=prev_syllabus).first()
            return {
                "id": prev_syllabus.pk,
                "version": prev_syllabus.version,
                "status": prev_syllabus.status,
                "dean_feedback": (
                    SyllabusDeanFeedbackReadSerializer(dean_feedback_instance).data
                    if dean_feedback_instance
                    else None
                ),
            }

        return None
        

# Syllabus Course Outcome CRUD
class SyllabusCourseOutcomeSerializer(serializers.ModelSerializer): 
    syllabus_id = serializers.PrimaryKeyRelatedField(
        queryset=Syllabus.objects.all(),
        source="syllabus",
        write_only=True
    )
    
    class Meta:
        model = SyllabusCourseOutcome
        fields = [
            "id",
            "co_code",
            "co_description",
            "created_at",
            "updated_at",
            "syllabus_id",  
        ]
        

# Course Outcome <-> Program Outcome Mapping CRUD
class SyllCoPoSerializer(serializers.ModelSerializer):
    syllabus_id = serializers.PrimaryKeyRelatedField(
        queryset=Syllabus.objects.all(),
        source="syllabus",
        write_only=True
    )

    course_outcome = SyllabusCourseOutcomeSerializer(read_only=True)
    program_outcome = ProgramOutcomeReadSerializer(read_only=True)

    course_outcome_id = serializers.PrimaryKeyRelatedField(
        queryset=SyllabusCourseOutcome.objects.all(),
        source="course_outcome",
        write_only=True
    )
    program_outcome_id = serializers.PrimaryKeyRelatedField(
        queryset=ProgramOutcome.objects.all(),
        source="program_outcome",
        write_only=True
    )

    class Meta:
        model = SyllCoPo
        fields = [
            "id",
            "syllabus_id",
            "course_outcome",
            "program_outcome",
            "course_outcome_id",
            "program_outcome_id",
            "syllabus_co_po_code",
            "created_at",
            "updated_at",
        ]
        

# Syllabus Course Outline CRUD
class SyllabusCotCoSerializer(serializers.ModelSerializer):
    course_outcome_id = serializers.PrimaryKeyRelatedField(
        queryset=SyllabusCourseOutcome.objects.all(),
        source="course_outcome"
    )

    class Meta:
        model = SyllabusCotCo
        fields = ["id", "course_outcome_id"]
        
class SyllabusCourseOutlineSerializer(serializers.ModelSerializer): 
    syllabus_id = serializers.PrimaryKeyRelatedField(
        queryset=Syllabus.objects.all(),
        source="syllabus",
        write_only=True
    )
    course_outcomes = SyllabusCotCoSerializer(
        many=True, 
        source="cotcos", 
        required=False
    )
    
    class Meta:
        model = SyllabusCourseOutline
        fields = [
            "id", 
            'course_outcomes',
            "syllabus_id",
            "syllabus_term",
            "row_no",
            "allotted_hour",
            "allotted_time",
            "intended_learning",
            "topics",
            "suggested_readings",
            "learning_activities",
            "assessment_tools",
            "grading_criteria",
            "remarks",
            "created_at",
            "updated_at",
        ]

    def validate_course_outcomes(self, value):
        if not value:
            return value  # Nothing to validate since it's optional

        # Check if the referenced course_outcome exists
        for v in value:
            co = v.get("course_outcome")
            if not co:
                raise serializers.ValidationError("Invalid course outcome reference.")
            if not SyllabusCourseOutcome.objects.filter(id=co.id).exists():
                raise serializers.ValidationError(
                    f"Course outcome with id={co.id} does not exist."
                )

        # Prevent duplicates
        outcome_ids = [v["course_outcome"].id for v in value]
        if len(outcome_ids) != len(set(outcome_ids)):
            raise serializers.ValidationError(
                "Duplicate course outcomes are not allowed for a single outline."
            )

        return value

    def create(self, validated_data):
        cotcos_data = validated_data.pop("cotcos", [])
        
        course_outline = super().create(validated_data)
        
        for cotco_data in cotcos_data:
            SyllabusCotCo.objects.create(
                course_outline=course_outline, 
                **cotco_data
            )
        return course_outline

    def update(self, instance, validated_data):
        cotcos_data = validated_data.pop("cotcos", None)
        
        course_outline = super().update(instance, validated_data)

        if cotcos_data is not None:
            # Clear existing and recreate
            instance.cotcos.all().delete()
            for cotco_data in cotcos_data:
                SyllabusCotCo.objects.create(
                    course_outline=course_outline, 
                    **cotco_data
                )

        return course_outline


# Syllabus Course Requirement Update Serializer
class SyllabusCourseRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = ["id", "course_requirements", "updated_at"]
        read_only_fields = ["id", "updated_at"] 
        
        
# Fetching Approved Syllabi 
class ProgramApprovedReadSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Program
        fields = "__all__"
        
class SyllabusApprovedCOSerializer(serializers.ModelSerializer):  
    class Meta:
        model = SyllabusCourseOutline
        fields = "__all__"
        
class SyllabusApprovedReadSerializer(serializers.ModelSerializer):
    program = ProgramApprovedReadSerializer(read_only=True)
    bayanihan_group = BayanihanListGroupSerializer(read_only=True)
    course_outlines = SyllabusApprovedCOSerializer(read_only=True, many=True)

    class Meta:
        model = Syllabus
        fields = [
            "id", 
            "program",
            "bayanihan_group",
            "course_outlines",
            "chair_submitted_at",
            "dean_approved_at",
            "version",
            "status",
        ]
        
 
class SyllabusCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    section_label = serializers.CharField(source="get_section_display", read_only=True) 
    user = ProfileSerializer(read_only=True)

    class Meta:
        model = SyllabusComment
        fields = [
            "id",
            "syllabus",
            "user",
            "user_name",
            "section",
            "section_label",
            "text",
            "is_resolved",
            "resolved_at",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
        
        
# Syllabus Review Form Template
class ReviewFormItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewFormItem
        fields = ["id", "type", "text", "order", "syllabus_section"]

class ReviewFormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewFormField
        fields = [
            "id", "label", "field_type", "is_required", "prefill_source",
            "position", "display_order", "span_full",
            "row", "column",
        ]

class ReviewFormTemplateSerializer(serializers.ModelSerializer):
    items = ReviewFormItemSerializer(many=True)
    fields = ReviewFormFieldSerializer(many=True) # type: ignore

    class Meta:
        model = ReviewFormTemplate
        fields = [
            "id", "code_no", "title", "revision_no", "effective_date",
            "description", "is_active", "items", "fields"
        ]
        read_only_fields = ["is_active", "revision_no"] 

    # ✅ On create, deactivate old active templates and activate new one
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        fields_data = validated_data.pop("fields", [])

        # Auto-increment revision_no number
        last_template = ReviewFormTemplate.objects.filter(is_active=True).order_by("-revision_no").first()
        next_revision_no = (last_template.revision_no + 1) if last_template else 0
        validated_data["revision_no"] = next_revision_no

        # Deactivate any currently active template
        ReviewFormTemplate.objects.filter(is_active=True).update(is_active=False)

        # Automatically set the new one as active
        validated_data["is_active"] = True
        template = ReviewFormTemplate.objects.create(**validated_data)

        # Add items/fields
        for item_data in items_data:
            ReviewFormItem.objects.create(form_template=template, **item_data)
        for field_data in fields_data:
            ReviewFormField.objects.create(form_template=template, **field_data)

        return template

    def update(self, instance, validated_data):
        # 🚫 Completely disallow updates for historical accuracy
        raise serializers.ValidationError(
            "Review Form Templates cannot be updated to preserve historical accuracy. "
            "Create a new template version instead."
        )


# Syllabus Review Form Values
class SyllabusReadSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Syllabus
        fields = ["id", "chair", "dean_submitted_at", "chair_rejected_at"]
        
class SRFIndicatorSerializer(serializers.ModelSerializer): 
    class Meta:
        model = SRFIndicator
        fields = ["id", "item", "response", "remarks"]

class SRFFieldValueSerializer(serializers.ModelSerializer): 
    class Meta:
        model = SRFFieldValue
        fields = ["id", "field", "value"]

class SRFFormSerializer(serializers.ModelSerializer):
    form_template = ReviewFormTemplateSerializer(read_only=True)
    checklist_items = SRFIndicatorSerializer(source="indicators", many=True, read_only=True) 
    field_values = SRFFieldValueSerializer(many=True, read_only=True)
    syllabus = SyllabusReadSerializer(read_only=True)

    class Meta:
        model = SRFForm
        fields = [
            "id", "form_template", "syllabus", "user", "effective_date",
            "review_date", "reviewed_by_snapshot", "action",
            "checklist_items", "field_values"
        ]        