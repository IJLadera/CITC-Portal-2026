from django.urls import path
from .views import (
    YearLevelListAPIView,
    SchoolYearListAPIView,
    SectionListAPIView,
    SubjectListAPIView,
    ClassListAPIView, 
    DepartmentListAPIView,
    AttendanceCreateAPIView,
    AttendanceUpdateAPIView,
    AttendanceClassListAPIView,
    StudentClassListAPIView,
    ExportPunctualityAPIView,
    ClassUpdateAPIView
)


urlpatterns = [
    path('department', DepartmentListAPIView.as_view(), name='department'),
    path('year-level', YearLevelListAPIView.as_view(), name="year-level"),
    path('school-year', SchoolYearListAPIView.as_view(), name="school-year"),
    path('sections', SectionListAPIView.as_view(), name='section'),
    path('subjects', SubjectListAPIView.as_view(), name="subjects"),
    path('', ClassListAPIView.as_view(), name="classes"),
    path('<int:pk>/', ClassUpdateAPIView.as_view(), name='class-update'),
    path('attendance/', AttendanceCreateAPIView.as_view(), name='attendance-create'),
    path('attendance/<int:pk>/', AttendanceUpdateAPIView.as_view(), name='update-attendance'),
    path('attendance-list/<int:id>/', AttendanceClassListAPIView.as_view(), name='attendance-class-list'),
    path('student-list/', StudentClassListAPIView.as_view(), name='student-class-list'),
    path('export/class/', ExportPunctualityAPIView.as_view(), name='export-punctuality'),
]
