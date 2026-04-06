from rest_framework.routers import DefaultRouter
from .views import BayanihanGroupViewSet 

router = DefaultRouter()
router.register(r"groups", BayanihanGroupViewSet, basename="bayanihan-groups") 

urlpatterns = router.urls
