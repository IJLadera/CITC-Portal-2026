from rest_framework import serializers
from .models import College, Department, Program, Curriculum, Course, PEO, ProgramOutcome, Memo
from users.models import UserRole, User
from django.contrib.auth import get_user_model
from storages.backends.s3boto3 import S3Boto3Storage

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']

    def to_representation(self, instance):
        if not instance:
            return None
        return super().to_representation(instance)

class MemoSerializer(serializers.ModelSerializer): 
    user = UserSerializer(read_only=True)

    recipients = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False, read_only=False
    )
    recipients_detail = UserSerializer(source="recipients", many=True, read_only=True)

    date = serializers.DateField(format="%Y-%m-%d", required=False, allow_null=True) # type: ignore 
    rows = serializers.JSONField(required=False)

    # FILE UPLOAD FROM FRONTEND
    file_url = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Memo
        fields = [
            'id',

            # ✨ NEW FIELDS
            'memo_no',
            'series_year',
            'from_field',
            'to_field',
            'subject',
            'rows',

            # EXISTING FIELDS
            'title',
            'description',
            'file_name',
            'file_url',
            'date',
            'color',

            'user',                # expands full user details
            'recipients',          # allows IDs to be sent from frontend
            'recipients_detail',   # returns full user objects

            'created_at',
            'updated_at',
        ] 

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['recipients'] = list(instance.recipients.values_list('id', flat=True))
        if rep.get("file_name") and not isinstance(rep["file_name"], list):
            rep["file_name"] = [rep["file_name"]]
        return rep
    
    # INTERCEPT create/update TO HANDLE FILE UPLOAD
    def create(self, validated_data):
        uploaded_file = validated_data.pop("file_url", None)
        memo = super().create(validated_data)

        if uploaded_file:
            memo.file_name = uploaded_file
            memo.save()

        return memo

    def update(self, instance, validated_data):
        uploaded_file = validated_data.pop("file_url", None)
        memo = super().update(instance, validated_data)

        if uploaded_file:
            memo.file_name = uploaded_file
            memo.save()

        return memo

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = "__all__" 
        
    def validate(self, attrs):
        code = attrs.get("college_code")
        desc = attrs.get("college_description")

        errors = {} 
        instance = getattr(self, "instance", None)

        if code:
            qs = College.objects.filter(college_code__iexact=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["college_code"] = "This college code already exists."

        if desc:
            qs = College.objects.filter(college_description__iexact=desc)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["college_description"] = "This college description already exists."

        if errors:
            raise serializers.ValidationError(errors)
        
        return attrs


class DepartmentSerializer(serializers.ModelSerializer):
    college = CollegeSerializer(read_only=True)
    
    college_id = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.all(),
        source="college",
        write_only=True, 
        required=False # only Admin will use this
    )
    
    class Meta:
        model = Department
        fields = "__all__"
        extra_kwargs = {
            "department_code": {
                "error_messages": {
                    "unique": "A department with this code already exists. Please use another code."
                }
            }
        } 
        
    def validate(self, attrs):
        code = attrs.get("department_code")
        name = attrs.get("department_name")

        errors = {} 
        instance = getattr(self, "instance", None)

        if code:
            qs = Department.objects.filter(department_code__iexact=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["department_code"] = "A department with this code already exists."

        if name:
            qs = Department.objects.filter(department_name__iexact=name)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["department_name"] = "A department with this name already exists."

        if errors:
            raise serializers.ValidationError(errors)
        
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        role_param = request.query_params.get("role")

        # Admin: respect provided college_id
        if role_param == "ADMIN" and user.has_role("ADMIN"):
            if "college" not in validated_data:
                raise serializers.ValidationError("Admin must provide college_id.")
            return super().create(validated_data)

        # Dean: assign based on entity_id from UserRole
        elif role_param == "DEAN" and user.has_role("DEAN"):
            dean_role = UserRole.objects.filter(
                user=user, role__name="DEAN", entity_type="College"
            ).first()
            if not dean_role or not dean_role.entity_id:
                raise serializers.ValidationError("Dean has no assigned college.")

            validated_data["college_id"] = dean_role.entity_id
            return super().create(validated_data)

        raise serializers.ValidationError("You must specify a valid role to create a department.")
     
     
class ProgramSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="department",
        write_only=True, 
        required=False # only Admin will use this
    )
    
    class Meta:
        model = Program
        fields = "__all__"
        extra_kwargs = {
            "program_code": {
                "error_messages": {
                    "unique": "A program with this code already exists. Please use another code."
                }
            }
        } 
        
    def validate(self, attrs):
        code = attrs.get("program_code")
        name = attrs.get("program_name")

        errors = {} 
        instance = getattr(self, "instance", None)

        if code:
            qs = Program.objects.filter(program_code__iexact=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["program_code"] = "A program with this code already exists."

        if name:
            qs = Program.objects.filter(program_name__iexact=name)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["program_name"] = "A program with this name already exists."

        if errors:
            raise serializers.ValidationError(errors)
        
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        role_param = request.query_params.get("role")

        # Admin: respect provided college_id
        if role_param == "ADMIN" and user.has_role("ADMIN"):
            if "department" not in validated_data:
                raise serializers.ValidationError("Admin must provide department_id.")
            return super().create(validated_data)

        # Dean: assign based on entity_id from UserRole
        elif role_param == "DEAN" and user.has_role("DEAN"):
            dean_role = UserRole.objects.filter(
                user=user, role__name="DEAN", entity_type="College"
            ).first()
            if not dean_role or not dean_role.entity_id:
                raise serializers.ValidationError("Dean has no assigned college.")

            validated_data["college_id"] = dean_role.entity_id
            return super().create(validated_data)

        raise serializers.ValidationError("You must specify a valid role to create a program.")
    
     
class CurriculumSerializer(serializers.ModelSerializer):
    program = ProgramSerializer(read_only=True)
    
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        source="program",
        write_only=True
    )
    
    class Meta:
        model = Curriculum
        fields = "__all__"
        
    def validate(self, attrs):
        code = attrs.get("curr_code")
        instance = getattr(self, "instance", None)

        if code:
            qs = Curriculum.objects.filter(curr_code__iexact=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                raise serializers.ValidationError({"curr_code": "A curriculum with this code already exists."})

        return attrs
        
        
class CourseSerializer(serializers.ModelSerializer):
    curriculum = CurriculumSerializer(read_only=True)
    curriculum_id = serializers.PrimaryKeyRelatedField(
        queryset=Curriculum.objects.all(),
        source="curriculum",
        write_only=True
    )

    class Meta:
        model = Course
        fields = "__all__" 
        
    def validate(self, attrs):
        code = attrs.get("course_code")
        title = attrs.get("course_title")
        instance = getattr(self, "instance", None)

        errors = {}

        if code:
            qs = Course.objects.filter(course_code__iexact=code)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["course_code"] = "A course with this code already exists."

        if title:
            qs = Course.objects.filter(course_title__iexact=title)
            if instance:
                qs = qs.exclude(id=instance.id)
            if qs.exists():
                errors["course_title"] = "A course with this title already exists."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
        
        
class PEOSerializer(serializers.ModelSerializer):
    class Meta:
        model = PEO
        fields = "__all__"


class ProgramOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramOutcome
        fields = "__all__"