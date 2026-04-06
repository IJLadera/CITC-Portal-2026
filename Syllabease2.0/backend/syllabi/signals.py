from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Syllabus
from notifications.models import Notification
from users.models import UserRole
from bayanihan.models import BayanihanGroupUser

@receiver(post_save, sender=Syllabus)
def syllabus_status_notifications(sender, instance, created, **kwargs):
    try: 
        status = instance.status
        course_code = getattr(instance.course, "course_code", "Unknown Course")

        # Get related Department and College safely
        department_id = getattr(getattr(instance.program, "department", None), "id", None)
        college_id = getattr(getattr(instance.program.department, "college", None), "id", None)

        # Common role fetchers
        def get_bleader_users():
            return BayanihanGroupUser.objects.filter(
                group_id=instance.bayanihan_group_id,
                role="LEADER"
            ).select_related("user")

        def get_bteacher_users():
            return BayanihanGroupUser.objects.filter(
                group_id=instance.bayanihan_group_id,
                role="TEACHER"
            ).select_related("user")

        def get_chair_users():
            return UserRole.objects.filter(
                role__name="CHAIRPERSON",
                entity_type="Department",
                entity_id=department_id
            ).select_related("user")

        def get_dean_users():
            return UserRole.objects.filter(
                role__name="DEAN",
                entity_type="College",
                entity_id=college_id
            ).select_related("user")
        
        def get_admin_users():
            return UserRole.objects.filter(
                role__name="ADMIN"
            ).select_related("user")

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

        # Bayanihan Leader submits syllabus → notify Chairperson
        if status in "Pending Chair Review" and instance.chair_submitted_at:
            # Notify Chairperson
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"A new syllabus for {course_code} has been submitted and is now pending your review.",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
                print(f"📨 Chair notified for Pending Chair Review → {role.user.email}")

            # Notify Leader & Teacher (for info)
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_LEADER",
                    message=f"You have submitted the syllabus for {course_code} for Chairperson review.”",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/view/",
                )
                
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} has been submitted and is now awaiting Chairperson review.",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )

            notify_admins(
                target_role="ADMIN",
                message=f"A new syllabus for {course_code} has been submitted and is now pending Chairperson review.",
                domain="syllabus",
                notif_type="syllabus_review",
                link=f"/admin/syllabus/{instance.id}/view/"
            )
            
        
        # Bayanihan Leader re-submits syllabus → notify Chairperson
        elif status == "Revisions Applied" and instance.chair_submitted_at:
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"The revised syllabus for {course_code} has been re-submitted and is now pending your review.",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
                print(f"📨 Chair notified for Pending Chair Review → {role.user.email}")

            # Notify Leader & Teacher (for info)
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_LEADER",
                    message=f"You have re-submitted the revised syllabus for {course_code} for Chairperson review.",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/view/",
                )
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The revised syllabus for {course_code} has been re-submitted and is now awaiting Chairperson review.",
                    domain="syllabus",
                    type="syllabus_review",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )

            notify_admins(   
                target_role="ADMIN",
                message=f"The revised syllabus for {course_code} has been re-submitted and is now pending Chairperson review.",
                domain="syllabus",
                notif_type="syllabus_review",
                link=f"/admin/syllabus/{instance.id}/view/"
            )
        
        
        # Chairperon returns syllabus for revisions
        elif status == "Returned by Chair" and instance.chair_rejected_at:
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_LEADER",
                    message=f"The syllabus for {course_code} was returned by the Chairperson for revisions. Please check the review form and make the necessary revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/view/",
                )
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} was returned by the Chairperson for revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"You returned the syllabus for {course_code} for further revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
                
            notify_admins(   
                target_role="ADMIN",
                message=f"The syllabus for {course_code} was returned by the Chairperson for revisions.",
                domain="syllabus",
                notif_type="syllabus_returned",
                link=f"/admin/syllabus/{instance.id}/view/"
            )


        # Chairperson approves syllabus
        elif status == "Approved by Chair" and instance.dean_submitted_at:
            for role in get_dean_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="DEAN",
                    message=f"The syllabus for {course_code} has been approved by the Chairperson and is now ready for your approval.",
                    domain="syllabus",
                    type="syllabus_approval",
                    link=f"/dean/syllabus/{instance.id}/view/",
                )
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_LEADER",
                    message=f"The syllabus for {course_code} has been approved by the Chairperson and is awaiting Dean approval.",
                    domain="syllabus",
                    type="syllabus_approval",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/view/",
                )
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} has been approved by the Chairperson and is awaiting Dean approval.",
                    domain="syllabus",
                    type="syllabus_approval",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"You have approved the syllabus for {course_code}. It has been forwarded to the Dean for final approval.",
                    domain="syllabus",
                    type="syllabus_approval",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
                
            notify_admins(   
                target_role="ADMIN",
                message=f"The syllabus for {course_code} has been approved by the Chairperson and is awaiting Dean review.",
                domain="syllabus",
                notif_type="syllabus_approval",
                link=f"/admin/syllabus/{instance.id}/view/"
            )
            
            
        # Dean returns the syllabus for revisions
        elif status == "Returned by Dean" and instance.dean_rejected_at:
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_LEADER",
                    message=f"The syllabus for {course_code} has been returned by the Dean for revisions. Please review the feedback and make the necessary revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/edit/",
                )
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} has been returned by the Dean for revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"The syllabus for {course_code} that you approved has been returned by the Dean for revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
            for role in get_dean_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="DEAN",
                    message=f"You have returned the syllabus for {course_code} for revisions.",
                    domain="syllabus",
                    type="syllabus_returned",
                    link=f"/dean/syllabus/{instance.id}/view/",
                )
                
            notify_admins( 
                target_role="ADMIN",
                message=f"The syllabus for {course_code} has been returned by the Dean for revisions.",
                domain="syllabus",
                notif_type="syllabus_returned",
                link=f"/admin/syllabus/{instance.id}/view/"
            )

        # Dean approves syllabus → notify Bayanihan Leaders, Teachers, and Chairperson and DEAN themselves
        elif status == "Approved by Dean":
            for role in get_bleader_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} has been approved by the Dean.",
                    domain="syllabus",
                    type="syllabus_approved",
                    link=f"/bayanihan_leader/syllabus/{instance.id}/view/",
                )
            for role in get_bteacher_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="BAYANIHAN_TEACHER",
                    message=f"The syllabus for {course_code} has been approved by the Dean.",
                    domain="syllabus",
                    type="syllabus_approved",
                    link=f"/bayanihan_teacher/syllabus/{instance.id}/view/",
                )
            for role in get_chair_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="CHAIRPERSON",
                    message=f"The syllabus for {course_code} has been approved by the Dean.",
                    domain="syllabus",
                    type="syllabus_approved",
                    link=f"/chairperson/syllabus/{instance.id}/view/",
                )
            for role in get_dean_users():
                Notification.objects.create(
                    recipient=role.user,
                    target_role="DEAN",
                    message=f"You approved the syllabus for {course_code}.",
                    domain="syllabus",
                    type="syllabus_approved",
                    link=f"/dean/syllabus/{instance.id}/view/",
                )
            notify_admins( 
                target_role="ADMIN",
                message=f"The syllabus for {course_code} has been approved by the Dean.",
                domain="syllabus",
                notif_type="syllabus_approved",
                link=f"/admin/syllabus/{instance.id}/view/"
            ) 

    except Exception as e:
        print(f"❌ Failed to create notification for syllabus {instance.id}: {e}")