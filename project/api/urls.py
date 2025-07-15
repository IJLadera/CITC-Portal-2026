from django.urls import path, include


urlpatterns = [
    path('auth/', include('app.users.urls')),
    path('lms/', include('app.lms.urls')),
    path('unieventify/', include('app.unieventify.urls')),
]
