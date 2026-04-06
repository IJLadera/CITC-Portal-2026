"""
Syllabease2.0 Integration Utilities
This module handles synchronization of users and authentication between CITC Portal and Syllabease2.0
"""

import os
import json
import requests
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

# Configuration
SYLLABEASE_API_URL = os.environ.get("SYLLABEASE_API_URL", "http://localhost:8001")
SYLLABEASE_SYNC_ENDPOINT = f"{SYLLABEASE_API_URL}/api/users/sync/"
SYLLABEASE_AUTH_ENDPOINT = f"{SYLLABEASE_API_URL}/api/auth/verify-token/"

class SyllabeaseSyncError(Exception):
    """Custom exception for Syllabease synchronization errors"""
    pass


def sync_user_to_syllabease(user: User) -> bool:
    """
    Synchronizes a CITC Portal user to Syllabease2.0 database
    
    Args:
        user: CITC Portal User instance
        
    Returns:
        bool: True if sync successful, False otherwise
        
    Raises:
        SyllabeaseSyncError: If sync fails
    """
    try:
        # Prepare user data for Syllabease
        user_data = {
            "id_number": user.id_number,
            "faculty_id": user.id_number,  # Map id_number to faculty_id for Syllabease
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "middle_name": getattr(user, 'middle_name', ''),
            "suffix": getattr(user, 'suffix', ''),
            "is_student": getattr(user, 'is_student', False),
            "is_employee": getattr(user, 'is_employee', False),
            "is_staff": getattr(user, 'is_staff', False),
            "is_active": user.is_active,
            "uuid": str(user.uuid),
        }
        
        # Add optional fields if they exist
        if hasattr(user, 'avatar') and user.avatar:
            user_data['avatar'] = user.avatar.url
            
        # Make request to Syllabease sync endpoint
        # Note: In production, this should be done server-to-server with proper authentication
        response = requests.post(
            SYLLABEASE_SYNC_ENDPOINT,
            json=user_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.environ.get('SYLLABEASE_SYNC_TOKEN', '')}"
            },
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            return True
        else:
            raise SyllabeaseSyncError(
                f"Syllabease sync failed with status {response.status_code}: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        # Log the error but don't fail the login
        print(f"Warning: Could not sync user to Syllabease: {str(e)}")
        return False
    except Exception as e:
        print(f"Error syncing user to Syllabease: {str(e)}")
        return False


def verify_syllabease_token(token: str) -> dict:
    """
    Verifies if a CITC token is valid and returns user information
    Useful if Syllabease needs to verify users logged into CITC
    
    Args:
        token: CITC authentication token
        
    Returns:
        dict: User information if valid, empty dict if invalid
    """
    try:
        # For now, we'll validate locally by checking if the token is in the database
        # In a more sophisticated setup, you'd have a dedicated verification endpoint
        from rest_framework.authtoken.models import Token
        
        try:
            auth_token = Token.objects.get(key=token)
            user = auth_token.user
            
            return {
                "valid": True,
                "user_id": str(user.uuid),
                "email": user.email,
                "id_number": user.id_number,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        except Token.DoesNotExist:
            return {"valid": False}
            
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return {"valid": False}


def create_user_in_syllabease(email: str, id_number: str, first_name: str, last_name: str, password: str = None) -> bool:
    """
    Creates a new user in Syllabease2.0 (for one-way sync from CITC)
    
    Args:
        email: User email
        id_number: CITC user ID
        first_name: First name
        last_name: Last name
        password: Optional password (if not provided, generates a random one)
        
    Returns:
        bool: True if creation successful
    """
    try:
        user_data = {
            "id_number": id_number,
            "faculty_id": id_number,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "password": password or f"temp_{id_number}_{os.urandom(4).hex()}",
        }
        
        response = requests.post(
            f"{SYLLABEASE_API_URL}/api/users/",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        return response.status_code in [200, 201]
        
    except Exception as e:
        print(f"Error creating user in Syllabease: {str(e)}")
        return False
