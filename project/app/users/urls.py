from django.urls import path, include
from .views import UpdateProfileView, ChangePasswordView

urlpatterns = [
    path('', include('djoser.urls')),
    path('', include('djoser.urls.authtoken')),

    path('update_profile/', UpdateProfileView.as_view(), name='auth_update_profile'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),

]
