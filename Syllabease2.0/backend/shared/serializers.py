from os import read
from rest_framework import serializers

from tos.models import TOS
from syllabi.models import Syllabus
from academics.models import College, Department, Program 
from .models import Deadline, Report, TOSReport

from academics.serializers import CollegeSerializer, ProgramSerializer
from bayanihan.serializers import BayanihanGroupReadSerializer
from syllabi.serializers import SyllabusDetailSerializer
from users.serializers import UserSerializer 

class DeadlineSerializer(serializers.ModelSerializer): 
    college = CollegeSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    status = serializers.SerializerMethodField()
    
    college_id = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.all(),
        source="college",
        write_only=True, 
    )
    
    class Meta:
        model = Deadline
        fields = [
            "id",
            "school_year",
            "semester",
            "syll_deadline",
            "tos_midterm_deadline",
            "tos_final_deadline",
            "college",
            "user",
            "college_id", 
            "created_at",
            "updated_at",
            "syll_status",              
            "tos_midterm_status",       
            "tos_final_status",
            "status",  # ✅ Include this field here
        ]
        read_only_fields = ["created_at", "updated_at"]
        
    def validate(self, attrs):
        college = attrs.get("college")
        school_year = attrs.get("school_year")
        semester = attrs.get("semester")
        instance = getattr(self, "instance", None)

        syll = attrs.get("syll_deadline") or (instance.syll_deadline if instance else None)
        mid = attrs.get("tos_midterm_deadline") or (instance.tos_midterm_deadline if instance else None)
        fin = attrs.get("tos_final_deadline") or (instance.tos_final_deadline if instance else None)

        # ---------------------------------------------
        # 🔍 1. Prevent Duplicate Deadlines
        # ---------------------------------------------
        if college and school_year and semester:
            qs = Deadline.objects.filter(
                college=college,
                school_year=school_year,
                semester=semester,
            )

            # Exclude the current record when updating
            if instance:
                qs = qs.exclude(id=instance.id)

            if qs.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [
                        "A deadline for this college, school year, and semester already exists."
                    ]
                })

        # ---------------------------------------------
        # 🔍 2. Date Logic Validation
        # ---------------------------------------------
        errors = {}

        # A. Midterm must be >= Syllabus
        if syll and mid and mid < syll:
            errors["tos_midterm_deadline"] = "TOS Midterm deadline cannot be earlier than the Syllabus deadline."

        # B. Final must be >= Syllabus
        if syll and fin and fin < syll:
            errors["tos_final_deadline"] = "TOS Final deadline cannot be earlier than the Syllabus deadline."

        # C. Final must be >= Midterm
        if mid and fin and fin < mid:
            errors["tos_final_deadline"] = "TOS Final deadline cannot be earlier than the TOS Midterm deadline."

        # D. Syllabus cannot be > Midterm or Final
        if syll and mid and syll > mid:
            errors["syll_deadline"] = "Syllabus deadline cannot be later than TOS Midterm deadline."

        if syll and fin and syll > fin:
            errors["syll_deadline"] = "Syllabus deadline cannot be later than TOS Final deadline."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
    
    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("user", None)
        return super().update(instance, validated_data)
    
    def get_status(self, obj):
        if obj.syll_status == "INACTIVE" and obj.tos_midterm_status == "INACTIVE" and obj.tos_final_status == "INACTIVE":
            return "INACTIVE"
        return "ACTIVE"
   
 
# Syllabus Reports Serializers    
class CollegeReadSerializer(serializers.ModelSerializer):   
    class Meta:
        model = College
        fields = "__all__"
        
class SyllabusReadSerializer(serializers.ModelSerializer):  
    college = CollegeReadSerializer(read_only=True)
    class Meta:
        model = Syllabus
        fields = "__all__"
        
class ReportSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanGroupReadSerializer(read_only=True)
    syllabus = SyllabusReadSerializer(read_only=True)
    all_versions = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = "__all__"

    def get_all_versions(self, obj):
        # ❌ Do NOT load versions if listing
        if not self.context.get("include_versions", False):
            return None   # or return []

        # Load all versions only during retrieve
        versions = (
            Report.objects
            .filter(bayanihan_group=obj.bayanihan_group)
            .order_by("-version")
        )
        return ReportVersionsSerializer(versions, many=True).data
        
class ReportVersionsSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanGroupReadSerializer(read_only=True)
    syllabus = SyllabusReadSerializer(read_only=True) 
    
    class Meta:
        model = Report
        fields = "__all__"
        

# TOS Reports Serializer    
class DepartmentReadSerializer(serializers.ModelSerializer):  
    college = CollegeReadSerializer(read_only=True)
    
    class Meta:
        model = Department
        fields = "__all__"
        
class ProgramReadSerializer(serializers.ModelSerializer):  
    department = DepartmentReadSerializer(read_only=True)
    
    class Meta:
        model = Program
        fields = "__all__"
        
class TOSReadSerializer(serializers.ModelSerializer):  
    program = ProgramReadSerializer(read_only=True)
    
    class Meta:
        model = TOS
        fields = "__all__"
        
class TOSReportSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanGroupReadSerializer(read_only=True)
    tos = TOSReadSerializer(read_only=True)
    all_versions = serializers.SerializerMethodField()
    
    class Meta:
        model = TOSReport
        fields = "__all__"

    def get_all_versions(self, obj):
        # ❌ Do NOT load versions if listing
        if not self.context.get("include_versions", False):
            return None   # or return []

        # Load all versions only during retrieve
        versions = (
            TOSReport.objects
            .filter(bayanihan_group=obj.bayanihan_group)
            .filter(tos__term=obj.tos.term)
            .order_by("-version")
        )
        return TOSReportVersionsSerializer(versions, many=True).data

class TOSReportVersionsSerializer(serializers.ModelSerializer):
    bayanihan_group = BayanihanGroupReadSerializer(read_only=True)
    tos = TOSReadSerializer(read_only=True) 
    
    class Meta:
        model = TOSReport
        fields = "__all__"