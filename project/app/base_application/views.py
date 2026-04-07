from django.shortcuts import render
from django.views import generic
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework import permissions
from .models import App
from .serializers import AppSerializer
from app.users.permissions import IsAdminOrReadOnly


class BaseApplication(generic.TemplateView):
    template_name = 'index.html'


class AppListView(ListCreateAPIView):
    queryset = App.objects.filter(is_active=True)
    serializer_class = AppSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # If admin, show all apps; if user, show only visible apps
        if self.request.user and (self.request.user.is_staff or self.is_admin()):
            return App.objects.all()
        return App.objects.filter(is_active=True, is_visible_to_users=True)

    def is_admin(self):
        # Check if user has Admin role
        if hasattr(self.request.user, 'roles'):
            return self.request.user.roles.filter(name='Admin').exists()
        return False

    def perform_create(self, serializer):
        # Only admins can create apps
        if self.request.user.is_staff or self.is_admin():
            serializer.save()
        else:
            raise permissions.PermissionDenied("Only admins can create apps")


class AppDetailView(RetrieveUpdateDestroyAPIView):
    queryset = App.objects.all()
    serializer_class = AppSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    lookup_field = 'uuid'

    def is_admin(self):
        # Check if user has Admin role
        if hasattr(self.request.user, 'roles'):
            return self.request.user.roles.filter(name='Admin').exists()
        return False

    def get_queryset(self):
        # If admin, show all apps; if user, show only visible apps
        if self.request.user and (self.request.user.is_staff or self.is_admin()):
            return App.objects.all()
        return App.objects.filter(is_active=True, is_visible_to_users=True)

