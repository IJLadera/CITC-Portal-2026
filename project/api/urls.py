from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('auth/', include('app.users.urls')),
    path('lms/', include('app.lms.urls')),
    path('unieventify/', include('app.unieventify.urls')),
]
