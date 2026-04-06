from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import UserRole
from notifications.models import Notification

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


def get_entity_display(entity_type, entity_id):
    """
    Returns a human-readable name depending on entity_type:
    - Department → Department.name
    - College → College.name
    """

    from academics.models import Department, College  # adjust import paths

    if not entity_type or not entity_id:
        return None

    if entity_type.lower() == "department":
        try:
            dept = Department.objects.get(id=entity_id)
            return f"{dept.department_code}"
        except Department.DoesNotExist:
            return f"Department (ID: {entity_id})"

    if entity_type.lower() == "college":
        try:
            col = College.objects.get(id=entity_id)
            return f"{col.college_code}"
        except College.DoesNotExist:
            return f"College (ID: {entity_id})"

    # fallback
    return f"{entity_type} (ID: {entity_id})"


@receiver(post_save, sender=UserRole)
def create_role_assignment_notification(sender, instance, created, **kwargs):
    """
    Automatically create:
    - a notification for the assigned user
    - separate notifications for ADMIN users
    """
    if not created:
        return

    user = instance.user
    role_name = instance.role.name  # ex: "DEAN", "CHAIRPERSON", "ADMIN"

    # Only Chair/Dean have entity_type + entity_id
    assigned_entity = get_entity_display(instance.entity_type, instance.entity_id) 

    # --- Build the message dynamically ---
    message = f"You have been assigned as {role_name.replace('_', ' ').title()}"

    if assigned_entity:
        message += f" for {assigned_entity}"

    # Format validity dates
    if instance.start_validity or instance.end_validity:
        start = instance.start_validity or "N/A"
        end = instance.end_validity or "N/A"
        message += f" (valid: {start} → {end})"

    # --- User Notification ---
    Notification.objects.create(
        recipient=user,
        target_role=role_name,       # ✔ which role this notif belongs to
        domain="role",               # domain category
        type="role_assigned",        # subtype event
        message=message,
        link=""  # optional link (customize)
    )

    # --- Notify ADMINs ---
    admin_message = (
        f"User {user.get_full_name()} assigned as {role_name.replace('_', ' ').title()}"
    )
    if assigned_entity:
        admin_message += f" for {assigned_entity}"

    notify_admins(
        message=admin_message,
        domain="role",
        notif_type="role_assigned",
        target_role="ADMIN",   # ✔ this notif is for admin's role
        link="/admin/users"
    )
        
