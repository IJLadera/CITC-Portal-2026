# events/tasks.py

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import tblEvent, tblSemester
from app.users.models import User
from app.lms.models import Status
from django.db.models import Q
from django.utils.timezone import make_aware, localtime
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .utils import convert_draftjs_to_html
# Task 1: Update Event Status
@shared_task
def update_event_status_task():
    # Get the current datetime (timezone-aware, adjusted to local timezone, Asia/Singapore)
    now = timezone.localtime(timezone.now())  # This should be in Asia/Singapore time

    # Define the start and end of the current day (in local time)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Fetch the status instances for 'ongoing' and 'done'
    ongoing_status = Status.objects.get(name='ongoing')
    done_status = Status.objects.get(name='done')

    # Fetch only relevant events for today
    eventsfiltered = tblEvent.objects.filter(
        Q(endDateTime__gte=start_of_day) &  # Events that have not ended before today
        Q(startDateTime__lte=end_of_day)   # Events that started on or before today
    )

    # Also include past events that have ended (before today)
    past_events = tblEvent.objects.filter(
        Q(endDateTime__lt=start_of_day)  # Events that ended before today
    )

    # Combine both the upcoming/ongoing events and past events
    events = eventsfiltered | past_events

    for event in events:
        if event.startDateTime and event.endDateTime:
            # Ensure the event's start and end times are timezone-aware and convert them to Asia/Singapore time
            event_start_local = localtime(event.startDateTime)
            event_end_local = localtime(event.endDateTime)

            # Check if the event starts and ends within today's range
            if start_of_day <= event_start_local <= end_of_day:
                # Mark as ongoing if it's in today's range and has not ended yet
                if now <= event_end_local:
                    if event.status != ongoing_status:
                        event.status = ongoing_status
                elif now > event_end_local:
                    if event.status != done_status:
                        event.status = done_status

            # For events that started earlier but are still ongoing today
            elif event_start_local < start_of_day and event_end_local >= now:
                if event.status != ongoing_status:
                    event.status = ongoing_status

            # Mark as done if it ended before today
            elif event_end_local < start_of_day:
                if event.status != done_status:
                    event.status = done_status

            # Save the updated event
            event.save()


# Task 2: Send Email Reminders
@shared_task
def send_event_reminder_emails():
    # Get the current date (including time)
    now = timezone.localtime(timezone.now())  # This should be in Asia/Singapore time

    # Define the start and end of today (for event filtering)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    today_events = tblEvent.objects.filter(
        Q(endDateTime__gte=start_of_day) &  # Events that haven't ended before today
        Q(startDateTime__lte=end_of_day) &  # Events that start today or earlier
        ~Q(isAnnouncement=True) &  # Exclude announcements
        ~Q(status__name="draft")  # Exclude draft status
    )
    # Create a dictionary to store emails and their events
    email_event_map = {}

    for event in today_events:
        # Add event to participants' reminder list
        for participant in event.participants.all():
            if participant.email not in email_event_map:
                email_event_map[participant.email] = []
            email_event_map[participant.email].append(event)

        # Add event to the creator's reminder list
        if event.created_by and event.created_by.email:
            if event.created_by.email not in email_event_map:
                email_event_map[event.created_by.email] = []
            email_event_map[event.created_by.email].append(event)

    # Send reminder emails
    for email, events in email_event_map.items():
        send_professional_event_reminder_email(email, events)

# Helper function to send a professional email
def send_professional_event_reminder_email(email, events):
    subject = "Reminder: Your Events Scheduled for Today"
    event_details = "\n".join([
        f"- {event.eventName} ({event.startDateTime.strftime('%Y-%m-%d %H:%M')})"
        for event in events
    ])
    
    message = f"""
    Dear {email.split('@')[0].capitalize()},

    This is a reminder that you have the following event(s) scheduled for today:

    {event_details}

    Please make sure you're prepared and ready for the events. Should you need further assistance, don't hesitate to reach out to us.

    Best regards,
    The UniEventify Team
    """
    
    from_email = settings.DEFAULT_FROM_EMAIL

    send_mail(subject, message, from_email, [email])


# Task 3: deactivate account
@shared_task
def deactivate_users_at_semester_end():
    # Get the current date
    today = timezone.now().date()

    # Find the semester that ended most recently
    past_semesters = tblSemester.objects.filter(endDate__lte=today)
    if past_semesters.exists():
        # Get the latest past semester
        last_semester = past_semesters.latest('endDate')

        # Check if the current date is the day after the last semester's end date
        if today == last_semester.endDate + timezone.timedelta(days=1):
            # Deactivate all users
            User.objects.update(is_active=False)
            print("All users have been deactivated after the semester end.")

            # Send email notification to staff members
            subject = "User Deactivation Notification"
            message = (
                "All users have been deactivated following the end of the semester. "
                "Please upload a new list of users for the upcoming semester."
            )
            from_email = settings.DEFAULT_FROM_EMAIL

            # Get all staff email addresses
            staff_emails = User.objects.filter(is_staff=True).values_list('email', flat=True)

            if staff_emails:
                send_mail(subject, message, from_email, list(staff_emails))
                print(f"Email notification sent to staff: {list(staff_emails)}")
            else:
                print("No staff users found to notify.")
        else:
            print("No semester end today, no deactivation needed.")

@shared_task
def send_event_email_notification(event_id):
    """
    Send email notifications for the given event.
    """
    try:
        event = tblEvent.objects.get(pk=event_id)
        subject = f"Invited Event: {event.eventName}"
        from_email = settings.DEFAULT_FROM_EMAIL

        # Convert Draft.js JSON (eventDescription) to HTML
        event_description_html = convert_draftjs_to_html(event.eventDescription)

        for participant in event.participants.all():
            html_message = render_to_string('email_templates/new_event.html', {
                'event': event,
                'event_description_html': event_description_html,
            })
            plain_message = strip_tags(html_message)

            send_mail(subject, plain_message, from_email, [participant.email], html_message=html_message)

    except tblEvent.DoesNotExist:
        # Handle event not existing (e.g., deleted after creation)
        pass

@shared_task
def send_user_email_notification(first_name, last_name, email, password):
    """
    Send email notification to a new user.
    """
    email_subject = "Your Account Information"
    email_body = (
        f"Dear {first_name} {last_name},\n\n"
        "We are pleased to inform you that your account has been successfully created.\n\n"
        "Here are your login details:\n"
        f"Email: {email}\n"
        f"Password: {password}\n"
        "Please keep this information secure and do not share it with anyone.\n\n"
        "Best regards,\n"
        "The UniEventify Team"
    )

    send_mail(
        email_subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

@shared_task
def send_postponed_email_task(event_id):
    """
    Send email notifications to participants for postponed events.
    """
    try:
        event = tblEvent.objects.get(pk=event_id)
        subject = f"Event Postponed: {event.eventName}"
        from_email = settings.DEFAULT_FROM_EMAIL

        # Convert Draft.js JSON (eventDescription) to HTML
        event_description_html = convert_draftjs_to_html(event.eventDescription)

        # Send email to each participant
        for participant in event.participants.all():
            html_message = render_to_string('email_templates/postponed_event.html', {
                'event': event,
                'event_description_html': event_description_html,
            })
            plain_message = strip_tags(html_message)

            send_mail(
                subject,
                plain_message,
                from_email,
                [participant.email],
                html_message=html_message,
            )
    except tblEvent.DoesNotExist:
        # Handle case where the event does not exist
        print(f"Event with ID {event_id} does not exist.")
