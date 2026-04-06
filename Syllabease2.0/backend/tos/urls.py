from rest_framework.routers import DefaultRouter
from .views import TOSViewSet, TOSCommentViewSet, TOSTemplateViewSet

router = DefaultRouter() 
router.register(r"tos", TOSViewSet, basename="tos") 
router.register(r"tos-comments", TOSCommentViewSet, basename="tos-comments") 
router.register(r"tos-templates", TOSTemplateViewSet, basename="tos-templates") 

urlpatterns = router.urls