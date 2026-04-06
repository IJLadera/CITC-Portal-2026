from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Course, Memo
from notifications.models import Notification
from bayanihan.models import BayanihanGroupUser
from users.models import UserRole

def get_admin_users():
    return UserRole.objects.filter(role__name="ADMIN").select_related("user")

def notify_admins(message, domain, notif_type, target_role=None, link=""):
    for admin in get_admin_users():
        Notification.objects.create(
            recipient=admin.user,
            target_role=target_role,
            message=message,
            domain=domain,
            type=notif_type,
            link=link
        )


@receiver(post_save, sender=Course)
def create_course_notification(sender, instance, created, **kwargs):
    if created:
        print(f"\n📢 Signal fired: New Course created → {instance.course_code} - {instance.course_title}")

        # 🎯 Target audience: Leaders only
        leaders = BayanihanGroupUser.objects.filter(role="LEADER")

        # 🚀 Create notification for each leader
        for leader in leaders:
            Notification.objects.create(
                recipient=leader.user,
                target_role="BAYANIHAN_LEADER",
                message=f"📘 New course '{instance.course_code} - {instance.course_title}' was created.",
                domain="course",
                type="course_new",
                link=""
            )
        
        notify_admins(
            target_role="ADMIN",
            message=f"New course created: {instance.course_code} - {instance.course_title}.",
            domain="course",
            notif_type="course_new",
            link=""
        )

        print(f"✅ Notifications sent → {leaders.count()} leaders.\n")


@receiver(m2m_changed, sender=Memo.recipients.through)
def create_memo_notification(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        print(f"\n📢 Signal fired: Recipients added to Memo → {instance.title}")

        # ✅ Create notifications for each recipient
        for user_id in pk_set:
            Notification.objects.create(
                recipient_id=user_id,
                message=f"📄 New Memo: '{instance.title}' — {instance.description or ''}",
                domain="memo",
                type="memo_new",
                link=f"memos/{instance.id}/"
            )
            print(f"✅ Notification created for user_id={user_id}")

        print("✅ Admin notifications sent.\n")

        