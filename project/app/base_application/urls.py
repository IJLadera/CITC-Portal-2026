from django.urls import re_path
from .views import BaseApplication

urlpatterns = [
    re_path(r'.*', BaseApplication.as_view(), name='BaseApplication'),
]
