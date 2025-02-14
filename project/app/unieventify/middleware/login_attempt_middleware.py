# myapp/middleware/login_attempt_middleware.py
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.middleware.common import MiddlewareMixin
from ..models import CustomUser

class LoginAttemptMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path == '/api/auth/token/login' and request.method == 'POST':
            email = request.POST.get('email')
            password = request.POST.get('password')
            user = CustomUser.objects.filter(email_address=email).first()
            

            if user:
                if user.account_locked:
                    if timezone.now() < user.lockout_until:
                        return JsonResponse({'error': 'Account is locked. Try again later.'}, status=403)
                    else:
                        user.account_locked = False
                        user.login_attempts = 0
                        user.save()

                if user.login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                    user.account_locked = True
                    user.lockout_until = timezone.now() + timedelta(minutes=settings.LOCKOUT_TIME)
                    user.save()
                    return JsonResponse({'error': 'Account locked due to too many failed login attempts.'}, status=403)

            # Authenticate the user
            user = authenticate(request, email_address=email, password=password)
            if user and isinstance(user, CustomUser):  # Ensure user is CustomUser
                login(request, user)
                user.last_login = timezone.now()
                user.login_attempts = 0
                user.save()
            else:
                if user and isinstance(user, CustomUser):
                    user.login_attempts += 1
                    user.last_login_attempt = timezone.now()
                    user.save()
                return JsonResponse({'error': 'Invalid login credentials.'}, status=400)
        return None
