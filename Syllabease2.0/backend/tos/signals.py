# tos/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TOS
from notifications.models import Notification
from bayanihan.models import BayanihanGroupUser
from users.models import UserRole


# ✅ Admin helpers
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


@receiver(post_save, sender=TOS)
def handle_tos_notifications(sender, instance, created, **kwargs):
    """
    Unified TOS notification handler:
    ✅ Submission (Pending Chair Review)
    ✅ Revisions Applied
    ✅ Approved by Chair
    ✅ Returned by Chair
    """
    status = instance.status
    course = instance.course
    course_code = course.course_code
    course_title = course.course_title
    term = instance.term

    # ✅ Fetch roles
    leaders = BayanihanGroupUser.objects.filter(group_id=instance.bayanihan_group_id, role="LEADER")
    teachers = BayanihanGroupUser.objects.filter(group_id=instance.bayanihan_group_id, role="TEACHER")

    chairs = UserRole.objects.filter(
        role__name="CHAIRPERSON",
        entity_type="Department",
        entity_id=instance.program.department_id
    )

    # ✅ 1. SUBMISSION → Pending Chair Review
    if status == "Pending Chair Review" and instance.chair_submitted_at:
        # → Notify Chair
        for chair in chairs:
            Notification.objects.create(
                recipient=chair.user,
                target_role="CHAIRPERSON",
                message=f"The TOS for {course_code} - {course_title} ({term}) has been submitted for your review.",
                domain="tos",
                type="tos_review",
                link=f"/chairperson/tos/{instance.id}/view/"
            )

        # → Notify BLeader
        for entry in leaders:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_LEADER",
                message=f"The TOS for {course_code} - {course_title} ({term}) has been submitted for Chairperson review.",
                domain="tos",
                type="tos_review",
                link=f"/bayanihan_leader/tos/{instance.id}/view/"
            )

        # → Notify BTeacher
        for entry in teachers:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_TEACHER",
                message=f"The TOS for {course_code} - {course_title} ({term}) has been submitted for Chairperson review.",
                domain="tos",
                type="tos_review",
                link=f"/bayanihan_teacher/tos/{instance.id}/view/"
            )

        # → Notify Admin
        notify_admins(
            target_role="ADMIN",
            message=f"TOS for {course_code} - {course_title} ({term}) submitted for Chairperson review.",
            domain="tos",
            notif_type="tos_review",
            link=f"/admin/tos/{instance.id}/view/"
        )

    # ✅ 2. REVISIONS APPLIED (re-submission)
    elif status == "Revisions Applied" and instance.chair_submitted_at:
        # → Notify Chair
        for chair in chairs:
            Notification.objects.create(
                recipient=chair.user,
                target_role="CHAIRPERSON",
                message=f"TOS for {course_code} - {course_title} ({term}) has been re-submitted for your review.",
                domain="tos",
                type="tos_review",
                link=f"/chairperson/tos/{instance.id}/view/"
            )

        # → Notify Leader
        for entry in leaders:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_LEADER",
                message=f"The TOS for {course_code} - {course_title} ({term}) has been re-submitted for Chairperson review.",
                domain="tos",
                type="tos_review",
                link=f"/bayanihan_leader/tos/{instance.id}/view/"
            )

        # → Notify Teacher
        for entry in teachers:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_TEACHER",
                message=f"The TOS for {course_code} - {course_title} ({term}) has been re-submitted for Chairperson review.",
                domain="tos",
                type="tos_review",
                link=f"/bayanihan_teacher/tos/{instance.id}/view/"
            )

        notify_admins(
            target_role="ADMIN",
            message=f"The TOS for {course_code} - {course_title} ({term}) has been re-submitted for Chairperson review.",
            domain="tos",
            notif_type="tos_review",
            link=f"/admin/tos/{instance.id}/view/"
        ) 

    # ✅ 3. Approved OR Returned by Chairperson
    elif status in ["Approved by Chair", "Returned by Chair"]:
        message = (
            f"The TOS for {course_code} - {course_title} ({term}) has been approved by the Chairperson."
            if status == "Approved by Chair"
            else f"The TOS for {course_code} - {course_title} ({term}) has been returned by the Chairperson for revision."
        )

        notif_type = (
            "tos_approved" if status == "Approved by Chair" else "tos_returned"
        )

        # → Notify Leaders
        bl_message = (
            f"The TOS for {course_code} - {course_title} ({term}) has been approved by the Chairperson."
            if status == "Approved by Chair"
            else f"The TOS for {course_code} - {course_title} ({term}) has been returned by the Chairperson for revisions."
        )
        for entry in leaders:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_LEADER",
                message=bl_message,
                domain="tos",
                type=notif_type,
                link=f"/bayanihan_leader/tos/{instance.id}/view/"
            )

        # → Notify Teachers
        for entry in teachers:
            Notification.objects.create(
                recipient=entry.user,
                target_role="BAYANIHAN_TEACHER",
                message=message,
                domain="tos",
                type=notif_type,
                link=f"/bayanihan_teacher/tos/{instance.id}/view/"
            )

        # → Notify Chair (confirmation)
        chair_message = (
            f"You have approved the TOS for {course_code} - {course_title} ({term})."
            if status == "Approved by Chair"
            else f"You have returned the TOS for {course_code} - {course_title} ({term})."
        )
        for chair in chairs:
            Notification.objects.create(
                recipient=chair.user,
                target_role="CHAIRPERSON",
                message=chair_message,
                domain="tos",
                type="tos_action",
                link=f"/chairperson/tos/{instance.id}/view/"
            )

        # → Notify Admin
        notify_admins(
            target_role="ADMIN",
            message=message, 
            domain="tos",
            notif_type=notif_type,
            link=f"/admin/tos/{instance.id}/view/"
        )
