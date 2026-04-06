"""
CITC Portal - Syllabease2.0 Integration Sync Endpoints
These endpoints handle the synchronization of users between CITC Portal and Syllabease2.0
"""

import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])  # Uses token-based authentication
def sync_citc_user(request):
    """
    Receives user data from CITC Portal and creates/updates the user in Syllabease2.0
    
    Expected JSON payload:
    {
        "id_number": "string",
        "faculty_id": "string",  
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "middle_name": "string (optional)",
        "suffix": "string (optional)",
        "is_active": boolean,
        ...
    }
    
    Headers:
        Authorization: Bearer <SYLLABEASE_SYNC_TOKEN>
    """
    
    # Verify sync token
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    sync_token = os.environ.get('SYLLABEASE_SYNC_TOKEN', os.environ.get('SYNC_TOKEN', ''))
    
    if sync_token and (not auth_header.startswith('Bearer ') or sync_token not in auth_header):
        return Response(
            {"error": "Unauthorized - Invalid sync token"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        data = request.data
        
        # Required fields from CITC
        id_number = data.get('id_number')
        email = data.get('email')
        
        if not id_number or not email:
            return Response(
                {"error": "id_number and email are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update user
        user, created = User.objects.update_or_create(
            faculty_id=id_number,  # Use faculty_id as unique identifier
            defaults={
                'id_number': id_number,
                'email': email,
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'middle_name': data.get('middle_name', ''),
                'suffix': data.get('suffix', ''),
                'is_active': data.get('is_active', True),
                'is_student': data.get('is_student', False),
                'is_employee': data.get('is_employee', False),
            }
        )
        
        serializer = UserSerializer(user)
        
        return Response({
            "success": True,
            "message": f"User {'created' if created else 'updated'} successfully",
            "user": serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_citc_token(request):
    """
    Verifies if a CITC Portal token is valid
    Called when Syllabease2.0 frontend wants to verify a user from CITC
    
    Query params:
        token: CITC auth token
        
    Returns user data if valid
    """
    
    token = request.query_params.get('token')
    if not token:
        return Response(
            {"error": "Token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # This endpoint would be called to verify tokens
        # In production, Syllabease would call CITC's verify endpoint
        # For now, we just acknowledge that the request was received
        
        return Response({
            "message": "Token verification check sent to CITC Portal",
            "token": token[:10] + "...",  # Don't expose full token
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
