from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.settings import api_settings
from djoser.serializers import UserCreateSerializer, UserSerializer
from djoser.conf import settings

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
            settings.LOGIN_FIELD,
            settings.USER_ID_FIELD,
            "password",
            "confirm",
            "avatar"
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
    class Meta:
        model = User
        fields = tuple(User.REQUIRED_FIELDS) + (
            settings.USER_ID_FIELD,
            settings.LOGIN_FIELD,
            'first_name',
            'last_name',
            'id_number',
            'avatar',
            'is_student'
        )
        read_only_fields = (settings.LOGIN_FIELD,'first_name', 'last_name', 'id_number', 'avatar', 'is_student')


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