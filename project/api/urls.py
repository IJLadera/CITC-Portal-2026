from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from app.lms.views import UploadFileAPIView


urlpatterns = [
    path('auth/', include('app.users.urls')),
    path('lms/', include('app.lms.urls')),
    path('unieventify/', include('app.unieventify.urls')),
    path('upload/', UploadFileAPIView.as_view(), name="api-upload-file")
]
