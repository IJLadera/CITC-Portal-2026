from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView  
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated    
from .pagination import UserPagination
from .models import User, Role, UserRole
from .serializers import UserSerializer, RoleSerializer, ProfileSerializer, RegisterSerializer, FacultyIDTokenObtainPairSerializer, AssignRoleGenericSerializer, AssignedRoleSerializer
from users.permissions import RolePermission
from rest_framework.decorators import action
from django.template.loader import render_to_string
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.hashers import make_password
from django.core.mail import EmailMessage
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related("user_roles__role")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination

    def get_queryset(self):  
        qs = User.objects.all().prefetch_related("user_roles__role")

        request = self.request
        search = request.GET.get("search")
        role = request.GET.get("role")
        active = request.GET.get("active") 
        sort_field = request.GET.get("sort")       # new
        sort_order = request.GET.get("order", "asc")  # new, default ascending
        
        if search:
            qs = qs.filter(
                Q(faculty_id__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(prefix__icontains=search)
                | Q(suffix__icontains=search)
                | Q(phone__icontains=search)
            )

        if role:
          qs = qs.filter(user_roles__role__name__iexact=role).distinct()
            
        if active == "true":
            qs = qs.filter(is_active=True)
        elif active == "false":
            qs = qs.filter(is_active=False) 
        elif active == "all":
            pass
        else:
            qs = qs.filter(is_active=True)  # default

        # === Dynamic sorting ===
        allowed_sort_fields = ["first_name", "last_name", "email", "user_roles__role__name"]
        if sort_field in allowed_sort_fields:
            prefix = "" if sort_order.lower() == "asc" else "-"
            qs = qs.order_by(f"{prefix}{sort_field}")
        else:
            qs = qs.order_by("-date_joined")  # default fallback
            
        # === Optional: return all if ?all=true (for dropdowns) ===
        if self.request.GET.get("all") == "true":
            self.pagination_class = None

        return qs
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def suggestions(self, request):
        """Return list of users with email + roles for recipient autocomplete"""
        users = self.get_queryset()
        data = [
            {
                "id": u.id,
                "email": u.email,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "roles": [ur.role.name for ur in u.user_roles.all()]
            }
            for u in users
        ]
        return Response(data)
    

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [RolePermission("ADMIN")]
    
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = FacultyIDTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and response.data is not None:
            identifier = request.data.get("identifier") or request.data.get("faculty_id") or request.data.get("username")

            try:
                user = User.objects.get(
                    faculty_id=identifier
                ) if User.objects.filter(faculty_id=identifier).exists() else User.objects.get(username=identifier)
            except User.DoesNotExist:
                return Response(
                    {"detail": "User not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # ✅ Serialize and attach user data
            user_data = UserSerializer(user, context={"request": request}).data
            response.data["user"] = user_data

        return response
    
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=200)
        except Exception as e:
            return Response({"detail": "Invalid token."}, status=400)


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # allow file uploads

    def get_queryset(self): 
        return User.objects.filter(id=self.request.user.pk)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # allow partial updates
        return super().update(request, *args, **kwargs)


class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.all().select_related("user", "role") 
    permission_classes = [RolePermission("ADMIN", "DEAN")]
    
    def get_serializer_class(self):
        if self.action == "create":
            return AssignRoleGenericSerializer
        if self.action in ["update", "partial_update"]:
            return AssignRoleGenericSerializer
        if self.action == "list":
            return AssignedRoleSerializer 
        return AssignedRoleSerializer 
    
    @action(detail=False, methods=["post"], url_path="assign-role")
    def assign_role(self, request):
        """
        Generic endpoint to assign Chairperson or Dean.
        """
        serializer = AssignRoleGenericSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

            # Removed:
            #   - Token/UID generation
            #   - Password reset timestamp
            #   - Email contexts
            #   - EmailMultiAlternatives
            #   - render_to_string
            #   - msg.send()

            # You may still want this (not email related)

            # You can keep any logic you want here,
            # but all email sending has been removed.

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["put", "patch"], url_path="update-role")
    def update_role(self, request, pk=None):
        instance = self.get_object()
        serializer = AssignRoleGenericSerializer(instance, data=request.data, partial=True)

        if serializer.is_valid():
            role_assignment = serializer.save()

            # 🧹 Removed ALL mailer logic for DEAN
            if role_assignment.role.name.upper() == "DEAN":
                pass  # Role update only, no emails

            # 🧹 Removed ALL mailer logic for CHAIRPERSON
            if role_assignment.role.name.upper() == "CHAIRPERSON":
                pass  # Role update only, no emails

            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=False, methods=["get"], url_path="assigned-roles")
    def assigned_roles(self, request):
        """
        Returns all Chairpersons and Deans with:
        - full_name
        - role
        - entity_name (Department/College)
        - start_validity
        - end_validity
        """
        role_filter = request.query_params.get("role")

        roles_qs = self.get_queryset().filter(role__name__in=["CHAIRPERSON", "DEAN"])

        if role_filter:
            roles_qs = roles_qs.filter(role__name=role_filter.upper())

        serializer = AssignedRoleSerializer(roles_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def send_password_reset_email(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required."}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "No account found with that email."}, status=404)

    # ✅ Generate token and UID
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    # ✅ Set password reset requested timestamp
    user.password_reset_requested_at = timezone.now()
    user.save()

    reset_link = f"https://syllabease2-0-deployment.vercel.app/forgot-password?uid={uid}&token={token}"

    html_message = render_to_string(
        "emails/password_reset_link.html",
        {
            "user": user,
            "reset_link": reset_link,
            "expiry_seconds": getattr(settings, "PASSWORD_RESET_TIMEOUT", 3600),
        },
    )

    email_message = EmailMessage(
        subject="Reset Your SyllabEase Password",
        body=html_message,
        from_email="support@syllabease.com",
        to=[email],
    )
    email_message.content_subtype = "html"
    email_message.send()

    return Response({"message": "Password reset link sent to your email."}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request, uidb64, token):
    password = request.data.get("password")

    if not password:
        return Response({"error": "Missing password."}, status=400)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({"error": "Invalid reset link."}, status=400)

    # ✅ Make sure the user requested a password reset
    if not user.password_reset_requested_at:
        return Response({"error": "No password reset request found."}, status=400)

    # ✅ Check if the token has expired
    elapsed = (timezone.now() - user.password_reset_requested_at).total_seconds()
    timeout = getattr(settings, "PASSWORD_RESET_TIMEOUT", 3600)
    if elapsed > timeout:
        return Response({"error": "This reset link has expired."}, status=400)

    # ✅ Validate token
    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid or expired token."}, status=400)

    # ✅ Reset password
    user.password = make_password(password)
    user.password_reset_requested_at = None
    user.save()

    return Response({"message": "Password reset successful."}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change password for logged-in user without needing the old password.
    """
    new_password = request.data.get("password")
    if not new_password:
        return Response({"error": "Password is required."}, status=400)

    user = request.user
    user.password = make_password(new_password)
    user.save()

    return Response({"message": "Password updated successfully."}, status=200)

@api_view(["GET"])
@permission_classes([AllowAny])
def validate_reset_token(request):
    """
    Check if the reset token is still valid and not expired.
    """
    uidb64 = request.query_params.get("uid")
    token = request.query_params.get("token")

    if not uidb64 or not token:
        return Response({"valid": False, "error": "Missing UID or token."}, status=400)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({"valid": False, "error": "Invalid link."}, status=400)

    # Check if token expired
    if not user.password_reset_requested_at:
        return Response({"valid": False, "error": "No reset request found."}, status=400)

    elapsed = (timezone.now() - user.password_reset_requested_at).total_seconds()
    timeout = getattr(settings, "PASSWORD_RESET_TIMEOUT", 3600)
    if elapsed > timeout:
        return Response({"valid": False, "error": "Token expired."}, status=400)

    # Check if token matches
    if not default_token_generator.check_token(user, token):
        return Response({"valid": False, "error": "Invalid token."}, status=400)

    return Response({"valid": True}, status=200)
