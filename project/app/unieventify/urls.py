from django.contrib import admin
from django.urls import path, include
from djoser.views import TokenCreateView
from .views import (
    EventListView, EventInfoView, 
    SetupListView, SetupInfoView, 
    VenueListView, VenueInfoView, 
    StatusListView, StatusInfoView, 
    CollegeListView, CollegeInfoView,
    SectionListView, SectionInfoView, 
    EventLogListView, EventLogInfoView, 
    UserRoleListView, UserRoleInfoView,
    DepartmentListView, DepartmentInfoView, 
    StudentOrgListView, StudentOrgInfoView,
    EventTypeListView, EventTypeInfoView,
    EventCategoryListView, EventCategoryInfoView,
    UserListView, UserInfoView, UserEventListView, UserEventRetrieveView,
    EventStatisticsView, PersonalEventsView, PersonalEventsInfoView,
    CSVUploadView,
    PublicEventsView, PublicEventsInfoView, CollegeDetailView, EventStatisticsCreatedView,
    UserNotificationListView, MarkNotificationAsRead, ApprovalEvent, ApprovalEventsDetails,
    UserCreatedEventsView, UserCreatedEventsInfoView,
    EventStatisticsByCategoryView, DesignationCountView, UnavailablesSlotNonPersonalView, 
    UnavalaibleSlotPersonalView, FacultyEventsListView,
    FacultyEventsDetailView, AllRoleEventsListView, AllRoleEventsDetailView, 
    UserEventsListView, UserEventsDetailView, YearLevelListView, YearLevelInfoView, SchoolYearAndSemesterListView,
    SchoolYearAndSemesterInfoView, SchoolYearInfoView,SchoolYearListView, SemesterInfoView, SemesterListView,
    AnnouncementListView, EventRemarkListView, EventRemarkInfoView, UserCSVUploadView, ApproveDocumentsListView, LogEntryViewSet,LogEntryEvents, LogEntryAllEvents, EventStatisticsByDepartmentView, EventStatisticsCancelledView, FilteredEventsByCurrentSemesterView, LogEntryAllEventsDateChanges
    )



urlpatterns = [

    #sa admin lang siguro ni hehe
    path('users/', UserListView.as_view(), name='user-list'), 
    path('users/<uuid:uuid>/', UserInfoView.as_view(), name='user-edit'), 

    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<int:pk>/', EventInfoView.as_view(), name='event-edit'),

    path('setups/', SetupListView.as_view(), name='setup-list'),
    path('setups/<int:pk>/', SetupInfoView.as_view(), name='setup-edit'),

    path('venues/', VenueListView.as_view(), name='venue-list'),
    path('venues/<int:pk>/', VenueInfoView.as_view(), name='venue-edit'),

    path('status/', StatusListView.as_view(), name='status-list'),
    path('status/<int:pk>/', StatusInfoView.as_view(), name='status-edit'),

    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('colleges/<int:pk>/', CollegeInfoView.as_view(), name='college-edit'),

    path('sections/', SectionListView.as_view(), name='section-list'),
    path('sections/<int:pk>/', SectionInfoView.as_view(), name='section-edit'),
    
    path('eventlogs/', EventLogListView.as_view(), name='event-log-list'),
    path('eventlogs/<int:pk>/', EventLogInfoView.as_view(), name='event-log-edit'),

    path('userroles/', UserRoleListView.as_view(), name='user-role-list'),
    path('userroles/<uuid:uuid>/', UserRoleInfoView.as_view(), name='user-role-edit'),
    
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('departments/<int:pk>/', DepartmentInfoView.as_view(), name='department-edit'),

    path('studentorgs/', StudentOrgListView.as_view(), name='student-org-list'),
    path('studentorgs/<int:pk>/', StudentOrgInfoView.as_view(), name='student-org-edit'),
    
    path('eventtypes/', EventTypeListView.as_view(), name='event-category-list'),
    path('eventtypes/<int:pk>/', EventTypeInfoView.as_view(), name='event-category-edit'),

    path('eventcategories/', EventCategoryListView.as_view(), name='event-category-list'),
    path('eventcategories/<int:pk>/', EventCategoryInfoView.as_view(), name='event-category-edit'),

    path('yearlevel/', YearLevelListView.as_view(), name='event-year-level-list'),
    path('yearlevel/<int:pk>/', YearLevelInfoView.as_view(), name='event-year-level-edit'),

    path('schoolyearandsemester/', SchoolYearAndSemesterListView.as_view(), name='schoolyear-semester-list'),
    path('schoolyearandsemester/<int:pk>/', SchoolYearAndSemesterInfoView.as_view(), name='schoolyear-semester-edit'),

    path('schoolyear/', SchoolYearListView.as_view(), name='schoolyear-list'),
    path('schoolyear/<int:pk>/', SchoolYearInfoView.as_view(), name='schoolyear-edit'),

    path('semester/', SemesterListView.as_view(), name='semester-list'),
    path('semester/<int:pk>/', SemesterInfoView.as_view(), name='semester-edit'),

    path('eventremark/', EventRemarkListView.as_view(), name='remark-list'),
    path('eventremark/<int:pk>/', EventRemarkInfoView.as_view(), name='remark-edit'),

    # API for Filtered Functionality

    path('userevents/', UserEventsListView.as_view(), name='user-created-events'),
    path('userevents/<int:pk>/', UserEventsDetailView.as_view(), name='user-created-events-edit'),


    path('participatedevents/', UserEventListView.as_view(), name='participated-event-list'),
    path('participatedevents/<int:pk>/', UserEventRetrieveView.as_view(), name='participated-event'),

    path('events/statistics/', EventStatisticsView.as_view(), name='event-statistics'),
    
    path('events/statistics/created', EventStatisticsCreatedView.as_view(), name='event-statistics-created'),

    path('events/statistics/cancelled', EventStatisticsCancelledView.as_view(), name='event-statistics-cancelled'),

    #designation count
    path('designation-count/', DesignationCountView.as_view(), name='designation_count'),

    path('events/statistics/byCategories', EventStatisticsByCategoryView.as_view(), name='event-statistics-by-category'),

    path('events/statistics/byDepartment', EventStatisticsByDepartmentView.as_view(), name='event-statistics-by-Department'),

    path('events/personal/', PersonalEventsView.as_view(), name='event-personal'),
    path('events/personal/<int:pk>/', PersonalEventsInfoView.as_view(), name='event-personal-Info'),

    path('upload-csv/', CSVUploadView.as_view(), name='upload-csv'),
    path('upload-user/', UserCSVUploadView.as_view(), name='upload-user'),

    # path('upload/', ImageUploadView.as_view(), name='image-upload'),

    path('public-events/', PublicEventsView.as_view(), name='public-events'),
    path('public-events/<int:pk>/', PublicEventsInfoView.as_view(), name='public-events-info'),

    path('departmentsbycollege/', CollegeDetailView.as_view(), name='college-detail'),

    path('notifications/', UserNotificationListView.as_view(), name='event-notificatons'),
    path('notifications/<int:pk>/', MarkNotificationAsRead.as_view(), name='event-notificatons-details'),

    path('approvalevents/', ApprovalEvent.as_view(), name='event-approval'),
    path('approvalevents/<int:pk>/', ApprovalEventsDetails.as_view(), name='event-approval'),

    path('unavail-slots/personal', UnavalaibleSlotPersonalView.as_view(), name='school-year-available-slots'),
    path('unavail-slots/nonpersonal', UnavailablesSlotNonPersonalView.as_view(), name='school-year-available-slots'),

    path('faculty/events', FacultyEventsListView.as_view(), name='faculty-events'),
    path('faculty/events/<uuid:uuid>', FacultyEventsDetailView.as_view(), name='faculty-events'),
    
    path('roles/events', AllRoleEventsListView.as_view(), name='role-events'),
    path('roles/events/<int:pk>', AllRoleEventsDetailView.as_view(), name='role-events'),

    path('announcement/', AnnouncementListView.as_view(), name='announcement'),
    path('documents/', ApproveDocumentsListView.as_view(), name='documents'),

    # Audit
    path('auditlogs/', LogEntryViewSet.as_view(), name='auditlog-list'),
    path('auditlogstatuschange/', LogEntryEvents.as_view(), name='auditlog-list-status-change'),
    path('auditlogeventchange/', LogEntryAllEvents.as_view(), name='auditlog-list-event-change'),
    path('auditlogdatechange/', LogEntryAllEventsDateChanges.as_view(), name='auditlog-list-date-change'),

    path('timeline/', FilteredEventsByCurrentSemesterView.as_view(), name='timeline'),
]