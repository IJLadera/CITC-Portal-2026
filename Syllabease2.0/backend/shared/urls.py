from rest_framework.routers import DefaultRouter
from .views import DeadlineViewSet, ReportViewSet, TOSReportViewSet

router = DefaultRouter()
router.register(r'deadlines', DeadlineViewSet, basename='deadlines') 
router.register(r'reports', ReportViewSet, basename='reports') 
router.register(r'tos-reports', TOSReportViewSet, basename='tos-reports') 

urlpatterns = router.urls