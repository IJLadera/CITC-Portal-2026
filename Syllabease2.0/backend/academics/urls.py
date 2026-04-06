# academics/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    MemoViewSet,
    CollegeViewSet, DepartmentViewSet, 
    ProgramViewSet, CurriculumViewSet, 
    CourseViewSet, ProgramOutcomeViewSet, 
    PEOViewSet
)
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'colleges', CollegeViewSet, basename='colleges')
router.register(r'departments', DepartmentViewSet, basename='departments')
router.register(r'programs', ProgramViewSet, basename='programs')
router.register(r'curricula', CurriculumViewSet, basename='curricula')
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'program-outcomes', ProgramOutcomeViewSet, basename='program-outcomes')
router.register(r'peos', PEOViewSet, basename='peos')
router.register(r'memos', MemoViewSet, basename='memos')  # ✅ include memos here

urlpatterns = [
    path('', include(router.urls)),
]
