from rest_framework import permissions

# ✅ Flexible role-based permission
def RolePermission(*roles):
    class RolePermissionClass(permissions.BasePermission):
        def has_permission(self, request, view):
            return (
                request.user.is_authenticated and 
                request.user.user_roles.filter(role__name__in=roles).exists()
            )
    return RolePermissionClass
     

