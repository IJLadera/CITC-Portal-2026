from django.urls import path, include
from app.base_application.urls import api_urlpatterns as base_app_urls


urlpatterns = [
    path('auth/', include('app.users.urls')),
    path('lms/', include('app.lms.urls')),
    path('unieventify/', include('app.unieventify.urls')),
    path('', include(base_app_urls)),
]
