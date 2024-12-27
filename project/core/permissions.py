from rest_framework import permissions

class TeachersPermission(permissions.BasePermission):
    message = 'You are not a Teacher'

    def has_permission(self, request, view):
        return not request.user.is_student