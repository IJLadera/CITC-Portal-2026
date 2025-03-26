from django.shortcuts import render
from rest_framework.generics import CreateAPIView, UpdateAPIView
from rest_framework import permissions
from .models import User
from .serializers import CreateUserSerializer, UpdateUserSerializer, ChangePasswordSerializer
from .permissions import IsUserOrIsAdminOrReadOnly

class UpdateProfileView(UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsUserOrIsAdminOrReadOnly]
    serializer_class = UpdateUserSerializer

    def get_object(self):
        return self.request.user  # Get the authenticated user

class ChangePasswordView(UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsUserOrIsAdminOrReadOnly]
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user  # Get the authenticated user
