from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.settings import api_settings
from djoser.serializers import UserCreateSerializer, UserSerializer
from djoser.conf import settings
from app.unieventify.serializers import tbldepartmentSerializer, tblSectionSerializer, tblstudentOrgSerializer
from app.unieventify.models import tblUserRole, tbldepartment, tblSection, tblstudentOrg

User = get_user_model()

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
            "roles",
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
    department = tbldepartmentSerializer(read_only=True)
    section = tblSectionSerializer(read_only=True)
    organization = tblstudentOrgSerializer(read_only=True)

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
            'organization'

        )
        read_only_fields = (settings.LOGIN_FIELD,'first_name', 'last_name', 'id_number', 'avatar', 'is_student', 'is_employee', 'is_develop', 'is_active', 'is_staff', 'is_superuser', 'roles', 'date_joined', 'department', 'section', 'organization')


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

    role = serializers.PrimaryKeyRelatedField(queryset=tblUserRole.objects.all(), allow_null=True, required=False)
    department = serializers.PrimaryKeyRelatedField(queryset=tbldepartment.objects.all(), allow_null=True, required=False)
    section = serializers.PrimaryKeyRelatedField(queryset=tblSection.objects.all(), allow_null=True, required=False)
    organization = serializers.PrimaryKeyRelatedField(queryset=tblstudentOrg.objects.all(), allow_null=True, required=False)

    class Meta:
        model = User
        fields = (
            'idNumber', 'first_name', 'last_name', 'email', 'image', 'middle_name',
            'role', 'department', 'section', 'organization', 'is_staff', 'is_active'
        )

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})
        return value

    def validate_idNumber(self, value):
        if User.objects.exclude(pk=self.instance.pk).filter(idNumber=value).exists():
            raise serializers.ValidationError({"idNumber": "This idNumber is already in use."})
        return value

    def update(self, instance, validated_data):
        user = self.context['request'].user

        # Allow update if the current user is an admin or the owner of the profile
        if not user.is_staff and user.pk != instance.pk:
            raise serializers.ValidationError({"authorize": "You don't have permission for this user."})

        # Update user fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.idNumber = validated_data.get('idNumber', instance.idNumber)
        instance.middle_name = validated_data.get('middle_name', instance.middle_name)

        # Directly assign IDs to related fields
        instance.role_id = validated_data.get('role', instance.role_id)
        instance.department_id = validated_data.get('department', instance.department_id)
        instance.section_id = validated_data.get('section', instance.section_id)
        instance.organization_id = validated_data.get('organization', instance.organization_id)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.is_active = validated_data.get('is_active', instance.is_active)

        # Handle image upload
        if 'image' in validated_data:
            instance.image = validated_data['image']

        instance.save()

        return instance


class ChangePasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    old_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('old_password', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError({"old_password": "Old password is not correct"})
        return value

    def update(self, instance, validated_data):

        instance.set_password(validated_data['password'])
        instance.save()

        return instance
