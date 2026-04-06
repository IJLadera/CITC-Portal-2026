from django.urls import path, include 
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, LogoutView,
    UserViewSet, RoleViewSet, UserRoleViewSet, ProfileViewSet,
    change_password,
    send_password_reset_email,
    reset_password,
    validate_reset_token,
)
from .sync_endpoints import sync_citc_user, verify_citc_token

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'user-roles', UserRoleViewSet, basename='user-role')
router.register(r"profile", ProfileViewSet, basename="profile")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("register/", RegisterView.as_view(), name="register"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"), 
    path("logout/", LogoutView.as_view(), name="logout"),
    path("password-reset/", send_password_reset_email, name="password_reset"),
    path(
        "password-reset/confirm/<uidb64>/<token>/",
        reset_password,
        name="password_reset_confirm"
    ),
    path("password/validate/", validate_reset_token, name="password_validate"),
    path("password/change/", change_password, name="change-password"),
    
    # CITC Portal synchronization endpoints
    path("sync/", sync_citc_user, name="sync_citc_user"),
    path("verify-citc-token/", verify_citc_token, name="verify_citc_token"),

    path("", include(router.urls)), 
]