from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils.timezone import now

from bayanihan.models import BayanihanGroupUser
from notifications.models import Notification
from users.models import UserRole

def get_admin_users():
    return UserRole.objects.filter(role__name="ADMIN").select_related("user")

def notify_admins(message, domain, notif_type, target_role=None, link=""):
    for admin in get_admin_users():
        Notification.objects.create(
            recipient=admin.user,
            domain=domain,
            type=notif_type,
            target_role=target_role,
            message=message,
            link=link
        )


def format_group_display(group):
    """Safely format group name even if group was deleted."""
    if not group:
        return "Deleted Group"

    course = getattr(group, "course", None)
    title = getattr(course, "course_title", "Unknown Course")
    sy = getattr(group, "school_year", "Unknown SY")

    return f"{title}, SY {sy}"

def map_group_role_to_user_role(role):
    role = role.upper()
    if role == "LEADER":
        return "BAYANIHAN_LEADER"
    if role == "TEACHER":
        return "BAYANIHAN_TEACHER"
    return None


@receiver(post_save, sender=BayanihanGroupUser)
def notify_user_added_to_group(sender, instance, created, **kwargs):
    if not created:
        return

    role = instance.role.capitalize()
    target_role = map_group_role_to_user_role(instance.role)
    group_display = format_group_display(instance.group)

    # 🔹 User Notification
    if role.upper() == "LEADER":
        Notification.objects.create(
            recipient=instance.user,
            domain="group",
            type="group_assignment",
            target_role=target_role,  # e.g., BAYANIHAN_LEADER/BAYANIHAN_TEACHER
            message=f"You have been assigned as {role} in Bayanihan Group ({group_display}).",
            link=f"/bayanihan_leader/team"
        )
        
    elif role.upper() == "TEACHER":
        Notification.objects.create(
            recipient=instance.user,
            domain="group",
            type="group_assignment",
            target_role=target_role,  # e.g., BAYANIHAN_LEADER/BAYANIHAN_TEACHER
            message=f"You have been assigned as {role} in Bayanihan Group ({group_display}).",
            link=f"/bayanihan_teacher/team"
        )

    # 🔹 Admin Notification
    notify_admins(
        f"{instance.user.get_full_name()} was assigned as {role} in Bayanihan Group ({group_display}).",
        domain="group",
        notif_type="group_assignment",
        target_role="ADMIN",
        link=f"/admin/bayanihan"
    )


@receiver(post_delete, sender=BayanihanGroupUser)
def notify_user_removed_from_group(sender, instance, **kwargs):
    role = instance.role.capitalize()
    target_role = map_group_role_to_user_role(instance.role)
    group_display = format_group_display(instance.group)

    # 🔹 User Notification  
    if role.upper() == "LEADER": 
        Notification.objects.create(
            recipient=instance.user,
            domain="group",
            type="group_assignment",
            target_role=target_role,
            message=f"You have been removed as {role} from Bayanihan Group ({group_display}).",
            link="/bayanihan_leader/team"
        )
        
    elif role.upper() == "TEACHER":
        Notification.objects.create(
            recipient=instance.user,
            domain="group",
            type="group_assignment",
            target_role=target_role,
            message=f"You have been removed as {role} from Bayanihan Group ({group_display}).",
            link="/bayanihan_teacher/team"
        )

    # 🔹 Admin Notification
    notify_admins(
        target_role="ADMIN",
        message=f"{instance.user.get_full_name()} was removed as {role} from Bayanihan Group ({group_display}).",
        domain="group",
        notif_type="group_assignment",
        link="/admin/bayanihan"
    )
