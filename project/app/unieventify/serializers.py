from django.contrib.auth import get_user_model
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.core.validators import RegexValidator
from rest_framework.settings import api_settings
from djoser.conf import settings
from .models import (
    tblUserRole, tblcollege, tbldepartment, 
    tblstudentOrg, tblSection, tblEventType, tblEventCategory, 
    tblVenue, tblSetup, tblStatus, tblEvent, tblEventLog, tblYearLevel,
    tblEventSchoolYearAndSemester, tblSchoolYear, tblSemester, tblEventRemarks)
from django.core.exceptions import ValidationError
from auditlog.models import LogEntry
from users.models import User
from users.serializers import CustomUserSerializer


class tblUserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblUserRole
        fields = '__all__'
    
class tblcollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblcollege
        fields = '__all__'

class tblYearLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblYearLevel
        fields = '__all__'

class tbldepartmentSerializer(serializers.ModelSerializer):
    # collegeName = tblcollegeSerializer(read_only=True)

    class Meta:
        model = tbldepartment
        fields = ['id', 'departmentName', 'collegeName']

    def get_collegeId(self, obj):
        return obj.collegeName.id if obj.collegeName else None

class tblSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblSection
        fields = '__all__'

class tblstudentOrgSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblstudentOrg
        fields = '__all__'

class tblSetupSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblSetup
        fields = '__all__'

class tblVenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblVenue
        fields = '__all__'

class tblStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblStatus
        fields = '__all__'

# class CustomUserSerializer(UserSerializer):
#     role = tblUserRoleSerializer(read_only=True)
#     department = tbldepartmentSerializer(read_only=True)
#     section = tblSectionSerializer(read_only=True)
#     organization = tblstudentOrgSerializer(read_only=True)

#     class Meta:
#         model = User
#         fields = tuple(User.REQUIRED_FIELDS) + (
#             settings.USER_ID_FIELD,
#             settings.LOGIN_FIELD,
#             'first_name',
#             'last_name',
#             'middle_name',
#             'idNumber',
#             'role',
#             'department',
#             'section',
#             'organization',
#             'image',
#             'is_staff',
#             'is_active'
#         )
#         read_only_fields = (settings.USER_ID_FIELD, settings.LOGIN_FIELD, 'first_name', 'last_name','middle_name',
#             'idNumber',
#             'role',
#             'department',
#             'section',
#             'organization',
#             'image', 'is_staff'
#             )


# class CustomUserCreateSerializer(UserCreateSerializer):
#     confirm_password = serializers.CharField(max_length=255, write_only=True)
    
#     class Meta:
#         model = User
#         fields = ['first_name', 'last_name','middle_name',
#             'idNumber',
#             'role',
#             'department',
#             'section',
#             'organization', 'email', 'password', 'confirm_password']

#     def validate(self, attrs):
#         confirm_password = attrs.get('confirm_password')
#         attrs.pop('confirm_password')
#         user = User(**attrs)
#         password = attrs.get("password")

#         if confirm_password != password:
#             raise serializers.ValidationError({'password': 'Passwords do not match'})

#         try:
#             validate_password(password, user)
#         except django_exceptions.ValidationError as e:
#             serializer_error = serializers.as_serializer_error(e)
#             raise serializers.ValidationError(
#                 {"password": serializer_error[api_settings.NON_FIELD_ERRORS_KEY]}
#             )
        
#          # Validate if idNumber is unique
#         if User.objects.filter(idNumber=attrs.get('idNumber')).exists():
#             raise serializers.ValidationError({'idNumber': 'This ID number already exists.'})

#         return attrs

#     def validate_password(self, value):
#         regex_pattern = r'^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{":;\'])(?=.*[a-zA-Z]).{8,}$'

#         validator = RegexValidator(
#             regex=regex_pattern,
#             message="Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one digit, and one special character.",
#             code="invalid_password"
#         )

#         validator(value)

#         return value
    
# class UpdateUserSerializer(serializers.ModelSerializer):
#     email = serializers.EmailField(required=True)

#     role = serializers.PrimaryKeyRelatedField(queryset=tblUserRole.objects.all(), allow_null=True, required=False)
#     department = serializers.PrimaryKeyRelatedField(queryset=tbldepartment.objects.all(), allow_null=True, required=False)
#     section = serializers.PrimaryKeyRelatedField(queryset=tblSection.objects.all(), allow_null=True, required=False)
#     organization = serializers.PrimaryKeyRelatedField(queryset=tblstudentOrg.objects.all(), allow_null=True, required=False)

#     class Meta:
#         model = User
#         fields = (
#             'idNumber', 'first_name', 'last_name', 'email', 'image', 'middle_name',
#             'role', 'department', 'section', 'organization', 'is_staff', 'is_active'
#         )

#     def validate_email(self, value):
#         user = self.context['request'].user
#         if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
#             raise serializers.ValidationError({"email": "This email is already in use."})
#         return value

#     def validate_idNumber(self, value):
#         if User.objects.exclude(pk=self.instance.pk).filter(idNumber=value).exists():
#             raise serializers.ValidationError({"idNumber": "This idNumber is already in use."})
#         return value

#     def update(self, instance, validated_data):
#         user = self.context['request'].user

#         # Allow update if the current user is an admin or the owner of the profile
#         if not user.is_staff and user.pk != instance.pk:
#             raise serializers.ValidationError({"authorize": "You don't have permission for this user."})

#         # Update user fields
#         instance.first_name = validated_data.get('first_name', instance.first_name)
#         instance.last_name = validated_data.get('last_name', instance.last_name)
#         instance.email = validated_data.get('email', instance.email)
#         instance.idNumber = validated_data.get('idNumber', instance.idNumber)
#         instance.middle_name = validated_data.get('middle_name', instance.middle_name)

#         # Directly assign IDs to related fields
#         instance.role_id = validated_data.get('role', instance.role_id)
#         instance.department_id = validated_data.get('department', instance.department_id)
#         instance.section_id = validated_data.get('section', instance.section_id)
#         instance.organization_id = validated_data.get('organization', instance.organization_id)
#         instance.is_staff = validated_data.get('is_staff', instance.is_staff)
#         instance.is_active = validated_data.get('is_active', instance.is_active)

#         # Handle image upload
#         if 'image' in validated_data:
#             instance.image = validated_data['image']

#         instance.save()

#         return instance


# class ChangePasswordSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     password2 = serializers.CharField(write_only=True, required=True)
#     old_password = serializers.CharField(write_only=True, required=True)

#     class Meta:
#         model = User
#         fields = ('old_password', 'password', 'password2')

#     def validate(self, attrs):
#         if attrs['password'] != attrs['password2']:
#             raise serializers.ValidationError({"password": "Password fields didn't match."})

#         return attrs

#     def validate_old_password(self, value):
#         user = self.context['request'].user
#         if not user.check_password(value):
#             raise serializers.ValidationError({"old_password": "Old password is not correct"})
#         return value

#     def update(self, instance, validated_data):

#         instance.set_password(validated_data['password'])
#         instance.save()

#         return instance


class CreatedBySerializer(serializers.ModelSerializer):
    role = tblUserRoleSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'idNumber','email', 'first_name', 'last_name', 'role', 'department']  # Include any other fields you need

class tblEventSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True, is_staff=False),
        many=True
    )

    created_by = CreatedBySerializer(read_only=True)

    eventCategory = serializers.PrimaryKeyRelatedField(queryset=tblEventCategory.objects.all(), allow_null=True, required=False)

    eventType = serializers.PrimaryKeyRelatedField(queryset=tblEventType.objects.all(), allow_null=True, required=False)

    status = serializers.PrimaryKeyRelatedField(queryset=tblStatus.objects.all(), allow_null=True, required=False)

    venue = serializers.PrimaryKeyRelatedField(queryset=tblVenue.objects.all(), allow_null=True, required=False)

    setup = serializers.PrimaryKeyRelatedField(queryset=tblSetup.objects.all(), allow_null=True, required=False)

    department = serializers.PrimaryKeyRelatedField(queryset=tbldepartment.objects.all(), allow_null=True, required=False, many=True)

    class Meta:
        model = tblEvent
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['participants'] = CustomUserSerializer(instance.participants.all(), many=True).data

        eventType = instance.eventType
        if eventType:
            eventType_representation = {
                'id': eventType.id,
                'eventTypeName': eventType.eventTypeName
            }
        else:
            eventType_representation = ""

        eventCategory = instance.eventCategory
        if eventCategory:
            eventCategory_representation = {
                'id': eventCategory.id,
                'eventCategoryName': eventCategory.eventCategoryName
            }
        else:
            eventCategory_representation = ""

        status = instance.status
        if status:
            status_representation = {
                'id': status.id,
                'statusName': status.statusName
            }
        else:
            status_representation = ""

        venue = instance.venue
        if (venue):
            venue_representation = {
                'id': venue.id,
                'venueName': venue.venueName,
                'location': venue.location
            }
        else:
            venue_representation = ""

        setup = instance.setup
        if setup:
            setup_representation = {
                'id': setup.id,
                'setupName': setup.setupName
            }
        else:
            setup_representation = ""

        departments = instance.department.all()
        department_representation = tbldepartmentSerializer(departments, many=True).data
        
        representation['eventType'] = eventType_representation
        representation['eventCategory'] = eventCategory_representation
        representation['status'] = status_representation
        representation['venue'] = venue_representation
        representation['setup'] = setup_representation
        representation['department'] = department_representation

        return representation

    
    def create(self, validated_data):
        request = self.context.get('request')
        participants = validated_data.pop('participants', [])
        departments = validated_data.pop('department', [])
        validated_data['created_by'] = request.user

        event = tblEvent.objects.create(**validated_data)
        event.participants.set(participants)
        event.department.set(departments)
        return event

    
class tblEventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblEventType
        fields = '__all__'

class tblEventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = tblEventCategory
        fields = '__all__'

class tblEventLogSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    event = serializers.PrimaryKeyRelatedField(queryset=tblEvent.objects.all())

    class Meta:
        model = tblEventLog
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Fetch related user instance
        user = instance.user
        
        # Customize the user representation
        user_representation = {
            'id': user.id,
            'idNumber': user.idNumber,
            'email': user.email,
            # Add any other fields you want to include
        }

        # Fetch related event instance
        event = instance.event
        created_by_department = event.created_by.department
        
        # Serialize department if available
        created_by_department_representation = None
        if created_by_department:
            created_by_department_representation = {
                'id': created_by_department.id,
                'departmentName': created_by_department.departmentName,
                # Add any other department fields if necessary
            }

        # Customize the event representation
        event_representation = {
            'id': event.id,
            'eventName': event.eventName,
            'eventCategoryName': event.eventCategory.eventCategoryName,
            'eventDescription': event.eventDescription,
            'startDateTime': event.startDateTime,
            'endDateTime': event.endDateTime,
            'status': event.status.statusName if event.status else None,
            'created_by_designation': event.created_by.role.designation,
            'created_by_department': created_by_department_representation,
        }
        
        # Replace the user field with the customized representation
        representation['user'] = user_representation
        representation['event'] = event_representation

        return representation

class CollegeSerializer(serializers.ModelSerializer):
    departments = tbldepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = tblcollege
        fields = ['id', 'collegeName', 'departments']

# designation count
class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    
class DesignationCountSerializer(serializers.Serializer):
    designation = serializers.CharField()
    count = serializers.IntegerField()
    users = UserSerializer(many=True)  # Add a nested list of users

class FacultyEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'middle_name', 'idNumber', 'department', 'participated_events', 'created_events']

class UserEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'middle_name', 'idNumber', 'department', 'participated_events', 'created_events']

class AllRoleEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')
    role = tblUserRoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'middle_name', 'idNumber', 'role', 'department', 'participated_events', 'created_events']

class SchoolYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = tblSchoolYear
        fields = '__all__'

class SemesterSerializer(serializers.ModelSerializer):
    schoolYear = SchoolYearSerializer(read_only=True)

    class Meta:
        model = tblSemester
        fields = '__all__'

class SchoolYearAndSemesterEvent(serializers.ModelSerializer):
    semester = serializers.PrimaryKeyRelatedField(queryset=tblSemester.objects.all(), allow_null=True, required=False)
    events = serializers.PrimaryKeyRelatedField(queryset=tblEvent.objects.all(), allow_null=True, required=False, many=True)  # Allow multiple events

    class Meta:
        model = tblEventSchoolYearAndSemester
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Customize semester representation
        semester = instance.semester
        if semester:
            representation['semester'] = {
                'id': semester.id,
                'semesterName': semester.semesterName,
                'startDate': semester.startDate,
                'endDate': semester.endDate,
                'yearID': semester.schoolYear.id,
                'schoolYearName': semester.schoolYear.schoolYearName,
                'startYear': semester.schoolYear.startYear,
                'endYear': semester.schoolYear.endYear,

            }

        representation['events'] = tblEventSerializer(instance.events.all(), many=True).data

        return representation
    
class EventRemarkSerializer(serializers.ModelSerializer):
    events = serializers.PrimaryKeyRelatedField(queryset=tblEvent.objects.all(), allow_null=True, required=False)  # Allow multiple events

    class Meta:
        model = tblEventRemarks
        fields = '__all__'

    def validate_events(self, value):
        # Check if a remark already exists for the provided event
        if tblEventRemarks.objects.filter(events=value).exists():
            raise serializers.ValidationError("A remark already exists for this event.")
        
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation['events'] = tblEventSerializer(instance.events).data

        return representation
    
# upload user serializer
class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

# documents list
class ApproveDocumentsSerializer(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)
    class Meta:
        model = tblEvent
        fields = ['approveDocuments', 'timestamp', 'created_by', 'department', 'participants']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['participants'] = CustomUserSerializer(instance.participants.all(), many=True).data
        representation['department'] = tbldepartmentSerializer(instance.department.all(), many=True).data

        return representation
    

# Audit Entry
class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = '__all__'