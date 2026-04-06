from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from .models import College, Department, Program, Curriculum, Course, ProgramOutcome, PEO, Memo
from .serializers import MemoSerializer, CollegeSerializer, DepartmentSerializer, ProgramSerializer, CurriculumSerializer, CourseSerializer, PEOSerializer, ProgramOutcomeSerializer  
from .pagination import AcademicsPagination  # ⬅️ import this at the top

from users.permissions import RolePermission
from users.models import UserRole

from django.db.models import F, OuterRef, Subquery, Q, Count
from django.http import FileResponse
from django.template.loader import render_to_string
from django.utils.timezone import now
from django.core.mail import EmailMessage
from django.conf import settings
import os
from utils.space import upload_to_spaces
from django.core.files.base import ContentFile

# Create your views here.
class MemoViewSet(viewsets.ModelViewSet):
    queryset = Memo.objects.all().order_by('-date')
    serializer_class = MemoSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']
 
    def get_queryset(self):
        user = self.request.user
        return Memo.objects.filter(Q(recipients=user) | Q(user=user)).order_by('-date')
    
    def retrieve(self, request, *args, **kwargs):
        memo = self.get_object()
        # Ensure user is a recipient or creator
        if request.user not in memo.recipients.all() and memo.user != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(memo)
        return Response(serializer.data)

    # new perform_create that handles emails but uses perform_create1 internally
    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None 

        # Save memo instance first
        memo = serializer.save(user=user)

        # Send memo emails
        recipients = memo.recipients.all()
        for recipient in recipients:
            if not recipient.email:
                continue

            subject = f"New Memo: {memo.title}"
            html_content = render_to_string("emails/memo_notification.html", {
                "user": recipient,
                "memo": memo,
                "year": now().year,
            })

            email = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient.email],
            )
            email.content_subtype = "html"
            email.send(fail_silently=False)

        return memo
    
    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)
    
    
class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.all().order_by("college_code")
    serializer_class = CollegeSerializer
    permission_classes = [RolePermission("ADMIN")] 
    pagination_class = AcademicsPagination  # ⬅️ add pagination here


class DepartmentViewSet(viewsets.ModelViewSet): 
    serializer_class = DepartmentSerializer
    permission_classes = [RolePermission("ADMIN", "DEAN")] 
    pagination_class = AcademicsPagination  # ⬅️ add pagination here

    def get_queryset(self): 
        user = self.request.user
        role = self.request.GET.get("role")  

        qs = Department.objects.select_related("college").order_by("college__college_code", "department_code")

        # Admin → all department
        if self.action in ["list"]: 
            if not role:
                raise ValidationError({"role": "Missing role query parameter."})
            
            elif role == "ADMIN":
                if not user.has_role("ADMIN"):
                    raise PermissionDenied("You are not an admin.")
                return qs

            # Dean → filter by college_id
            elif role == "DEAN":
                if not user.has_role("DEAN"):
                    raise PermissionDenied("You are not a dean.") 

                # Look up user roles with entity_type="College"
                dean_roles = UserRole.objects.filter(
                    user=user, role__name="DEAN", entity_type="College"
                )
                college_ids = [ur.entity_id for ur in dean_roles if ur.entity_id]

                if not college_ids:
                    raise PermissionDenied("This dean is not assigned to any college.")

                return qs.filter(
                    college_id__in=college_ids
                ).order_by("college__college_code", "department_code")

            # Dean → filter by department_ID
            elif role == "CHAIRPERSON":
                if not user.has_role("CHAIRPERSON"):
                    raise PermissionDenied("You are not a chairperson.") 

                # Look up user roles with entity_type="Department"
                chair_roles = UserRole.objects.filter(
                    user=user, role__name="CHAIRPERSON", entity_type="Department"
                )
                department_ids = [ur.entity_id for ur in chair_roles if ur.entity_id]

                if not department_ids:
                    raise PermissionDenied("This chairperson is not assigned to any department.")

                return qs.filter(
                    id__in=department_ids
                ).order_by("college__college_code", "department_code") 

            raise ValidationError({"role": f"Invalid role '{role}' specified."})
 
        return qs
    
    
class ProgramViewSet(viewsets.ModelViewSet): 
    serializer_class = ProgramSerializer
    permission_classes = [RolePermission("ADMIN", "CHAIRPERSON", "DEAN")] 
    pagination_class = AcademicsPagination  # ⬅️ add pagination here

    def get_queryset(self): 
        user = self.request.user
        role = self.request.GET.get("role") 
        department_id = self.request.GET.get("department_id")  # ✅ new param 
        
        qs = Program.objects.select_related("department", "department__college").order_by("program_code")

        # === ?all=true disables pagination (for dropdowns, etc.) ===
        if self.request.GET.get("all") == "true":
            self.pagination_class = None

        # === Allow filtering by department_id (for UI dropdowns) ===
        if department_id:
            try:
                department_id = int(department_id)
                qs = qs.filter(department_id=department_id)
            except ValueError:
                raise ValidationError({"department_id": "Invalid department ID."})
        
        if self.action in ["list"]: 
            if not role:
                raise ValidationError({"role": "Missing role query parameter."})
            
            # Admin → all programs
            if role == "ADMIN":
                if not user.has_role("ADMIN"):
                    raise PermissionDenied("You are not an admin.")
                return qs

            # Chairperson → filter by department_id
            elif role == "CHAIRPERSON":
                if not user.has_role("CHAIRPERSON"):
                    raise PermissionDenied("You are not a chairperson.")

                # Look up user roles with entity_type="Department"
                chair_roles = UserRole.objects.filter(
                    user=user, role__name="CHAIRPERSON", entity_type="Department"
                )
                department_ids = [ur.entity_id for ur in chair_roles if ur.entity_id]

                if not department_ids:
                    raise PermissionDenied("This Chairperson is not assigned to any department.")

                qs = qs.filter(department_id__in=department_ids)

            # Dean → filter by college_id
            elif role == "DEAN":
                if not user.has_role("DEAN"):
                    raise PermissionDenied("You are not a dean.") 

                # Look up user roles with entity_type="College"
                dean_roles = UserRole.objects.filter(
                    user=user, role__name="DEAN", entity_type="College"
                )
                college_ids = [ur.entity_id for ur in dean_roles if ur.entity_id]

                if not college_ids:
                    raise PermissionDenied("This Dean is not assigned to any college.")

                qs = qs.filter(department__college_id__in=college_ids)
                
            elif role == "AUDITOR":
                if not user.has_role("ADMIN"):
                    raise PermissionDenied("You are not an auditor.")
                return qs

            else:
                raise PermissionDenied("Invalid role parameter.")
        
        return qs


class CurriculumViewSet(viewsets.ModelViewSet): 
    serializer_class = CurriculumSerializer
    permission_classes = [RolePermission("ADMIN", "CHAIRPERSON", "DEAN")] 
    pagination_class = AcademicsPagination  # ⬅️ add pagination here

    def get_queryset(self): 
        user = self.request.user
        role = self.request.GET.get("role") 
        
        qs = Curriculum.objects.all().order_by("curr_code")
        
        if self.action in ["list"]: 
            # Admin → all curricula
            if role == "ADMIN":
                if not user.has_role("ADMIN"):
                    raise PermissionDenied("You are not an admin.")
                return qs.order_by("-created_at")

            # Chairperson → filter by department_id
            elif role == "CHAIRPERSON":
                if not user.has_role("CHAIRPERSON"):
                    raise PermissionDenied("You are not a chairperson.")

                # Look up user roles with entity_type="Department"
                chair_roles = UserRole.objects.filter(
                    user=user, role__name="CHAIRPERSON", entity_type="Department"
                )
                department_ids = [ur.entity_id for ur in chair_roles if ur.entity_id]

                if not department_ids:
                    raise PermissionDenied("This chairperson is not assigned to any department.")

                return qs.filter(
                    program__department_id__in=department_ids
                ).order_by("-created_at")

            # Dean → filter by college_id
            elif role == "DEAN":
                if not user.has_role("DEAN"):
                    raise PermissionDenied("You are not a dean.") 

                # Look up user roles with entity_type="College"
                dean_roles = UserRole.objects.filter(
                    user=user, role__name="DEAN", entity_type="College"
                )
                college_ids = [ur.entity_id for ur in dean_roles if ur.entity_id]

                if not college_ids:
                    raise PermissionDenied("This dean is not assigned to any college.")

                return qs.filter(
                    program__department__college_id__in=college_ids
                ).order_by("-created_at")

            # Fallback: deny if role param is missing or invalid
            raise PermissionDenied("Invalid or missing role parameter.")
        
        return qs
    
    
class CourseViewSet(viewsets.ModelViewSet): 
    serializer_class = CourseSerializer
    permission_classes = [RolePermission("ADMIN", "CHAIRPERSON", "DEAN")]
    pagination_class = AcademicsPagination  # ⬅️ add pagination here

    def get_queryset(self): 
        user = self.request.user
        role = self.request.GET.get("role") 
        
        qs = Course.objects.all().order_by("course_code", "course_title")
        
        if self.action in ["list"]:  
            if role == "ADMIN":
                if not user.has_role("ADMIN"):
                    raise PermissionDenied("You are not an admin.")
                qs.order_by("course_code")
 
            elif role == "CHAIRPERSON":
                if not user.has_role("CHAIRPERSON"):
                    raise PermissionDenied("You are not a chairperson.")
 
                chair_roles = UserRole.objects.filter(
                    user=user, role__name="CHAIRPERSON", entity_type="Department"
                )
                department_ids = [ur.entity_id for ur in chair_roles if ur.entity_id]

                if not department_ids:
                    raise PermissionDenied("This chairperson is not assigned to any department.")

                qs.filter(
                    curriculum__program__department_id__in=department_ids
                ).order_by("course_code")
 
            elif role == "DEAN":
                if not user.has_role("DEAN"):
                    raise PermissionDenied("You are not a dean.") 
 
                dean_roles = UserRole.objects.filter(
                    user=user, role__name="DEAN", entity_type="College"
                )
                college_ids = [ur.entity_id for ur in dean_roles if ur.entity_id]

                if not college_ids:
                    raise PermissionDenied("This dean is not assigned to any college.")

                qs.filter(
                    curriculum__program__department__college_id__in=college_ids
                ).order_by("course_code")

            # Fallback: deny if role param is missing or invalid
            else:
                raise PermissionDenied("Invalid or missing role parameter.")

        # === Apply shared filters === 
        search = self.request.GET.get("search")
        college = self.request.GET.get("college")
        department = self.request.GET.get("department")
        program = self.request.GET.get("program")
        year_level = self.request.GET.get("year_level")
        semester = self.request.GET.get("semester") 

        if search:
            qs = qs.filter(
                Q(course_code__icontains=search)
                | Q(course_title__icontains=search)
            )
        if college:
            qs = qs.filter(curriculum__program__department__college_id=college) 
        if department:
            qs = qs.filter(curriculum__program__department_id=department) 
        if program:
            qs = qs.filter(curriculum__program_id=program)
        if year_level:
            qs = qs.filter(course_year_level__iexact=year_level) 
        if semester:
            qs = qs.filter(course_semester__iexact=semester) 

        # === Optional: return all if ?all=true (for dropdowns) ===
        if self.request.GET.get("all") == "true":
            self.pagination_class = None

        return qs
    

class PEOViewSet(viewsets.ModelViewSet): 
    serializer_class = PEOSerializer
    queryset = PEO.objects.all()

    def get_queryset(self): 
        if self.action == "list":
            program_id = self.request.GET.get("program_id")
            if not program_id:
                raise PermissionDenied("Invalid or missing program ID parameter.")
            
            return PEO.objects.filter(is_active=True, program_id=program_id)
        return PEO.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False   # deactivate old
        instance.save()

        # create a new one instead
        data = request.data.copy()
        data["program"] = instance.program.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(is_active=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False   # ✅ soft delete
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProgramOutcomeViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramOutcomeSerializer
    queryset = ProgramOutcome.objects.all()

    def get_queryset(self): 
        if self.action == "list":
            program_id = self.request.GET.get("program_id")
            if not program_id:
                raise PermissionDenied("Invalid or missing program ID parameter.")
    
            return ProgramOutcome.objects.filter(is_active=True, program_id=program_id)
        return ProgramOutcome.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False   # deactivate old
        instance.save()

        data = request.data.copy()
        data["program"] = instance.program.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(is_active=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False   # ✅ soft delete
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)