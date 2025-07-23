from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.settings import api_settings
from djoser.serializers import UserCreateSerializer, UserSerializer
from .models import Role
from app.lms.models import Department, Section
from app.unieventify.models import tblstudentOrg
from app.unieventify.serializers import tbldepartmentSerializer, tblstudentOrgSerializer
from djoser.serializers import SendEmailResetSerializer as BaseSendEmailResetSerializer
from djoser.serializers import PasswordResetConfirmSerializer
from djoser.conf import settings

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class CreateUserSerializer(UserCreateSerializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    confirm = serializers.CharField(write_only=True),
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = tuple(User.REQUIRED_FIELDS) + (
            "first_name",
            "last_name",
            "middle_name",
            "suffix",
            "id_number",
            settings.LOGIN_FIELD,
            settings.USER_ID_FIELD,
            "password",
            "confirm",
            "avatar",
            "is_student",
            "is_employee",
            "is_develop",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "department",
            "section",
            "organization"
        )

    def validate(self, attrs):
        password = attrs.get("password")
        confirm = attrs.get("confirm", '')
        attrs.pop('confirm')
        
        user = User(**attrs)
        
        try:
            if password == confirm:
                validate_password(password, user)
            else:
                raise serializers.ValidationError(
                    {'password' : 'confirmation password did not match'}
                ) 
        except django_exceptions.ValidationError as e:
            serializer_error = serializers.as_serializer_error(e)
            raise serializers.ValidationError(
                {"password": serializer_error[api_settings.NON_FIELD_ERRORS_KEY]}
            )

        return attrs

    def perform_create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)
            if settings.SEND_ACTIVATION_EMAIL:
                user.is_active = False
                user.save(update_fields=["is_active"])
        return user


class CustomUserSerializer(UserSerializer):
    organization = tblstudentOrgSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    department = tbldepartmentSerializer(read_only=True)

    class Meta:
        model = User
        fields = tuple(User.REQUIRED_FIELDS) + (
            settings.USER_ID_FIELD,
            settings.LOGIN_FIELD,
            'first_name',
            'last_name',
            'middle_name',
            'suffix',
            'id_number',
            'avatar',
            'is_student',
            'is_employee',
            'is_develop',
            'is_active',
            'is_staff',
            'is_superuser',
            'roles',
            'date_joined',
            'department',
            'section',
            'organization',
            'is_bayanihan_leader',

        )
        read_only_fields = (settings.LOGIN_FIELD,'first_name', 'last_name', 'id_number', 'avatar', 'is_student', 'is_employee', 'is_develop', 'is_active', 'is_staff', 'is_superuser', 'roles', 'date_joined', 'department', 'section', 'organization')

    def get_roles(self, obj):
        roles = obj.roles.all().order_by("rank")  # Order by rank
        
        return RoleSerializer(roles, many=True).data

class StudentSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get('password') == '':
            raise serializers.ValidationError('Password must not be empty')
        return attrs

    def validate_email(self, value):
        return value

    class Meta:
        fields = ['first_name', 'last_name', 'email', 'id_number', 'password']
        model = User
        validators = []

class UpdateUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False)
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), allow_null=True, required=False)
    organization = serializers.PrimaryKeyRelatedField(queryset=tblstudentOrg.objects.all(), allow_null=True, required=False)
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True, required=False)
    
    class Meta:
        model = User
        fields = (
            'id_number', 'first_name', 'last_name', 'email', 'avatar', 'middle_name', 'suffix',
            'department', 'section', 'organization', 'roles', 'is_staff', 'is_active'
        )

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(uuid=self.instance.uuid).filter(email=value).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})
        return value

    def validate_id_number(self, value):
        if User.objects.exclude(uuid=self.instance.uuid).filter(id_number=value).exists():
            raise serializers.ValidationError({"id_number": "This ID number is already in use."})
        return value

    def update(self, instance, validated_data):
        user = self.context['request'].user

        # Check if user has permission to update
        if not user.is_staff and not user.can_override(instance):
            raise serializers.ValidationError({"authorize": "You don't have permission to update this user."})

        # Update user fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.id_number = validated_data.get('id_number', instance.id_number)
        instance.middle_name = validated_data.get('middle_name', instance.middle_name)
        instance.suffix = validated_data.get('suffix', instance.suffix)
        
        # Directly assign IDs to related fields
        instance.department_id = validated_data.get('department', instance.department_id)
        instance.section_id = validated_data.get('section', instance.section_id)
        instance.organization_id = validated_data.get('organization', instance.organization_id)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.is_active = validated_data.get('is_active', instance.is_active)

        # Handle avatar upload
        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']

        # Handle roles update
        if 'roles' in validated_data:
            instance.roles.set(validated_data['roles'])

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance

class SendEmailResetSerializer(BaseSendEmailResetSerializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            pass
        return value
    
    def get_user(self, is_active=True):
        try:
            user = User.objects.get(
                email=self.data.get('email', ''),
                is_active=is_active,
            )
            if user.has_usable_password():
                    return user
        except User.DoesNotExist:
            pass

        return None


class PasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    re_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['re_new_password']:
            raise serializers.ValidationError("Password don't match")

        password = attrs['new_password']
        if not any(char.isdigit() for char in password):
            raise serializers.ValidationError("Password must contain at least one")
        if not any(char.isupper() for char in password):
            raise serializers.ValidationError("Password must contain at least one uppercase letter")

        return super().validate(attrs)
