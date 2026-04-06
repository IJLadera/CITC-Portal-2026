from django.urls import path, include
from .views import (
    UpdateProfileView, 
    ChangePasswordView, 
    verify_syllabease_token,
    sync_user_endpoint
)

urlpatterns = [
    path('', include('djoser.urls')),
    path('', include('djoser.urls.authtoken')),

    path('update_profile/', UpdateProfileView.as_view(), name='auth_update_profile'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    
    # Syllabease2.0 integration endpoints
    path('verify-syllabease-token/', verify_syllabease_token, name='verify_syllabease_token'),
    path('sync-user/', sync_user_endpoint, name='sync_user'),

]
