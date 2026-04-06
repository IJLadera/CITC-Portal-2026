from django.shortcuts import render
from rest_framework.generics import CreateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status, serializers
from rest_framework.authtoken.models import Token
from .models import User, Role
from .serializers import CreateUserSerializer, UpdateUserSerializer, ChangePasswordSerializer, CustomUserSerializer, AdminUserSerializer
from .permissions import IsUserOrIsAdminOrReadOnly
from .syllabease_sync import sync_user_to_syllabease


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['uuid', 'name', 'rank']


class RolesListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users (users with Admin or Chairman role)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has Admin or Chairman role
        admin_roles = request.user.roles.filter(name__in=['Admin', 'Chairman']).exists()
        return admin_roles


class UsersListView(ListCreateAPIView):
    """
    List all users (admin only) or create a new user (admin only)
    GET: Returns list of all users (admin only)
    POST: Create a new user (admin only)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminUserSerializer
        return CustomUserSerializer


class UserDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific user (admin only)
    GET: Retrieve user details
    PUT: Update user
    DELETE: Delete user
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = User.objects.all()
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserSerializer
        return CustomUserSerializer


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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_syllabease_token(request):
    """
    Endpoint for Syllabease2.0 to verify CITC tokens
    Called when a user from CITC Portal tries to access Syllabease2.0
    """
    user = request.user
    
    # Sync user to Syllabease if not already synced
    try:
        sync_user_to_syllabease(user)
    except Exception as e:
        # Log but don't fail the verification
        print(f"Warning: Could not sync user to Syllabease: {str(e)}")
    
    serializer = CustomUserSerializer(user)
    return Response({
        "valid": True,
        "user": serializer.data,
        "token_type": "Token"  # CITC uses token-based auth, different from Syllabease JWT
    })


@api_view(['POST'])
def sync_user_endpoint(request):
    """
    Endpoint for syncing user data from CITC Portal to external systems
    Requires SYLLABEASE_SYNC_TOKEN for authentication
    """
    # Get the sync token from environment
    from django.conf import settings
    import os
    
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    sync_token = os.environ.get('SYLLABEASE_SYNC_TOKEN', '')
    
    if not auth_header.startswith('Bearer ') or sync_token not in auth_header:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user_id = request.data.get('user_id')
    if not user_id:
        return Response(
            {"error": "user_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(uuid=user_id)
        sync_user_to_syllabease(user)
        serializer = CustomUserSerializer(user)
        
        return Response({
            "success": True,
            "message": "User synced successfully",
            "user": serializer.data
        })
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
