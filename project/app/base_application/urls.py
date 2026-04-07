from django.urls import re_path, path
from .views import BaseApplication, AppListView, AppDetailView

api_urlpatterns = [
    path('apps/', AppListView.as_view(), name='app-list'),
    path('apps/<uuid:uuid>/', AppDetailView.as_view(), name='app-detail'),
]

urlpatterns = [
    re_path(r'.*', BaseApplication.as_view(), name='BaseApplication'),
]

