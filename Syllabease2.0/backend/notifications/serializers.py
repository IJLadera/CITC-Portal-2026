from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "message",
            "domain",
            "type",
            "link",
            "target_role",
            "created_at",
            "is_read",
            "recipient",
        ]

