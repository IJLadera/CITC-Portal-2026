from django.shortcuts import render
from django.contrib.auth import get_user_model
from .serializers import (
    RoleSerializer, UserRoleSerializer, tblstudentOrgSerializer, tblEventTypeSerializer,
    tblEventCategorySerializer, tblVenueSerializer, tblSetupSerializer,
    tblStatusSerializer, tblEventSerializer, tblEventLogSerializer,
    CollegesSerializer, DesignationCountSerializer, 
    UserEventSerializer,FacultyEventSerializer, AllRoleEventSerializer, SchoolYearAndSemesterEvent, 
    SchoolYearSerializer, SemesterSerializer, tblEventType,
    EventRemarkSerializer, CSVUploadSerializer, ApproveDocumentsSerializer, LogEntrySerializer
    )
from app.unieventify.serializers import CustomUserSerializer
from rest_framework.permissions import AllowAny
from app.lms.serializers import CollegeSerializer, DepartmentSerializer, SectionSerializer, YearLevelSerializer

from .models import (
    tblstudentOrg, tblEventType, tblEventCategory, 
    tblVenue, tblSetup, tblEvent, tblEventLog,
    tblEventSchoolYearAndSemester, tblSemester, tblEventRemarks)
from app.lms.models import Department, College, YearLevel, Section, SchoolYear, Status

from app.users.models import User, UserRole, Role

from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, UpdateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType

from django.db.models.functions import TruncMonth
from django.db.models import Count, Max, F, Subquery, OuterRef, IntegerField, CharField, Value, Min
from rest_framework.response import Response
from rest_framework import status, serializers
from datetime import datetime, timedelta, timezone as dj_timezone, date
from draftjs_exporter.html import HTML
import json
import csv
import io
import chardet
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail, send_mass_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from calendar import month_name
from django.conf import settings
from django.utils.timezone import make_aware, get_current_timezone
from .tasks import send_event_email_notification, send_user_email_notification
from django.shortcuts import get_object_or_404

from app.users.permissions import IsOwnerOrReadOnly, IsAdminOrReadOnly, IsUserOrReadOnly, IsDeanOrReadOnly, IsUserOrIsAdminOrReadOnly, IsNotificationOrReadOnly, IsOwnerOrIsAdminOrReadOnly, RoleHierarchyPermission, IsAuthenticatedOrReadOnly

User = get_user_model()


class UserListView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        # Exclude users with is_admin=True
        return User.objects.filter(is_staff=False)
    
class UserInfoView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        # Exclude users with is_admin=True
        return User.objects.filter(is_staff=False)
    
    def get_object(self):
        uuid = self.kwargs.get("uuid")
        return get_object_or_404(User, uuid=uuid, is_staff=False)
    
# class UserInfoView(RetrieveUpdateDestroyAPIView):
#     queryset = CustomUser.objects.all()
#     serializer_class = CustomUserSerializer
#     permission_classes = [IsAdminOrReadOnly]

    
#     def get_queryset(self):
#         # Exclude users with is_admin=True
#         return CustomUser.objects.filter(is_staff=False)

class UserRoleListView(ListCreateAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminOrReadOnly]

class UserRoleInfoView(RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminOrReadOnly]  

    def get_object(self):
        uuid = self.kwargs.get("uuid")
        return get_object_or_404(Role, uuid=uuid)

class CollegeListView(ListCreateAPIView):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [IsAdminOrReadOnly]

class CollegeInfoView(RetrieveUpdateDestroyAPIView):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class YearLevelListView(ListCreateAPIView):
    queryset = YearLevel.objects.all()
    serializer_class = YearLevelSerializer
    permission_classes = [IsAdminOrReadOnly]

class YearLevelInfoView(RetrieveUpdateDestroyAPIView):
    queryset = YearLevel.objects.all()
    serializer_class = YearLevelSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class DepartmentListView(ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class DepartmentInfoView(RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class StudentOrgListView(ListCreateAPIView):
    queryset = tblstudentOrg.objects.all()
    serializer_class = tblstudentOrgSerializer
    permission_classes = [IsAdminOrReadOnly]

class StudentOrgInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblstudentOrg.objects.all()
    serializer_class = tblstudentOrgSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class SectionListView(ListCreateAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]

class SectionInfoView(RetrieveUpdateDestroyAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]

class EventTypeListView(ListCreateAPIView):
    queryset = tblEventType.objects.all()
    serializer_class = tblEventTypeSerializer
    permission_classes = [IsAdminOrReadOnly]

class EventTypeInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEventType.objects.all()
    serializer_class = tblEventTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class EventCategoryListView(ListCreateAPIView):
    queryset = tblEventCategory.objects.all()
    serializer_class = tblEventCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class EventCategoryInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEventCategory.objects.all()
    serializer_class = tblEventCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class VenueListView(ListCreateAPIView):
    queryset = tblVenue.objects.all()
    serializer_class = tblVenueSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class VenueInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblVenue.objects.all()
    serializer_class = tblVenueSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class SetupListView(ListCreateAPIView):
    queryset = tblSetup.objects.all()
    serializer_class = tblSetupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class SetupInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblSetup.objects.all()
    serializer_class = tblSetupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class StatusListView(ListCreateAPIView):
    queryset = Status.objects.all()
    serializer_class = tblStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class StatusInfoView(RetrieveUpdateDestroyAPIView):
    queryset = Status.objects.all()
    serializer_class = tblStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class SchoolYearAndSemesterListView(ListCreateAPIView):
    queryset = tblEventSchoolYearAndSemester.objects.all()
    serializer_class = SchoolYearAndSemesterEvent
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save()  # Create the instance
        # The events will be handled by the serializer automatically

class SchoolYearAndSemesterInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEventSchoolYearAndSemester.objects.all()
    serializer_class = SchoolYearAndSemesterEvent
    permission_classes = [IsAdminOrReadOnly]
    
class SchoolYearListView(ListCreateAPIView):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]

class SchoolYearInfoView(RetrieveUpdateDestroyAPIView):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]

class SemesterListView(ListCreateAPIView):
    queryset = tblSemester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]

class SemesterInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblSemester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]

class EventListView(ListCreateAPIView):
    queryset = tblEvent.objects.all()
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, RoleHierarchyPermission]

    def perform_create(self, serializer):
        # comment this if you want to send email notifications
        # serializer.save(created_by=self.request.user)

        # email notifications
        # uncomment this if you want to send email notifications

        event = serializer.save(created_by=self.request.user)
        # Automatically detect the school year and semester based on the event's startDateTime
        if event.startDateTime:
            start_date = event.startDateTime.date()
            error_messages = []

            # Find the corresponding school year (handle the case where more than one school year is returned)
            school_years = SchoolYear.objects.filter(
                Q(startYear__lte=start_date.year) & Q(endYear__gte=start_date.year)
            ).order_by('-startYear')  # Ordering by startYear to get the most recent year first

            if school_years.exists():
                # Assume we take the first matching school year (the most recent one)
                school_year = school_years.first()
            else:
                error_messages.append("No matching school year found for the event's start date.")

            # Find the corresponding semester
            try:
                semester = tblSemester.objects.get(
                    startDate__lte=start_date,
                    endDate__gte=start_date,
                    schoolYear=school_year  # Ensure the semester belongs to the found school year
                )
            except tblSemester.DoesNotExist:
                error_messages.append("No matching semester found for the event's start date.")

            # Check if there were any error messages
            if error_messages:
                # Return error response if no matching school year or semester was found
                return Response({"errors": error_messages}, status=status.HTTP_400_BAD_REQUEST)

            # If both school year and semester are found, create or update the tblEventSchoolYearAndSemester instance
            event_school_year_and_semester, created = tblEventSchoolYearAndSemester.objects.get_or_create(
                semester=semester
            )

            # Associate the created event with the school year and semester
            event_school_year_and_semester.events.add(event)
        
        # Send email notifications in the background
        send_event_email_notification.delay(event.id)


class EventInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEvent.objects.all()
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, RoleHierarchyPermission]

    def update(self, request, *args, **kwargs):
        # Get the current instance of the event
        instance = self.get_object()
        old_status = instance.status.name  # Save the old status name

        # Call the parent `update` method to save the new data
        response = super().update(request, *args, **kwargs)

        # Check if the status has changed to "postponed"
        new_status = response.data.get('status', {}).get('name')
        if old_status != 'postponed' and new_status == 'postponed':
            # Send email notification
            self.send_postponed_email(instance.id)

        return response

class EventLogListView(ListCreateAPIView):
    queryset = tblEventLog.objects.all()
    serializer_class = tblEventLogSerializer
    permission_classes = [permissions.IsAuthenticated]

class EventLogInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEventLog.objects.all()
    serializer_class = tblEventLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsUserOrIsAdminOrReadOnly]

class EventRemarkListView(ListCreateAPIView):
    queryset = tblEventRemarks.objects.all()
    serializer_class = EventRemarkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class EventRemarkInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEventRemarks.objects.all()
    serializer_class = EventRemarkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# filtered views based on the functionality

class UserEventListView(ListAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        return tblEvent.objects.filter(participants=user)
    
class UserEventRetrieveView(RetrieveAPIView):
    queryset = tblEvent.objects.all()
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_object(self):
        event = super().get_object()
        if self.request.user not in event.participants.all():
            raise PermissionDenied("You are not a participant of this event.")
        return event

class EventStatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name
        
        # Base query to exclude personal events and draft statuses
        queryset = tblEvent.objects.exclude(
            eventCategory__eventCategoryName__iexact='personal'
        ).exclude(status__name__iexact='draft').exclude(status__name__iexact='disapproved')

        # Apply role-based restrictions
        if user_role == 'Admin':
            return queryset
        elif user_role == 'Dean':
            return queryset.exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])
        elif user_role in ['Chairperson', 'Faculty']:
            return queryset.filter(
                Q(department=user.department) | 
                Q(participants__in=[user])
            ).exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])
        elif user_role == 'Student':
            return queryset.filter(
                Q(department=user.department) & 
                Q(participants__in=[user])
            )
        elif user_role == 'Mother Org':
            return queryset.filter(
                created_by__role__name__in=['Mother Org', 'Unit Org']
            )
        elif user_role == 'Unit Org':
            return queryset.filter(
                (Q(department=user.department.id) & Q(created_by__role__name__in=['Mother Org', 'Unit Org'])) |
                Q(created_by__role__name='Mother Org')
            )
        return tblEvent.objects.none()

    def get_semester_for_date(self, event_date):
        """Helper function to find which semester and school year an event date falls into."""
        semesters = tblSemester.objects.select_related('schoolYear').all()
        current_tz = get_current_timezone()  # Get the current timezone set in Django

        for semester in semesters:
            # Convert semester dates to timezone-aware datetime objects
            semester_start = make_aware(datetime.combine(semester.startDate, datetime.min.time()), current_tz)
            semester_end = make_aware(datetime.combine(semester.endDate, datetime.max.time()), current_tz)

            # Check if the event date falls within the semester
            if semester_start <= event_date <= semester_end:
                return {
                    "semester": semester.semesterName,
                    "schoolYear": semester.schoolYear.name
                }
        return {"semester": "Unknown", "schoolYear": "Unknown"}

    def get(self, request):
        # Retrieve the filtered queryset based on user's role
        events_queryset = self.get_queryset()

        # Aggregate events by month
        events_by_month = events_queryset.annotate(
            month=TruncMonth('startDateTime')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Prepare the response data with semester and school year
        data = {
            'statistics': [
                {
                    'month': event['month'].strftime('%Y-%m') if event['month'] else 'Unknown',
                    'count': event['count'],
                    'semesterInfo': self.get_semester_for_date(event['month']),
                    'events': [
                        {
                            'id': e.id,
                            'name': e.eventName,
                            'category': e.eventCategory.eventCategoryName,
                            'type': e.eventType.eventTypeName,
                            'status': e.status.name if e.status else 'Unknown',
                            'startDateTime': e.startDateTime,
                            'endDateTime': e.endDateTime,
                            'description': e.eventDescription,
                            'created_by': f"{e.created_by.first_name} {e.created_by.last_name} ({e.created_by.roles.order_by('rank').first().name})",
                            'participants': [f"{p.first_name} {p.last_name}" for p in e.participants.all()],
                            'departments': [d.name for d in e.department.all()],
                            'semesterInfo': self.get_semester_for_date(e.startDateTime),
                        }
                        for e in events_queryset.filter(startDateTime__month=event['month'].month)
                    ]
                }
                for event in events_by_month
            ]
        }

        return Response(data)

class EventStatisticsCreatedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_semester_for_date(self, event_date):
        """Helper function to find which semester and school year an event date falls into."""
        semesters = tblSemester.objects.select_related('schoolYear').all()
        current_tz = get_current_timezone()

        for semester in semesters:
            semester_start = make_aware(datetime.combine(semester.startDate, datetime.min.time()), current_tz)
            semester_end = make_aware(datetime.combine(semester.endDate, datetime.max.time()), current_tz)
            
            if semester_start <= event_date <= semester_end:
                return {
                    "semester": semester.semesterName,
                    "schoolYear": semester.schoolYear.name
                }
        return {"semester": "Unknown", "schoolYear": "Unknown"}

    def get(self, request):
        user = request.user

        # Show only events created by the current user
        events_queryset = tblEvent.objects.filter(created_by=user)

        # Aggregate events by month
        events_by_month = events_queryset.annotate(
            month=TruncMonth('startDateTime')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Prepare the response data with semester and school year information
        data = {
            'statistics': [
                {
                    'month': event['month'].strftime('%B %Y') if event['month'] else 'Unknown',
                    'count': event['count'],
                    'semesterInfo': self.get_semester_for_date(event['month']),
                    'events': [
                        {
                            'id': e.id,
                            'name': e.eventName,
                            'category': e.eventCategory.eventCategoryName,
                            'type': e.eventType.eventTypeName,
                            'status': e.status.name if e.status else 'Unknown',
                            'startDateTime': e.startDateTime,
                            'endDateTime': e.endDateTime,
                            'description': e.eventDescription,
                            'created_by': f"{e.created_by.first_name} {e.created_by.last_name} ({e.created_by.roles.order_by('rank').first().name})",
                            'participants': [f"{p.first_name} {p.last_name}" for p in e.participants.all()],
                            'departments': [d.name for d in e.department.all()],
                            'semesterInfo': self.get_semester_for_date(e.startDateTime),
                        }
                        for e in events_queryset.filter(startDateTime__month=event['month'].month)
                    ]
                }
                for event in events_by_month
            ]
        }

        return Response(data)
    
class EventStatisticsByCategoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_semester_for_date(self, event_date):
        """Helper function to find which semester and school year an event date falls into."""
        semesters = tblSemester.objects.select_related('schoolYear').all()
        current_tz = get_current_timezone()

        for semester in semesters:
            semester_start = make_aware(datetime.combine(semester.startDate, datetime.min.time()), current_tz)
            semester_end = make_aware(datetime.combine(semester.endDate, datetime.max.time()), current_tz)
            
            if semester_start <= event_date <= semester_end:
                return {
                    "semester": semester.semesterName,
                    "schoolYear": semester.schoolYear.name
                }
        return {"semester": "Unknown", "schoolYear": "Unknown"}

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name


        # Base query to exclude personal events and draft statuses
        queryset = tblEvent.objects.exclude(eventCategory__eventCategoryName__iexact='personal').exclude(status__name__iexact='draft').exclude(eventCategory__isnull=True).exclude(eventCategory__eventCategoryName='').exclude(status__name__iexact='disapproved')

        # Apply role-based restrictions
        if user_role == 'Admin':
            return queryset
        
        elif user_role == 'Dean':
            return queryset.exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role in ['Chairperson', 'Faculty']:
            return queryset.filter(
                Q(department=user.department) | 
                Q(participants__in=[user])
            ).exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role == 'Student':
            return queryset.filter(
                Q(department=user.department) & 
                Q(participants__in=[user])
            )

        elif user_role == 'Mother Org':
            return queryset.filter(
                created_by__role__name__in=['Mother Org', 'Unit Org']
            )

        elif user_role == 'Unit Org':
            return queryset.filter(
                (Q(department=user.department) & Q(created_by__role__name__in=['Mother Org', 'Unit Org'])) |
                Q(created_by__role__name='Mother Org')
            )

        return tblEvent.objects.none()

    def get(self, request):
        # Retrieve the filtered queryset based on user's role
        events_queryset = self.get_queryset()

        # Group events by category
        events_by_category = events_queryset.values('eventCategory__eventCategoryName').annotate(
            category_count=Count('id')
        )

        data = []

        for category in events_by_category:
            category_name = category['eventCategory__eventCategoryName']
            category_events = events_queryset.filter(eventCategory__eventCategoryName=category_name)

            # Group events within each category by month
            events_by_month = category_events.annotate(
                month=TruncMonth('startDateTime')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')

            category_data = {
                'category': category_name,
                'total_count': category['category_count'],
                'statistics': [
                    {
                        'month': month_name[event['month'].month] + ' ' + str(event['month'].year) if event['month'] else 'Unknown',
                        'count': event['count'],
                        'semesterInfo': self.get_semester_for_date(event['month']),
                        'events': [
                            {
                                'id': e.id,
                                'name': e.eventName,
                                'category': e.eventCategory.eventCategoryName,
                                'type': e.eventType.eventTypeName,
                                'status': e.status.name,
                                'startDateTime': e.startDateTime,
                                'endDateTime': e.endDateTime,
                                'description': e.eventDescription,
                                'created_by': f"{e.created_by.first_name} {e.created_by.last_name} ({e.created_by.roles.order_by('rank').first().name})",
                                'participants': [f"{p.first_name} {p.last_name}" for p in e.participants.all()],
                                'departments': [d.name for d in e.department.all()],
                                'semesterInfo': self.get_semester_for_date(e.startDateTime),
                            }
                            for e in category_events.filter(startDateTime__month=event['month'].month)
                        ]
                    }
                    for event in events_by_month
                ]
            }

            data.append(category_data)

        return Response(data)
    
class EventStatisticsByDepartmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_semester_for_date(self, event_date):
        """Helper function to find which semester and school year an event date falls into."""
        semesters = tblSemester.objects.select_related('schoolYear').all()
        current_tz = get_current_timezone()

        for semester in semesters:
            semester_start = make_aware(datetime.combine(semester.startDate, datetime.min.time()), current_tz)
            semester_end = make_aware(datetime.combine(semester.endDate, datetime.max.time()), current_tz)
            
            if semester_start <= event_date <= semester_end:
                return {
                    "semester": semester.semesterName,
                    "schoolYear": semester.schoolYear.name
                }
        return {"semester": "Unknown", "schoolYear": "Unknown"}

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name

        # Base query to exclude personal events and draft statuses
        queryset = tblEvent.objects.exclude(eventCategory__eventCategoryName__iexact='personal') \
                                   .exclude(status__name__iexact='draft') \
                                   .exclude(department__isnull=True) \
                                   .exclude(department__name='') \
                                   .exclude(status__name__iexact='disapproved')

        # Apply role-based restrictions
        if user_role == 'Admin':
            return queryset
        
        elif user_role == 'Dean':
            return queryset.exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role in ['Chairperson', 'Faculty']:
            return queryset.filter(
                Q(department=user.department) | 
                Q(participants__in=[user])
            ).exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role == 'Student':
            return queryset.filter(
                Q(department=user.department) & 
                Q(participants__in=[user])
            )

        elif user_role == 'Mother Org':
            return queryset.filter(
                created_by__role__name__in=['Mother Org', 'Unit Org']
            )

        elif user_role == 'Unit Org':
            return queryset.filter(
                (Q(department=user.department) & Q(created_by__role__name__in=['Mother Org', 'Unit Org'])) |
                Q(created_by__role__name='Mother Org')
            )

        return tblEvent.objects.none()

    def get(self, request):
        # Retrieve the filtered queryset based on user's role
        events_queryset = self.get_queryset()

        # Group events by department
        events_by_department = events_queryset.values('department__name').annotate(
            department_count=Count('id')
        )

        data = []

        for department in events_by_department:
            department_name = department['department__name']
            department_events = events_queryset.filter(department__name=department_name)

            # Group events within each department by month
            events_by_month = department_events.annotate(
                month=TruncMonth('startDateTime')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')

            department_data = {
                'department': department_name,
                'total_count': department['department_count'],
                'statistics': [
                    {
                        'month': month_name[event['month'].month] + ' ' + str(event['month'].year) if event['month'] else 'Unknown',
                        'count': event['count'],
                        'semesterInfo': self.get_semester_for_date(event['month']),
                        'events': [
                            {
                                'id': e.id,
                                'name': e.eventName,
                                'category': e.eventCategory.eventCategoryName,
                                'type': e.eventType.eventTypeName,
                                'status': e.status.name,
                                'startDateTime': e.startDateTime,
                                'endDateTime': e.endDateTime,
                                'description': e.eventDescription,
                                'created_by': f"{e.created_by.first_name} {e.created_by.last_name} ({e.created_by.roles.order_by('rank').first().name})",
                                'participants': [f"{p.first_name} {p.last_name}" for p in e.participants.all()],
                                'departments': [d.name for d in e.department.all()],
                                'semesterInfo': self.get_semester_for_date(e.startDateTime),
                            }
                            for e in department_events.filter(startDateTime__month=event['month'].month)
                        ]
                    }
                    for event in events_by_month
                ]
            }

            data.append(department_data)

        return Response(data)
    
class EventStatisticsCancelledView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_semester_for_date(self, event_date):
        """Helper function to find which semester and school year an event date falls into."""
        semesters = tblSemester.objects.select_related('schoolYear').all()
        current_tz = get_current_timezone()

        for semester in semesters:
            semester_start = make_aware(datetime.combine(semester.startDate, datetime.min.time()), current_tz)
            semester_end = make_aware(datetime.combine(semester.endDate, datetime.max.time()), current_tz)
            
            if semester_start <= event_date <= semester_end:
                return {
                    "semester": semester.semesterName,
                    "schoolYear": semester.schoolYear.name
                }
        return {"semester": "Unknown", "schoolYear": "Unknown"}

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name

        # Base query to include only events with 'Cancelled' status and exclude personal events
        queryset = tblEvent.objects.filter(status__name='cancelled').exclude(eventCategory__eventCategoryName__iexact='personal') 

        # Apply role-based restrictions
        if user_role == 'Admin':
            return queryset
        
        elif user_role == 'Dean':
            return queryset.exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role in ['Chairperson', 'Faculty']:
            return queryset.filter(
                Q(department=user.department) | 
                Q(participants__in=[user])
            ).exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        elif user_role == 'Student':
            return queryset.filter(
                Q(department=user.department) & 
                Q(participants__in=[user])
            )

        elif user_role == 'Mother Org':
            return queryset.filter(
                created_by__role__name__in=['Mother Org', 'Unit Org']
            )

        elif user_role == 'Unit Org':
            return queryset.filter(
                (Q(department=user.department) & Q(created_by__role__name__in=['Mother Org', 'Unit Org'])) |
                Q(created_by__role__name='Mother Org')
            )

        # If the role is not covered, return an empty queryset
        return tblEvent.objects.none()

    def get(self, request):
        # Retrieve the filtered queryset based on user's role and status = 'Cancelled'
        events_queryset = self.get_queryset()

        # Aggregate events by month
        events_by_month = events_queryset.annotate(
            month=TruncMonth('startDateTime')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Prepare the response data
        data = {
            'statistics': [
                {
                    'month': month_name[event['month'].month] + ' ' + str(event['month'].year) if event['month'] else 'Unknown',
                    'count': event['count'],
                    'semesterInfo': self.get_semester_for_date(event['month']),
                    'events': [
                        {
                            'id': e.id,
                            'name': e.eventName,
                            'category': e.eventCategory.eventCategoryName,
                            'type': e.eventType.eventTypeName,
                            'status': e.status.name,
                            'startDateTime': e.startDateTime,
                            'endDateTime': e.endDateTime,
                            'description': e.eventDescription,
                            'created_by': f"{e.created_by.first_name} {e.created_by.last_name} ({e.created_by.roles.order_by('rank').first().name})",
                            'participants': [f"{p.first_name} {p.last_name}" for p in e.participants.all()],
                            'departments': [d.name for d in e.department.all()],
                            'semesterInfo': self.get_semester_for_date(e.startDateTime),
                        }
                        for e in events_queryset.filter(startDateTime__month=event['month'].month)
                    ]
                }
                for event in events_by_month
            ]
        }

        return Response(data)
    
class PersonalEventsView(ListAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        #get the current user
        user = self.request.user
        # Exclude events that is not personal and not the current user
        # personal 
        return tblEvent.objects.filter(eventCategory__eventCategoryName = 'personal', created_by=user)
    
class PersonalEventsInfoView(RetrieveUpdateDestroyAPIView):
    queryset = tblEvent.objects.all()
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_object(self):
        event = super().get_object()
        if event.eventCategory.id != 1:  # Check if the event is personal
            raise PermissionDenied("You are not authorized to access this event.")
        return event
    
#CSV upload file
class CSVUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        file = request.FILES.get('file')
        if not file or not file.name.endswith('.csv'):
            return Response({"error": "File is not CSV"}, status=status.HTTP_400_BAD_REQUEST)

        # Read raw data and detect encoding
        raw_data = file.read()
        result = chardet.detect(raw_data)
        encoding = result['encoding']

        # Decode the file using detected encoding
        decoded_file = raw_data.decode(encoding)
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        # Initialize an empty list for error messages
        error_messages = []

        for row in reader:
            participants_emails = row.get('participants', '').split(',')
            participants = User.objects.filter(email__in=participants_emails)

           # Handle department field with custom logic
            department_names = row.get('department', '').strip()
            if department_names == "All":
                # Select all departments
                departments = Department.objects.exclude(name__startswith="All")
            elif department_names == "CITC":
                # Dynamically fetch the college based on name "CITC"
                citc_college = College.objects.filter(collegeName="CITC").first()
                if citc_college:
                    # Select departments under the CITC college but exclude those that start with "All"
                    departments = Department.objects.filter(
                        Q(collegeName=citc_college) & ~Q(name__startswith="All")
                    )
            else:
                # Split and match specific department names
                departments = Department.objects.filter(
                    name__in=[name.strip() for name in department_names.split(',')]
                )
            # Handle eventType field
            eventType = tblEventType.objects.filter(eventTypeName=row.get('eventType', '')).first()
            eventCategory = tblEventCategory.objects.filter(eventCategoryName=row.get('eventCategory', '')).first()
            venue = tblVenue.objects.filter(venueName=row.get('venue', '')).first()
            setup = tblSetup.objects.filter(setupName=row.get('setup', '').lower()).first()

            # Handle startDateTime and endDateTime
            startDateTime = None
            endDateTime = None
            if row.get('startDateTime'):
                try:
                    startDateTime = datetime.strptime(row.get('startDateTime'), '%m-%d-%Y, %H:%M:%S')
                    startDateTime = timezone.make_aware(startDateTime, timezone.get_current_timezone())
                except (ValueError, TypeError):
                    error_messages.append("Invalid startDateTime format.")
            if row.get('endDateTime'):
                try:
                    endDateTime = datetime.strptime(row.get('endDateTime'), '%m-%d-%Y, %H:%M:%S')
                    endDateTime = timezone.make_aware(endDateTime, timezone.get_current_timezone())
                except (ValueError, TypeError):
                    error_messages.append("Invalid endDateTime format.")

            now = timezone.now()
            upcoming_status = Status.objects.get(name='upcoming')
            ongoing_status = Status.objects.get(name='ongoing')
            done_status = Status.objects.get(name='done')

            eventStatus = None
            if startDateTime and endDateTime:
                if startDateTime > now:
                    eventStatus = upcoming_status
                elif startDateTime <= now <= endDateTime:
                    eventStatus = ongoing_status
                else:
                    eventStatus = done_status

            # Handle recurrence type and days
            recurrence_type = row.get('recurrence_type', 'none')
            recurrence_days = row.get('recurrence_days', None)
            if recurrence_days:
                try:
                    recurrence_days = eval(recurrence_days)  # Ensure this is sanitized and properly formatted in the CSV
                except (SyntaxError, ValueError):
                    error_messages.append("Invalid recurrence_days format.")
                    recurrence_days = None

            eventName = row.get('eventName', '').strip().replace('\n', ' ').replace('\r', ' ')
            eventDescription = row.get('eventDescription', '').strip().replace('\n', ' ').replace('\r', ' ')
            
            # Skip row if required fields are empty
            if not eventName or not eventDescription:
                continue


            data = {
                'eventType': eventType.id if eventType else None,
                'eventCategory': eventCategory.id if eventCategory else None,
                'venue': venue.id if venue else None,
                'setup': setup.id if setup else None,
                'status': eventStatus.id if eventStatus else None,
                'meetinglink': row.get('meetinglink', None),
                'participants': [participant.uuid for participant in participants] if participants else [],
                'eventName': eventName,
                'eventDescription': eventDescription,
                'startDateTime': startDateTime,
                'endDateTime': endDateTime,
                'timestamp': row.get('timestamp', timezone.now()),
                'majorEvent': row.get('majorEvent', None),
                'created_by': request.user.uuid,
                'recurrence_type': recurrence_type,
                'recurrence_days': recurrence_days,
                'isAnnouncement': row.get('isAnnouncement', None),
                'isAprrovedByDean': row.get('isAprrovedByDean', None),
                'isAprrovedByChairman': row.get('isAprrovedByChairman', None),
                'department': [dept.id for dept in departments] if departments else []
            }

            # Update the filtering logic to match eventName, startDateTime, and endDateTime
            event = tblEvent.objects.filter(
                eventName=data['eventName'],
                startDateTime=startDateTime,
                endDateTime=endDateTime
            ).first()

            if event:
                serializer = tblEventSerializer(event, data=data, context={'request': request})
            else:
                serializer = tblEventSerializer(data=data, context={'request': request})

            if serializer.is_valid():
                event_instance = serializer.save()

                # Automatically detect the school year and semester based on the event's startDateTime
                if startDateTime:
                    start_date = startDateTime.date()

                    # Find the corresponding school year
                    school_years = SchoolYear.objects.filter(
                        Q(startYear__lte=start_date.year) & Q(endYear__gte=start_date.year)
                    ).order_by('-startYear')

                    if school_years.exists():
                        school_year = school_years.first()
                    else:
                        error_messages.append("No matching school year found for the event's start date.")

                    # Find the corresponding semester
                    try:
                        semester = tblSemester.objects.get(
                            startDate__lte=start_date,
                            endDate__gte=start_date,
                            schoolYear=school_year
                        )
                    except tblSemester.DoesNotExist:
                        error_messages.append("No matching semester found for the event's start date.")

                    if school_year and semester:
                        event_school_year_and_semester, created = tblEventSchoolYearAndSemester.objects.get_or_create(
                            semester=semester
                        )
                        event_school_year_and_semester.events.add(event_instance)
            else:
                print("Validation errors:", serializer.errors)  # Log serializer errors
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if error_messages:
            return Response({"errors": error_messages}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": "success"}, status=status.HTTP_201_CREATED)


class UserCSVUploadView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def post(self, request, *args, **kwargs):
        serializer = CSVUploadSerializer(data=request.data)
        if serializer.is_valid():
            csv_file = serializer.validated_data['file']
            file_data = csv_file.read().decode('utf-8')
            csv_data = csv.DictReader(io.StringIO(file_data))

            for row in csv_data:
                try:
                    # Check if essential fields are present
                    required_fields = ["email", "first_name", "last_name", "id_number", "roles"]
                    for field in required_fields:
                        if not row.get(field):
                            raise ValueError(f"Missing required field '{field}' in row: {row}")

                    # Fetch related fields with case-insensitive match
                    department = Department.objects.filter(name__iexact=row.get('department', '').strip()).first()
                    section = Section.objects.filter(section__iexact=row.get('section', '').strip()).first()
                    organization = tblstudentOrg.objects.filter(studentOrgName__iexact=row.get('organization', '').strip()).first()

                    # Check for an existing user by `idNumber`
                    user = User.objects.filter(id_number=row['id_number']).first()

                    if user:
                        # If user exists, just update `is_active`
                        user.is_active = True
                        user.save()
                    else:
                        # Create new user
                        user_data = {
                            "email": row.get("email"),
                            "first_name": row.get("first_name"),
                            "last_name": row.get("last_name"),
                            "middle_name": row.get("middle_name"),
                            "department": department if department else None,
                            "section": section if section else None,
                            "organization": organization if organization else None,
                            "is_staff": row.get("is_staff", "false").lower() == "true",
                            "id_number": row['id_number'],
                            "is_active": True,  # Set to true for new users
                        }

                        user = User.objects.create(**user_data)

                        # Set the default password to idNumber
                        user.set_password(user.id_number)
                        user.save()

                        # Enqueue email notification task
                        send_user_email_notification.delay(
                            first_name=user.first_name,
                            last_name=user.last_name,
                            email=row.get('email'),
                            password=user.id_number
                        )

                    # Handle multiple roles
                    role_names = [r.strip() for r in row.get('roles', '').split(',') if r.strip()]
                    for role_name in role_names:
                        role = Role.objects.filter(name__iexact=role_name).first()
                        if role:
                            # Check if the user already has this role
                            if not UserRole.objects.filter(user=user, role=role).exists():
                                UserRole.objects.create(user=user, role=role)

                except Exception as e:
                    # Log detailed error for debugging
                    print(f"Error processing row {row}: {e}")
                    return Response({"error": f"Error processing row {row}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"detail": "Users uploaded successfully"}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# for Public events
class PublicEventsView(ListAPIView):
    serializer_class = tblEventSerializer

    def get_queryset(self):
        current_date = timezone.now().date()
        current_year = current_date.year

        # Filter semesters where the current date falls within the start and end date range, and also match the school year
        active_school_year_semesters = tblEventSchoolYearAndSemester.objects.filter(
            semester__startDate__lte=current_date,
            semester__endDate__gte=current_date,
            semester__schoolYear__startYear__lte=current_year,
            semester__schoolYear__endYear__gte=current_year
        )

        # Gather all the event ids related to the active semesters
        event_ids = active_school_year_semesters.values_list('events__id', flat=True)

        # Filter events based on the valid event categories
        return tblEvent.objects.filter(
            id__in=event_ids
        ).filter(
            Q(eventCategory__eventCategoryName__iexact='university') |
            Q(eventCategory__eventCategoryName__iexact='college') |
            Q(eventCategory__eventCategoryName__iexact='exam')
        ).exclude(status__name__iexact='draft').exclude(status__name__iexact='disapproved')
        
class PublicEventsInfoView(RetrieveAPIView):
    serializer_class = tblEventSerializer

    def get_queryset(self):
        current_date = timezone.now().date()
        current_year = current_date.year

        # Filter semesters where the current date falls within the start and end date range, and also match the school year
        active_school_year_semesters = tblEventSchoolYearAndSemester.objects.filter(
            semester__startDate__lte=current_date,
            semester__endDate__gte=current_date,
            semester__schoolYear__startYear__lte=current_year,
            semester__schoolYear__endYear__gte=current_year
        )

        # Gather all the event ids related to the active semesters
        event_ids = active_school_year_semesters.values_list('events__id', flat=True)

        # Filter events based on the valid event categories
        return tblEvent.objects.filter(
            id__in=event_ids
        ).filter(
            Q(eventCategory__eventCategoryName__iexact='university') |
            Q(eventCategory__eventCategoryName__iexact='college') |
            Q(eventCategory__eventCategoryName__iexact='exam')
        ).exclude(status__name__iexact='draft').exclude(status__name__iexact='disapproved')
    
class CollegeDetailView(ListAPIView):
    queryset = College.objects.all()
    serializer_class = CollegesSerializer

# Notifications 

class UserNotificationListView(ListAPIView):
    serializer_class = tblEventLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Filter event logs where the user is a participant in the event
        return tblEventLog.objects.filter(user=user)

    
class MarkNotificationAsRead(RetrieveUpdateDestroyAPIView):
    queryset = tblEventLog.objects.all()
    serializer_class = tblEventLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationOrReadOnly]

class ApprovalEvent(ListAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name

        # Check if the user has the required designation
        if user_role=="Dean":
            # Retrieve distinct events needing approval for Dean/Chairperson

            return (
                tblEvent.objects.filter(
                    ~Q(eventCategory__eventCategoryName="Personal"),
                    Q(created_by__role__name__in=["Mother Org", "Unit Org"]),
                    Q(status__name="draft"),
                )
            )
        
        # Check if the user is a Chairperson with an assigned department
        if user_role == "Chairperson" and user.department.id:
            # Retrieve event logs for Unit Org or Faculty within the same department
            return (
                tblEvent.objects.filter(
                    ~Q(eventCategory__eventCategoryName="Personal"),
                    Q(created_by__role__name__in=["Unit Org", "Faculty"]),
                    Q(created_by__department=user.department.id),
                    Q(status__name="draft")
                )
            )
        
        return tblEvent.objects.none()  # Return an empty queryset if the user is not eligible
    
class ApprovalEventsDetails(RetrieveUpdateDestroyAPIView):
    queryset = tblEvent.objects.all()
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsUserOrReadOnly]

class UserCreatedEventsView(ListAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Filter events to include only those created by the current user
        return tblEvent.objects.filter(created_by=user)
    
class UserCreatedEventsInfoView(RetrieveUpdateDestroyAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Filter events to include only those created by the current user
        return tblEvent.objects.filter(created_by=user)


# desgination count 
class DesignationCountView(APIView):
    def get(self, request):
        # Get the highest-ranked role name for each user
        highest_ranked_role = Role.objects.filter(
            userrole__user=OuterRef('pk')
        ).order_by('rank').values('name')[:1]

        # Annotate each user with their highest-ranking role name
        users_with_highest_role = User.objects.annotate(
            highest_role=Subquery(highest_ranked_role, output_field=CharField())  # Fix output field to CharField
        ).values('uuid', 'first_name', 'last_name', 'highest_role')

        # Group users by their highest role and count them
        role_counts = {}
        for user in users_with_highest_role:
            role_name = user.pop('highest_role')  # Extract role name
            if role_name:
                if role_name not in role_counts:
                    role_counts[role_name] = {'name': role_name, 'count': 0, 'users': []}
                role_counts[role_name]['count'] += 1
                role_counts[role_name]['users'].append(user)

        # Convert dictionary to list
        designation_data = list(role_counts.values())

        # Serialize and return the response
        serializer = DesignationCountSerializer(designation_data, many=True)
        return Response(serializer.data)


class UnavailablesSlotNonPersonalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Exclude personal and announcement events
        other_events = tblEvent.objects.exclude(eventCategory__eventCategoryName__iexact='personal').exclude(isAnnouncement=True).exclude(status__name__iexact='cancelled').exclude(status__name__iexact='draft').exclude(status__name__iexact='postponed').exclude(status__name__iexact='disapproved')
        # Call helper function to create time slots
        available_slots = self.create_time_slots(other_events)
        return Response(available_slots, status=status.HTTP_200_OK)

    def create_time_slots(self, events):
        available_slots = []
        
        for event in events:
            start_date = event.startDateTime.date()
            end_date = event.endDateTime.date()
            start_time = event.startDateTime.time()
            end_time = event.endDateTime.time()

            # Serialize additional fields for each event
            participants = [{
                "uuid": p.uuid,
                'id_number': p.id_number,
                "email": p.email, 
                "first_name": p.first_name, 
                "last_name": p.last_name, 
                'designation': p.roles.order_by('rank').first().name if p.roles.order_by('rank').first() else None,
                'rank': p.roles.order_by('rank').first().rank if p.roles.order_by('rank').first() else None,
                'department': p.department.name if p.department else None,
            } for p in event.participants.all()]

            created_by = {
                'email': event.created_by.email,
                'id_number': event.created_by.id_number,
                'first_name': event.created_by.first_name,
                'last_name': event.created_by.last_name,
                'designation': event.created_by.roles.order_by('rank').first().name if event.created_by.roles else None,
                'rank': event.created_by.roles.order_by('rank').first().rank if event.created_by.roles else None,
                'department': event.created_by.department.name if event.created_by.department else None
            }

            departments = [{"id": dept.id, "name": dept.name} for dept in event.department.all()]

            # Special handling for "exam" events with a 1-week buffer
            if event.eventCategory.eventCategoryName.lower() == 'exam':
                exclusion_start = make_aware(datetime.combine(start_date - timedelta(weeks=1), start_time))
                exclusion_end = make_aware(datetime.combine(end_date, end_time))
                
                available_slots.append({
                    "id": event.id,
                    "event": event.eventName,
                    "category": event.eventCategory.eventCategoryName,
                    "eventType": event.eventType.eventTypeName,
                    "departments": departments,
                    "start": exclusion_start,
                    "end": exclusion_end,
                    "setup": event.setup.setupName if event.setup else None,
                    "venueName": event.venue.venueName if event.venue else None,
                    "venueLocation": event.venue.location if event.venue else None,
                    "created_by": created_by,
                    "participants": participants,
                })
                continue  # Skip the normal recurrence processing for this event
            
            # Generate occurrences based on recurrence type for other events
            if event.recurrence_type == 'daily':
                current_date = start_date
                while current_date <= end_date:
                    occurrence_start = make_aware(datetime.combine(current_date, start_time))
                    occurrence_end = make_aware(datetime.combine(current_date, end_time))
                    
                    available_slots.append({
                        "id": event.id,
                        "event": event.eventName,
                        "category": event.eventCategory.eventCategoryName,
                        "eventType": event.eventType.eventTypeName,
                        "departments": departments,
                        "start": occurrence_start,
                        "end": occurrence_end,
                        "setup": event.setup.setupName if event.setup else None,
                        "venueName": event.venue.venueName if event.venue else None,
                        "venueLocation": event.venue.location if event.venue else None,
                        "created_by": created_by,
                        "participants": participants,
                    })
                    
                    current_date += timedelta(days=1)

            elif event.recurrence_type == 'weekly' and event.recurrence_days:
                recurrence_days = [day.lower() for day in event.recurrence_days]
                current_date = start_date
                while current_date <= end_date:
                    if current_date.strftime('%A').lower() in recurrence_days:
                        occurrence_start = make_aware(datetime.combine(current_date, start_time))
                        occurrence_end = make_aware(datetime.combine(current_date, end_time))
                        
                        available_slots.append({
                            "id": event.id,
                            "event": event.eventName,
                            "category": event.eventCategory.eventCategoryName,
                            "eventType": event.eventType.eventTypeName,
                            "departments": departments,
                            "start": occurrence_start,
                            "end": occurrence_end,
                            "setup": event.setup.setupName if event.setup else None,
                            "venueName": event.venue.venueName if event.venue else None,
                            "venueLocation": event.venue.location if event.venue else None,
                            "created_by": created_by,
                            "participants": participants,
                        })
                    
                    current_date += timedelta(days=1)

            elif event.recurrence_type == 'none':
                available_slots.append({
                    "id": event.id,
                    "event": event.eventName,
                    "category": event.eventCategory.eventCategoryName,
                    "eventType": event.eventType.eventTypeName,
                    "departments": departments,
                    "start": event.startDateTime,
                    "end": event.endDateTime,
                    "setup": event.setup.setupName if event.setup else None,
                    "venueName": event.venue.venueName if event.venue else None,
                    "venueLocation": event.venue.location if event.venue else None,
                    "created_by": created_by,
                    "participants": participants,
                })

        return available_slots

    
class UnavalaibleSlotPersonalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Get events only from the personal category
        personal_events = tblEvent.objects.filter(
            eventCategory__eventCategoryName__iexact='personal'
        ).exclude(isAnnouncement=True).exclude(status__name__iexact='cancelled').exclude(status__name__iexact='draft').exclude(status__name__iexact='postponed').exclude(status__name__iexact='disapproved')
        
        # Call helper function to create time slots
        available_slots = self.create_time_slots(personal_events)
        return Response(available_slots, status=status.HTTP_200_OK)

    def create_time_slots(self, events):
        available_slots = []
        
        for event in events:
            start_date = event.startDateTime.date()
            end_date = event.endDateTime.date()
            start_time = event.startDateTime.time()
            end_time = event.endDateTime.time()

            # Serialize participant details
            participants = [{
                "uuid": p.uuid,
                'id_number': p.id_number,
                "email": p.email, 
                "first_name": p.first_name, 
                "last_name": p.last_name, 
                'designation': p.role.name if p.role else None,
                'rank': p.role.rank if p.role else None,
                'department': p.department.name if p.department else None,
            } for p in event.participants.all()]

            # Serialize the 'created_by' field (CustomUser instance)
            created_by = {
                'email': event.created_by.email,
                'id_number': event.created_by.id_number,
                'first_name': event.created_by.first_name,
                'last_name': event.created_by.last_name,
                'designation': event.created_by.roles.order_by('rank').first().name if event.created_by.roles else None,
                'rank': event.created_by.roles.order_by('rank').first().rank if event.created_by.roles else None,
                'department': event.created_by.department.name if event.created_by.department else None
            }

            # Handle recurrence for personal events
            if event.recurrence_type == 'daily':
                current_date = start_date
                while current_date <= end_date:
                    occurrence_start = make_aware(datetime.combine(current_date, start_time))
                    occurrence_end = make_aware(datetime.combine(current_date, end_time))
                    
                    available_slots.append({
                        "id": event.id,
                        "event": event.eventName,
                        "category": event.eventCategory.eventCategoryName,
                        "eventType": event.eventType.eventTypeName,
                        "start": occurrence_start,
                        "end": occurrence_end,
                        "setup": event.setup.setupName if event.setup else None,
                        "venueName": event.venue.venueName if event.venue else None,
                        "venueLocation": event.venue.location if event.venue else None,
                        "created_by": created_by,
                        "participants": participants,
                    })
                    
                    current_date += timedelta(days=1)

            elif event.recurrence_type == 'weekly' and event.recurrence_days:
                recurrence_days = [day.lower() for day in event.recurrence_days]
                current_date = start_date
                while current_date <= end_date:
                    if current_date.strftime('%A').lower() in recurrence_days:
                        occurrence_start = make_aware(datetime.combine(current_date, start_time))
                        occurrence_end = make_aware(datetime.combine(current_date, end_time))
                        
                        available_slots.append({
                            "id": event.id,
                            "event": event.eventName,
                            "category": event.eventCategory.eventCategoryName,
                            "eventType": event.eventType.eventTypeName,
                            "start": occurrence_start,
                            "end": occurrence_end,
                            "setup": event.setup.setupName if event.setup else None,
                            "venueName": event.venue.venueName if event.venue else None,
                            "venueLocation": event.venue.location if event.venue else None,
                            "created_by": created_by,
                            "participants": participants,
                        })
                    
                    current_date += timedelta(days=1)

            elif event.recurrence_type == 'none':
                available_slots.append({
                    "id": event.id,
                    "event": event.eventName,
                    "category": event.eventCategory.eventCategoryName,
                    "eventType": event.eventType.eventTypeName,
                    "start": event.startDateTime,
                    "end": event.endDateTime,
                    "setup": event.setup.setupName if event.setup else None,
                    "venueName": event.venue.venueName if event.venue else None,
                    "venueLocation": event.venue.location if event.venue else None,
                    "created_by": created_by,
                    "participants": participants,
                })

        return available_slots
    

class FacultyEventsListView(ListAPIView):
    serializer_class = FacultyEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Annotate each user with the highest rank from their roles
        queryset = User.objects.filter(is_active=True)
        
        queryset = queryset.prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        ).annotate(
            highest_rank=Min('roles__rank')  # Get the highest rank from their roles
        )

        # Only include users with the highest rank (you can change this condition based on your needs)
        return queryset.filter(roles__rank=F('highest_rank')).filter(is_active=True)
    
class FacultyEventsDetailView(RetrieveAPIView):
    serializer_class = FacultyEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Annotate each user with the highest rank from their roles
        queryset = User.objects.filter(is_active=True)
        
        queryset = queryset.prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        ).annotate(
            highest_rank=Min('roles__rank')  # Get the highest rank from their roles
        )

        # Only include users with the highest rank (you can change this condition based on your needs)
        return queryset.filter(roles__rank=F('highest_rank')).filter(is_active=True)
    
    def get_object(self):
        uuid = self.kwargs.get("uuid")
        return get_object_or_404(User, uuid=uuid)
    
# class FacultyEventsDetailView(RetrieveAPIView):
#     serializer_class = FacultyEventSerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]

#     def get_queryset(self):
#         # This method should return the user related to the provided UUID
#         # No need to filter by roles or ranks here; just return all users with related events
#         return User.objects.all().prefetch_related(
#             'event_participants',  # Events they participate in
#             'event_createdby'      # Events they created
#         )

#     def get_object(self):
#         # Get the user by UUID from the URL parameters
#         uuid = self.kwargs.get("uuid")
#         # Use get_object_or_404 to ensure the user exists or a 404 error is raised if not
#         return get_object_or_404(User, uuid=uuid)    
    
class UserEventsListView(ListAPIView):
    serializer_class = UserEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get all faculty members and their events, both created and participated
        return User.objects.filter(uuid=user.uuid).prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        )
    
class UserEventsDetailView(RetrieveAPIView):
    serializer_class = UserEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        # Get all faculty members and their events, both created and participated
        return User.objects.filter(uuid=user.uuid).prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        )

class AllRoleEventsListView(ListAPIView):
    serializer_class = AllRoleEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Annotate each user with the highest rank from their roles
        queryset = User.objects.filter(is_staff=False)
        
        queryset = queryset.prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        ).annotate(
            highest_rank=Min('roles__rank')  # Get the highest rank from their roles
        )

        # Order by the highest rank
        return queryset.filter(roles__rank=F('highest_rank')).order_by('highest_rank')
    
class AllRoleEventsDetailView(RetrieveAPIView):
    serializer_class = AllRoleEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Annotate each user with the highest rank from their roles
        queryset = User.objects.filter(is_staff=False)
        
        queryset = queryset.prefetch_related(
            'event_participants',  # Events they participate in
            'event_createdby'      # Events they created
        ).annotate(
            highest_rank=Min('roles__rank')  # Get the highest rank from their roles
        )

        # Order by the highest rank
        return queryset.filter(roles__rank=F('highest_rank')).order_by('highest_rank')
    
class AnnouncementListView(ListAPIView):
    serializer_class = tblEventSerializer

    def get_queryset(self):
        today = timezone.now().date()
        seven_days_from_now = today + timezone.timedelta(days=7)
        
        return tblEvent.objects.filter(
            isAnnouncement=True,
            # Check if the event falls within the date range based on both startDateTime and endDateTime
            startDateTime__date__lte=seven_days_from_now,
            endDateTime__date__gte=today
        ).exclude(eventCategory__eventCategoryName__iexact='personal').order_by('startDateTime')
    
class ApproveDocumentsListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApproveDocumentsSerializer

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name

        # Base query to exclude empty or null approveDocuments
        queryset = tblEvent.objects.exclude(approveDocuments__isnull=True).exclude(approveDocuments='').exclude(status__name__iexact='draft').exclude(status__name__iexact='disapproved')

        # Admin and Dean roles: Access all approveDocuments
        if user_role == 'Admin':
            return queryset
        
        elif user_role == 'Dean':
            return queryset.exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        # Chairperson and Faculty: Filter by user's department and participants
        elif user_role in ['Chairperson', 'Faculty']:
            return queryset.filter(
                Q(department=user.department) | 
                Q(participants__in=[user]) 
            ).exclude(created_by__role__name__in=['Mother Org', 'Unit Org'])

        # Student: Filter by user's department and if they are a participant
        elif user_role == 'Student':
            return queryset.filter(
                Q(department=user.department) & 
                Q(participants__in=[user])
            )

        # Mother Org: Filter by created_by for unit org or mother org
        elif user_role == 'Mother Org':
            return queryset.filter(
                created_by__role__name__in=['Mother Org', 'Unit Org']
            )

        # Unit Org: Filter by user's department and created_by as mother org
        elif user_role == 'Unit Org':
            return queryset.filter(
                (Q(department=user.department) & Q(created_by__role__name__in=['Mother Org', 'Unit Org'])) |
                Q(created_by__role__name='Mother Org')
            )

        # Default to an empty queryset if role is not covered
        return tblEvent.objects.none()
    
# Audit
class LogEntryViewSet(ListAPIView):
    queryset = LogEntry.objects.all().order_by('-timestamp')  # Sort by most recent entries
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

class LogEntryEvents(ListAPIView):
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Use `has_key` to ensure only entries with a `status` key in `changes` are returned
        return LogEntry.objects.filter(changes__has_key="startDateTime").filter(action=1).order_by('-timestamp')
class LogEntryAllEvents(ListAPIView):
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get the content type for the tblEvent model
        event_content_type = ContentType.objects.get_for_model(tblEvent)
        
        # Filter LogEntry objects by content type and 'status' in changes
        return LogEntry.objects.filter(
            content_type=event_content_type,
            action=1
        ).order_by('-timestamp')

class LogEntryAllEventsDateChanges(ListAPIView):
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get the content type for the tblEvent model
        event_content_type = ContentType.objects.get_for_model(tblEvent)

        # Filter LogEntry objects by content type and changes related to startDateTime or endDateTime
        return LogEntry.objects.filter(
            content_type=event_content_type,
            action=1
        ).filter(
            Q(changes__has_key="startDateTime") | Q(changes__has_key="endDateTime")
        ).order_by('-timestamp')

class FilteredEventsByCurrentSemesterView(ListAPIView):
    serializer_class = tblEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_role = user.roles.order_by('rank').first().name
        today = date.today()

        # Get the current semester based on today's date
        current_semester = tblSemester.objects.filter(
            startDate__lte=today,
            endDate__gte=today
        ).first()

        # Base query for archived events (events before the current semester)
        if current_semester:
            archived_events = tblEvent.objects.filter(
                endDateTime__date__lt=current_semester.startDate
            )
        else:
            archived_events = tblEvent.objects.all()

        # Filter out personal events not created by the user
        archived_events = archived_events.exclude(
            eventCategory__eventCategoryName="Personal"
        ).exclude(
            eventCategory__eventCategoryName="Personal",
            created_by__uuid=user.uuid
        )

        # Apply role-based filtering
        if user_role == "Dean":
            # Dean can see all events except "Personal" not created by them
            return archived_events.distinct()

        elif user_role in ["Chairperson", "Faculty", "Student"]:
            # Chairperson can see events related to their department
            return archived_events.filter(
                department__id=user.department.id
            ).distinct()

        # Default to no events if role doesn't match any condition
        return tblEvent.objects.none()