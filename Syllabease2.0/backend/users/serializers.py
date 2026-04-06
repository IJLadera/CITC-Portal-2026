from django.forms import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate

from utils.space import upload_to_spaces
from .models import User, Role, UserRole
from academics.models import Department, College
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from datetime import datetime


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]

class UserRoleSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = UserRole
        fields = ["id", "role", "entity_type", "entity_id", "start_validity", "end_validity"]

class UserSerializer(serializers.ModelSerializer):
    user_roles = UserRoleSerializer(many=True, read_only=True) 
    signature_url = serializers.SerializerMethodField() 
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    department_code = serializers.SerializerMethodField()
    college_code = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "faculty_id", "username", "email", "first_name", "last_name",
            "prefix", "suffix", "phone", "signature", "email_verified_at",
            "signature_url", "user_roles", "password", "role_ids", "department_code", "college_code"
        ]

    def get_department_code(self, obj):
        chair_role = obj.user_roles.filter(role__name="CHAIRPERSON").first()
        if chair_role:
            dept = Department.objects.filter(id=chair_role.entity_id).first()
            return dept.department_code if dept else None
        return None

    def get_college_code(self, obj):
        dean_role = obj.user_roles.filter(role__name="DEAN").first()
        if dean_role:
            col = College.objects.filter(id=dean_role.entity_id).first()
            return col.college_code if col else None
        return None

    def get_signature_url(self, obj):
        request = self.context.get("request")
        if obj.signature:
            return request.build_absolute_uri(obj.signature.url) if request else obj.signature.url
        return None
      
    def validate(self, attrs):
        request = self.context.get("request")
        is_update = self.instance is not None

        username = attrs.get("username", None)
        email = attrs.get("email", None)
 
        # 🔹 UNIQUE USERNAME CHECK 
        if username:
            qs = User.objects.filter(username=username)
            if is_update:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise ValidationError({"username": "This username is already taken."})
 
        # 🔹 UNIQUE EMAIL CHECK 
        if email:
            qs = User.objects.filter(email=email)
            if is_update:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise ValidationError({"email": "This email is already registered."})

        return attrs

    def create(self, validated_data): 
        password = validated_data.pop("password", None)
        role_ids = validated_data.pop("role_ids", [])

        # ✅ Ensure password is hashed
        if password:
            validated_data["password"] = make_password(password)

        user = User.objects.create(**validated_data) 

        # ✅ Assign roles on creation
        for rid in role_ids:
            UserRole.objects.get_or_create(user=user, role_id=rid)

        return user

    def update(self, instance, validated_data): 
        role_ids = validated_data.pop("role_ids", None)
        password = validated_data.pop("password", None)

        # ✅ Hash password only if provided
        if password:
            validated_data["password"] = make_password(password)  
                
        user = super().update(instance, validated_data)

        if role_ids is not None:
            existing_role_ids = set(
                UserRole.objects.filter(user=user).values_list("role_id", flat=True)
            )

            new_role_ids = set(role_ids)

            # ✅ Roles to remove (no longer in role_ids)
            roles_to_remove = existing_role_ids - new_role_ids
            if roles_to_remove:
                UserRole.objects.filter(user=user, role_id__in=roles_to_remove).delete()

            # ✅ Roles to add (new ones not already existing)
            roles_to_add = new_role_ids - existing_role_ids
            for rid in roles_to_add:
                UserRole.objects.create(user=user, role_id=rid)

        return user
    
    
class FacultyIDTokenObtainPairSerializer(TokenObtainPairSerializer):
    faculty_id = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        faculty_id = attrs.get("faculty_id")
        password = attrs.get("password")     
 
        user = None
        try:
            user_obj = User.objects.get(faculty_id=faculty_id)
        except User.DoesNotExist: 
            user_obj = None

        if user_obj: 
            user = authenticate(
                request=self.context.get("request"),
                faculty_id=user_obj.faculty_id,
                password=password,
            )

        if not user:
            raise serializers.ValidationError("Invalid Faculty ID or password.")

        refresh = self.get_token(user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user, context=self.context).data,
        }
        return data


class ProfileSerializer(serializers.ModelSerializer):
    signature_file = serializers.ImageField(write_only=True, required=False)
    user_roles = UserRoleSerializer(many=True, read_only=True) 

    class Meta:
        model = User
        fields = [
            "id", 'faculty_id', "username", "first_name", "last_name", "prefix", "suffix",
            "email", "phone", "signature", "signature_file", "user_roles"
        ]
        read_only_fields = ["email", "signature", "user_roles"]

    def update(self, instance, validated_data):
        signature_file = validated_data.pop("signature_file", None)
        if signature_file: 
            instance.signature = signature_file 

        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "faculty_id", "username", "first_name", "last_name",
            "email", "password", "prefix", "suffix", "phone"
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.password = make_password(password)
        user.save()

        # assign Bayanihan Teacher role by default
        role, _ = Role.objects.get_or_create(name="BAYANIHAN_TEACHER")
        UserRole.objects.create(user=user, role=role)

        return user


class AdminUserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = [
            "id", "user", "role", "entity_type",
            "entity_id", "start_validity", "end_validity"
        ]
        

# For Assigning a Chairperson or Dean
class AssignRoleGenericSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True, 
        help_text="Chairperson or Dean User ID"
    )

    role_name = serializers.ChoiceField(
        choices=[
            ("CHAIRPERSON", "Chairperson"),
            ("DEAN", "Dean"),
            ("BAYANIHAN_LEADER", "Bayanihan Leader"),
            ("BAYANIHAN_TEACHER", "Bayanihan Teacher"),
            ("AUDITOR", "Auditor")
        ],
        write_only=True,
        help_text="Role to assign"
    )

    entity_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Department ID for Chairperson, College ID for Dean"
    )

    class Meta:
        model = UserRole
        fields = ["id", "user_id", "role_name", "entity_id", "start_validity", "end_validity"]

    def validate(self, data):
        user = data.get("user_id")
        role_name = data.get("role_name")
        entity_id = data.get("entity_id")

        # Only Chairperson or Dean require an entity_id
        if role_name in ["CHAIRPERSON", "DEAN"] and not entity_id:
            raise serializers.ValidationError(f"{role_name} assignment requires an entity_id.")

        # Determine entity type for existing checks
        entity_type = None
        if role_name == "CHAIRPERSON":
            entity_type = "Department"
        elif role_name == "DEAN":
            entity_type = "College"

        instance = getattr(self, "instance", None)

        # Check if the user already has this role (for roles with entity_type)
        if entity_type:
            existing_user_role = UserRole.objects.filter(
                user=user,
                role__name=role_name,
                entity_type=entity_type,
                entity_id__isnull=False
            ).exclude(id=getattr(instance, "id", None)).first()
            
            if existing_user_role:
                raise serializers.ValidationError(
                    f"The user '{user.first_name} {user.last_name}' already has a {role_name} role assigned."
                )

            existing_entity_role = UserRole.objects.filter(
                role__name=role_name,
                entity_type=entity_type,
                entity_id=entity_id
            ).exclude(id=getattr(instance, "id", None)).first()
            
            if existing_entity_role:
                raise serializers.ValidationError(
                    f"This {role_name} role is already assigned to another user for this {entity_type.lower()}."
                )

        return data

    def create(self, validated_data):
        user = validated_data.pop("user_id")
        role_name = validated_data.pop("role_name")
        entity_id = validated_data.pop("entity_id", None)

        role, _ = Role.objects.get_or_create(name=role_name)
        
        # Avoid duplicates for all roles
        existing = UserRole.objects.filter(user=user, role=role)
        if existing.exists():
            return existing.first()

        if role_name == "CHAIRPERSON":
            entity_type = "Department"
        elif role_name == "DEAN":
            entity_type = "College"
        else:
            entity_type = None
            entity_id = None  # ensure no entity is stored for other roles

        return UserRole.objects.create(
            user=user,
            role=role,
            entity_type=entity_type,
            entity_id=entity_id,
            **validated_data
        )

    def update(self, instance, validated_data):
        user = validated_data.pop("user_id", instance.user)
        role_name = validated_data.pop("role_name", instance.role.name)
        entity_id = validated_data.pop("entity_id", instance.entity_id)

        role, _ = Role.objects.get_or_create(name=role_name)
        if role_name == "CHAIRPERSON":
            entity_type = "Department"
        elif role_name == "DEAN":
            entity_type = "College"
        else:
            entity_type = None
            entity_id = None

        instance.user = user
        instance.role = role
        instance.entity_type = entity_type
        instance.entity_id = entity_id
        instance.start_validity = validated_data.get("start_validity", instance.start_validity)
        instance.end_validity = validated_data.get("end_validity", instance.end_validity)
        instance.save()
        return instance

# For fetching assigned Chairpersons and Deans
class AssignedRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    entity_name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = [
            "id", "role", "user", "entity_type", "entity_id",
            "start_validity", "end_validity", "entity_name"
        ]

    def get_entity_name(self, obj):
        if obj.entity_type == "Department" and obj.role.name == "CHAIRPERSON":
            dept = Department.objects.filter(id=obj.entity_id).first()
            return dept.department_code if dept else None
        elif obj.entity_type == "College" and obj.role.name == "DEAN":
            col = College.objects.filter(id=obj.entity_id).first()
            return col.college_code if col else None
        return None
