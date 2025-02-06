# from django.db.models.signals import pre_save, post_save
# from django.dispatch import receiver
# from django.core.mail import send_mail, EmailMessage, send_mass_mail
# from django.conf import settings
# from .models import tblEvent, CustomUser
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags

# @receiver(pre_save, sender=tblEvent)
# def set_event_status(sender, instance, **kwargs):
#     instance.update_status()


# @receiver(post_save, sender=tblEvent)
# def send_event_email_notification(sender, instance, created, **kwargs):
#     if created:
#         subject = f"New Event: {instance.eventName}"
#         html_message = render_to_string('email_templates/new_event.html', {'event': instance})
#         plain_message = strip_tags(html_message)
#         from_email = 'jaycetabobo5@gmail.com'
        
#         for participant in instance.participants.all():
#             send_mail(subject, plain_message, from_email, [participant.email], html_message=html_message)

# signals.py
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import tblEvent, tblEventLog

@receiver(m2m_changed, sender=tblEvent.participants.through)
def create_notifications(sender, instance, action, **kwargs):
    if action == 'post_add':
        participants = instance.participants.all()
        for user in participants:
            tblEventLog.objects.get_or_create(user=user, event=instance)
