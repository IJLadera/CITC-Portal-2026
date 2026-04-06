from django.contrib import admin
from .models import Notification
 
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "message", "type", "created_at", "is_read", "link")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("recipient__username", "recipient__email", "message")
    ordering = ("-created_at",)

    # ✅ Ensure all NOTIF_TYPES always appear in the dropdown
    # def formfield_for_choice_field(self, db_field, request, **kwargs):
    #     if db_field.name == "type":
    #         kwargs["choices"] = Notification.type
    #     return super().formfield_for_choice_field(db_field, request, **kwargs)
