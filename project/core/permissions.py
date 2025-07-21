from rest_framework import permissions

class TeachersPermission(permissions.BasePermission):
    message = 'You are not a Teacher'

    def has_permission(self, request, view):
        return not request.user.is_student


class BayanihanPermission(permissions.BasePermission):
    message = 'You are not a Bayanihan Leader'

    def has_permission(self, request, view):
        return request.user.is_bayanihan_leader


class RegistrarPermission(permissions.BasePermission):
    message = 'You are not a registrar'

    def has_permission(self, request, view):
        return request.user.is_registrar
