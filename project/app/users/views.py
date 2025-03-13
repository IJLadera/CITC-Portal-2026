from django.shortcuts import render
from rest_framework.generics import CreateAPIView, UpdateAPIView
from rest_framework import permissions
from .models import User
from .serializers import CreateUserSerializer, UpdateUserSerializer, ChangePasswordSerializer
from .permissions import IsUserOrIsAdminOrReadOnly

class UpdateProfileView(UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsUserOrIsAdminOrReadOnly]
    serializer_class = UpdateUserSerializer

class ChangePasswordView(UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsUserOrIsAdminOrReadOnly]
    serializer_class = ChangePasswordSerializer
