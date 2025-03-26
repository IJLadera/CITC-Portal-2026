from rest_framework import permissions

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authenticated users to have full access,
    and unauthenticated users to have read-only access.
    """

    def has_permission(self, request, view):
        # Check if the request method is safe (GET, HEAD, OPTIONS)
        # or if the user is authenticated
        return request.method in permissions.SAFE_METHODS or request.user and request.user.is_authenticated

class IsOwnerOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user
    
class IsOwnerOrIsAdminOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or obj.created_by == request.user
    
class IsUserOrIsAdminOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or obj == request.user
    
class IsUserOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user
    
class IsNotificationOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
    
class IsAdminOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
    
class RoleHierarchyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.created_by == request.user:
            return True

        return request.user.can_override(obj.created_by)
    
class IsDeanOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow deans to modify objects.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        highest_role = request.user.get_highest_rank_role()
        return highest_role and highest_role.name == 'Dean'

    def has_object_permission(self, request, view, obj):
        # Allow read-only access for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        highest_role = request.user.get_highest_rank_role()
        return highest_role and highest_role.name == 'Dean'
    