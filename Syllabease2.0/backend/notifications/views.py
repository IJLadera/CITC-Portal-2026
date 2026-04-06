from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from bayanihan.models import BayanihanGroupUser
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)

        domain = self.request.GET.get("domain")
        role = self.request.GET.get("role")
        if domain:
            qs = qs.filter(domain=domain)
        if role:
            qs = qs.filter(target_role=role)
            
        return qs.order_by("-created_at")
 
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            if not notif.is_read:
                notif.is_read = True
                notif.save()
            return Response({"message": "Notification marked as read.", "id": notif.id}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
 
    @action(detail=False, methods=["get"])
    def count(self, request):
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": unread_count})
