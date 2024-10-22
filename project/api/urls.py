from django.urls import path, include

urlpatterns = [
    path('auth/', include('app.users.urls')),
]
