from django.db import models
from django.conf import settings
from users.models import User

class Notification(models.Model):
    # 🔹 Domain: what the notification is about (NOT the event type)
    DOMAIN_CHOICES = [
        ("syllabus", "Syllabus"),
        ("tos", "Table of Specifications"),
        ("memo", "Memo"),
        ("group", "Bayanihan Group"),
        ("role", "Role Assignment"),
        ("deadline", "Deadline"),
        ("system", "System Message"),
    ]

    # 🔹 Sub-type: optional specific event (approval, returned, etc.)
    NOTIF_TYPE = [
        ("syllabus_review", "Syllabus Needs Review"),
        ("syllabus_approval", "Syllabus Needs Approval"),
        ("syllabus_returned", "Syllabus Returned"),
        ("syllabus_approved", "Syllabus Approved"),
 
        ("tos_review", "TOS Needs Review"),
        ("tos_returned", "TOS Returned"),
        ("tos_approved", "TOS Approved"),
        
        ("role_assigned", "New Role Assigned"),
        ("group_assignment", "Bayanihan Group Assignment"),
        ("course_new", "New Course"),
        ("memo_new", "New Memo"),
        ("deadline_reminder", "Deadline Reminder"),
    ] 

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    ) 
    # 🔥 Which ROLE this notification is for (important)
    target_role = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Role of the user that should receive this notification"
    )
    
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, null=True, blank=True)
    type = models.CharField(max_length=50, choices=NOTIF_TYPE, null=True, blank=True)
    
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.recipient.username}: {self.message[:30]}"
