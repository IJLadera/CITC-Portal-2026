from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from djoser.serializers import UserSerializer
from django.core import exceptions as django_exceptions
from django.core.validators import RegexValidator
from rest_framework.settings import api_settings
from djoser.conf import settings
from .models import (
    tblstudentOrg, tblEventType, tblEventCategory, 
    tblVenue, tblSetup, tblEvent, tblEventLog,
    tblEventSchoolYearAndSemester, tblSemester, tblEventRemarks)
from app.lms.models import College, Department, Section, SchoolYear, YearLevel, Status
from app.users.models import UserRole, Role
from django.core.exceptions import ValidationError
from auditlog.models import LogEntry

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'
        depth = 1  # Automatically expands FK relations

# class tblcollegeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = College
#         fields = '__all__'

# class tblYearLevelSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = YearLevel
#         fields = '__all__'

class tbldepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

# class tblSectionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Section
#         fields = '__all__'

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
        model = Status
        fields = '__all__'

class CustomUserSerializer(UserSerializer):
    organization = tblstudentOrgSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    department = tbldepartmentSerializer(read_only=True)

    class Meta:
        model = User
        fields = tuple(User.REQUIRED_FIELDS) + (
            settings.USER_ID_FIELD,
            settings.LOGIN_FIELD,
            "uuid", 
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
            'role',
            'date_joined',
            'department',
            'section',
            'organization'
        )
        read_only_fields = (
            settings.LOGIN_FIELD,
            "uuid",
            'first_name',
            'last_name',
            'id_number',
            'avatar',
            'is_student',
            'is_employee',
            'is_develop',
            'is_staff',
            'is_superuser',
            'role',
            'date_joined',
            'department',
            'section',
            'organization'
        )

    def get_role(self, obj):
        highest_ranked_role = obj.roles.order_by('rank').first()
        if highest_ranked_role:
            return {
                'uuid': highest_ranked_role.uuid,
                'name': highest_ranked_role.name,
                'rank': highest_ranked_role.rank
            }
        return None

class CreatedBySerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['uuid', 'id_number', 'email', 'first_name', 'last_name', 'role', 'department']
        depth = 1

    def get_role(self, obj):
        highest_ranked_role = obj.roles.order_by('rank').first()
        if highest_ranked_role:
            return {
                'uuid': highest_ranked_role.uuid,
                'name': highest_ranked_role.name,
                'rank': highest_ranked_role.rank
            }
        return None

class tblEventSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True, is_staff=False),
        many=True
    )

    created_by = CreatedBySerializer(read_only=True)

    eventCategory = serializers.PrimaryKeyRelatedField(queryset=tblEventCategory.objects.all(), allow_null=True, required=False)

    eventType = serializers.PrimaryKeyRelatedField(queryset=tblEventType.objects.all(), allow_null=True, required=False)

    status = serializers.PrimaryKeyRelatedField(queryset=Status.objects.all(), allow_null=True, required=False)

    venue = serializers.PrimaryKeyRelatedField(queryset=tblVenue.objects.all(), allow_null=True, required=False)

    setup = serializers.PrimaryKeyRelatedField(queryset=tblSetup.objects.all(), allow_null=True, required=False)

    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False, many=True)

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
                'name': status.name
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
            'uuid': user.uuid,
            'id_number': user.id_number,
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
                'departmentName': created_by_department.name,
                # Add any other department fields if necessary
            }

        # Get the highest ranked role of the event creator
        highest_ranked_role = event.created_by.roles.order_by('rank').first()
        created_by_designation = highest_ranked_role.name if highest_ranked_role else None

        # Customize the event representation
        event_representation = {
            'id': event.id,
            'eventName': event.eventName,
            'eventCategoryName': event.eventCategory.eventCategoryName,
            'eventDescription': event.eventDescription,
            'startDateTime': event.startDateTime,
            'endDateTime': event.endDateTime,
            'status': event.status.name if event.status else None,
            'created_by_designation': created_by_designation,
            'created_by_department': created_by_department_representation,
        }
        
        # Replace the user field with the customized representation
        representation['user'] = user_representation
        representation['event'] = event_representation

        return representation

class CollegesSerializer(serializers.ModelSerializer):
    departments = tbldepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = College
        fields = ['id', 'name', 'departments']


# designation count
class UserSerializer(serializers.Serializer):
    uuid = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    
class DesignationCountSerializer(serializers.Serializer):
    name = serializers.CharField()
    count = serializers.IntegerField()
    users = UserSerializer(many=True)  # Add a nested list of users

class FacultyEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')

    class Meta:
        model = User
        fields = ['uuid', 'email', 'first_name', 'last_name', 'middle_name', 'id_number', 'department', 'participated_events', 'created_events']

class UserEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')

    class Meta:
        model = User
        fields = ['uuid', 'email', 'first_name', 'last_name', 'middle_name', 'id_number', 'department', 'participated_events', 'created_events']

class AllRoleEventSerializer(serializers.ModelSerializer):
    participated_events = tblEventSerializer(many=True, read_only=True, source='event_participants')
    created_events = tblEventSerializer(many=True, read_only=True, source='event_createdby')
    roles = UserRoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['uuid', 'email', 'first_name', 'last_name', 'middle_name', 'id_number', 'roles', 'department', 'participated_events', 'created_events']

class SchoolYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolYear
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
                'schoolYearName': semester.schoolYear.name,
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