from django.db.models import F, OuterRef, Subquery, Q, DateTimeField, Case, When, BooleanField 
from django.utils import timezone   
from datetime import timedelta, datetime
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError 
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .pagination import ReportsPagination
from .models import Deadline, Report, TOSReport
from .serializers import DeadlineSerializer, ReportSerializer, TOSReportSerializer
from academics.models import Department
from users.models import User, UserRole 
from users.permissions import RolePermission

# Viewsets
class DeadlineViewSet(viewsets.ModelViewSet):
    queryset = Deadline.objects.all()
    serializer_class = DeadlineSerializer
    permission_classes = [RolePermission("DEAN", "ADMIN", "BAYANIHAN_LEADER")] 
    
    def get_queryset(self):
        user = self.request.user
        role = self.request.GET.get("role")

        base_qs = Deadline.objects.select_related("college", "user").order_by("-created_at")
        
        # Only enforce role filtering for list
        if self.action in ["list"]:    
            if not role:
                raise ValidationError({"role": "Missing role query parameter."})
            
            if role and role.upper() == "ADMIN":
                if not UserRole.objects.filter(user=user, role__name="ADMIN").exists():
                    raise PermissionDenied("You are not an Admin.")
                return base_qs.order_by("-updated_at") 

            elif role and role.upper() == "DEAN":
                try:
                    dean_role = UserRole.objects.get(
                        user=user,
                        entity_type="College",
                        role__name="DEAN",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Dean.")
                except UserRole.MultipleObjectsReturned:
                    raise PermissionDenied("Multiple Dean roles found, please contact admin.") 

                return base_qs.filter(
                    college__id=dean_role.entity_id, 
                ).order_by("-updated_at")[:5]

            elif role and role.upper() == "CHAIRPERSON":
                try:
                    chair_role = UserRole.objects.get(
                        user=user,
                        entity_type="Department",
                        role__name="Chairperson",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Chairperson.")
                except UserRole.MultipleObjectsReturned:
                    raise PermissionDenied("Multiple Chairperson roles found, please contact admin.")  
                            
                department = Department.objects.get(id=chair_role.entity_id)  
                college_id = department.college.pk

                return base_qs.filter(
                    college__id=college_id, 
                ).order_by("-updated_at")[:5]

            elif role and role.upper() == "BAYANIHAN_LEADER":
                if not UserRole.objects.filter(user=user, role__name="BAYANIHAN_LEADER").exists():
                    raise PermissionDenied("You are not a Bayanihan Leader.")
                return base_qs.order_by("-updated_at")[:5] 
            
            else: 
                # Fallback: deny if role param is missing or invalid
                raise ValidationError({"role": f"Invalid role '{role}' specified."}) 

        return base_qs 

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        # Just save the deadline — no email logic
        serializer.save()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def latest(self, request):
        """Return the latest *active* deadlines for Bayanihan Leaders, Admins, and Deans."""
        user = request.user
        allowed_roles = ["BAYANIHAN_LEADER", "ADMIN", "DEAN"]

        if not user.user_roles.filter(role__name__in=allowed_roles).exists():
            return Response([], status=200)

        qs = Deadline.objects.filter(
            Q(syll_status="ACTIVE", syll_deadline__isnull=False) |
            Q(tos_midterm_status="ACTIVE", tos_midterm_deadline__isnull=False) |
            Q(tos_final_status="ACTIVE", tos_final_deadline__isnull=False)
        ).order_by("-created_at")[:10]

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], permission_classes=[RolePermission("DEAN", "ADMIN")])
    def update_status(self, request, pk=None):
        """Allows Dean/Admin to update any of the three statuses."""
        deadline = self.get_object()
        allowed_fields = ["syll_status", "tos_midterm_status", "tos_final_status"]

        # find which field to update
        for field in allowed_fields:
            if field in request.data:
                setattr(deadline, field, request.data[field])
                deadline.save(update_fields=[field])
                serializer = self.get_serializer(deadline)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {"error": "No valid status field provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    
class ReportViewSet(viewsets.ModelViewSet): 
    serializer_class = ReportSerializer
    permission_classes = [RolePermission("DEAN", "ADMIN", "CHAIRPERSON")] 
    pagination_class = ReportsPagination
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
    
        serializer = self.get_serializer(
            instance,
            context={"include_versions": True}  # Only enable here
        )
        
        return Response(serializer.data)
    
    def get_queryset(self):
        user = self.request.user
        role = self.request.GET.get("role")

        # 🟦 Extract search filters from query params
        filter_year = self.request.GET.get("school_year") 
        filter_course = self.request.GET.get("course")
        filter_semester = self.request.GET.get("course_semester")
        filter_program = self.request.GET.get("program")
        filter_status = self.request.GET.get("deadline_status")  # overdue | near | on-time
        approved_only = self.request.GET.get("approved_only") == "true"

        now = timezone.now()

        base_qs = Report.objects.select_related(
            "bayanihan_group", 
            "syllabus",
        )

        # =========================
        # ROLE FILTERING (existing)
        # =========================
        if self.action in ["list"]:
            if role == "ADMIN":
                if not UserRole.objects.filter(user=user, role__name="ADMIN").exists():
                    raise PermissionDenied("You are not an admin.")

                # latest version per group
                latest_version_subquery = (
                    Report.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id")
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = base_qs.annotate(
                    latest_version=Subquery(latest_version_subquery)
                ).filter(version=F("latest_version"))
                
            elif role == "DEAN":
                try:
                    dean_role = UserRole.objects.get(
                        user=user,
                        entity_type="College",
                        role__name="DEAN",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Dean.")
                except UserRole.MultipleObjectsReturned:
                    raise PermissionDenied("Multiple Dean roles found, please contact admin.")

                # Subquery: latest version with not null per group
                latest_dean_version_subquery = (
                    Report.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"), 
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = base_qs.annotate(
                    latest_dean_version=Subquery(latest_dean_version_subquery)
                ).filter(
                    syllabus__college__id=dean_role.entity_id,
                    version=F("latest_dean_version"),
                )
                
            elif role == "CHAIRPERSON":
                try:
                    chair_role = UserRole.objects.get(
                        user=user,
                        entity_type="Department",
                        role__name="CHAIRPERSON",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Chairperson.")
                except UserRole.MultipleObjectsReturned:
                    raise PermissionDenied("Multiple Chairperson roles found, please contact admin.")

                # Subquery: latest version with not null per group
                latest_chair_version_subquery = (
                    Report.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"), 
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = base_qs.annotate(
                    latest_chair_version=Subquery(latest_chair_version_subquery)
                ).filter(
                    syllabus__program__department__id=chair_role.entity_id,
                    version=F("latest_chair_version"),
                )
            else:
                qs = base_qs
        else:
            qs = base_qs

        # ======================================
        # 🟧 BASIC SEARCH FILTERS
        # ======================================
        if filter_year:
            qs = qs.filter(bayanihan_group__school_year=filter_year) 
        
        if filter_course:
            qs = qs.filter(
                Q(bayanihan_group__course__course_title__icontains=filter_course) |
                Q(bayanihan_group__course__course_code__icontains=filter_course)
            )

        if filter_semester:
            qs = qs.filter(
                bayanihan_group__course__course_semester__iexact=filter_semester
            ) 

        if filter_program:
            qs = qs.filter(
                syllabus__program_id=filter_program 
            )
            
        if approved_only:
            qs = qs.filter(
                syllabus__status="Approved by Dean", 
                syllabus__dean_approved_at__isnull=False
            )
            
        # ======================================
        # 🟥 DEADLINE MATCHING
        # ======================================
        deadline_subquery = Deadline.objects.filter(
            college_id=OuterRef("syllabus__college_id"),  # ✅ match by college
            school_year=OuterRef("bayanihan_group__school_year"),
            semester=OuterRef("bayanihan_group__course__course_semester"),
            syll_status="ACTIVE",
        ).order_by("-id")

        qs = qs.annotate(
            deadline_date=Subquery(deadline_subquery.values("syll_deadline")[:1]),
        )

        # ======================================
        # 🟩 DEADLINE STATUS ANNOTATIONS
        # ======================================
        submitted_at = F("chair_submitted_at")
        deadline = F("deadline_date")

        qs = qs.annotate(
            is_overdue=Case(
                # submitted late
                When(chair_submitted_at__gt=deadline, then=True),
                # unsubmitted and now > deadline
                When(chair_submitted_at__isnull=True, deadline_date__lt=now, then=True),
                default=False,
                output_field=BooleanField()
            ),
            is_near=Case(
                # unsubmitted AND 0–5 days left AND not overdue
                When(
                    Q(chair_submitted_at__isnull=True)
                    & Q(deadline_date__gte=now)
                    & Q(deadline_date__lte=now + timedelta(days=5))
                    & Q(chair_submitted_at__isnull=True),
                    then=True,
                ),
                default=False,
                output_field=BooleanField()
            )
        )

        # ======================================
        # 🟦 FILTER BY DEADLINE STATUS
        # ======================================
        if filter_status == "overdue":
            qs = qs.filter(is_overdue=True)

        elif filter_status == "near":
            qs = qs.filter(is_overdue=False, is_near=True)

        elif filter_status == "on-time":
            qs = qs.filter(is_overdue=False, is_near=False)

        return qs.order_by("-updated_at")
    

class TOSReportViewSet(viewsets.ModelViewSet): 
    serializer_class = TOSReportSerializer
    permission_classes = [RolePermission("DEAN", "ADMIN", "CHAIRPERSON")] 
    pagination_class = ReportsPagination
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
    
        serializer = self.get_serializer(
            instance,
            context={"include_versions": True}  # Only enable here
        )
        
        return Response(serializer.data)
    
    def get_queryset(self):
        user = self.request.user
        role = self.request.GET.get("role")

        # 🟦 Extract search filters from query params
        filter_year = self.request.GET.get("school_year") 
        filter_course = self.request.GET.get("course")
        filter_semester = self.request.GET.get("course_semester")
        filter_term = self.request.GET.get("tos_term")
        filter_program = self.request.GET.get("program")
        filter_status = self.request.GET.get("deadline_status")  # overdue | near | on-time
        approved_only = self.request.GET.get("approved_only") == "true"

        now = timezone.now()

        base_qs = TOSReport.objects.select_related(
            "bayanihan_group", 
            "tos",
        )

        # ============================================
        # ROLE-BASED ACCESS — LATEST VERSION PER TERM
        # ============================================
        if self.action in ["list"]:
            # Latest version subquery per (bayanihan_group, term)
            latest_version_subquery = (
                TOSReport.objects.filter(
                    bayanihan_group_id=OuterRef("bayanihan_group_id"),
                    tos__term=OuterRef("tos__term"),
                )
                .order_by("-version")
                .values("version")[:1]
            )

            if role == "ADMIN":
                if not UserRole.objects.filter(user=user, role__name="ADMIN").exists():
                    raise PermissionDenied("You are not an admin.")

                qs = base_qs.annotate(
                    latest_version=Subquery(latest_version_subquery)
                ).filter(version=F("latest_version"))

            elif role == "DEAN":
                try:
                    dean_role = UserRole.objects.get(
                        user=user,
                        entity_type="College",
                        role__name="DEAN",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Dean.")

                qs = (
                    base_qs.annotate(
                        latest_version=Subquery(latest_version_subquery)
                    )
                    .filter(
                        tos__program__department__college_id=dean_role.entity_id,
                        version=F("latest_version"),
                    )
                )

            elif role == "CHAIRPERSON":
                try:
                    chair_role = UserRole.objects.get(
                        user=user,
                        entity_type="Department",
                        role__name="CHAIRPERSON",
                        entity_id__isnull=False,
                    )
                except UserRole.DoesNotExist:
                    raise PermissionDenied("You are not a Chairperson.")

                qs = (
                    base_qs.annotate(
                        latest_version=Subquery(latest_version_subquery)
                    )
                    .filter(
                        tos__program__department_id=chair_role.entity_id,
                        version=F("latest_version"),
                    )
                )
            else:
                qs = base_qs
        else:
            qs = base_qs

        # ======================================
        # 🟧 BASIC SEARCH FILTERS
        # ======================================
        if filter_year:
            qs = qs.filter(bayanihan_group__school_year=filter_year) 
        
        if filter_course:
            qs = qs.filter(
                Q(bayanihan_group__course__course_title__icontains=filter_course) |
                Q(bayanihan_group__course__course_code__icontains=filter_course)
            )

        if filter_semester:
            qs = qs.filter(
                bayanihan_group__course__course_semester__iexact=filter_semester
            ) 
            
        if filter_term:
            qs = qs.filter(
                tos__term__iexact=filter_term
            ) 

        if filter_program:
            qs = qs.filter(tos__program_id=filter_program)
            
        if approved_only:
            qs = qs.filter(
                tos__status="Approved by Chair", 
                tos__chair_approved_at__isnull=False
            )
            
        # ============================================
        # TERM-BASED DEADLINE MATCHING (with tos deadline status)
        # ============================================
        
        # Deadline table expected: tos_midterm_deadline, tos_final_deadline
        deadline_subquery = Deadline.objects.filter(
            college_id=OuterRef("tos__program__department__college_id"), 
            school_year=OuterRef("bayanihan_group__school_year"),
            semester=OuterRef("bayanihan_group__course__course_semester"), 
        ).order_by("-id")

        qs = qs.annotate(
            deadline_date=Case(
                # MIDTERM deadline — only if ACTIVE
                When(
                    tos__term="MIDTERM",
                    then=Subquery(
                        deadline_subquery
                        .filter(tos_midterm_status="ACTIVE")
                        .values("tos_midterm_deadline")[:1]
                    ),
                ),

                # FINALS deadline — only if ACTIVE
                When(
                    tos__term="FINALS",
                    then=Subquery(
                        deadline_subquery
                        .filter(tos_final_status="ACTIVE")
                        .values("tos_final_deadline")[:1]
                    ),
                ),

                # If status is INACTIVE → No deadline
                default=None,
                output_field=DateTimeField(),
            )
        )

        # ======================================
        # 🟩 DEADLINE STATUS ANNOTATIONS
        # ====================================== 
        
        qs = qs.annotate(
            is_overdue=Case( 
                When(chair_submitted_at__gt=F("deadline_date"), then=True), 
                When(chair_submitted_at__isnull=True, deadline_date__lt=now, then=True),
                default=False,
                output_field=BooleanField()
            ),
            is_near=Case(
                # unsubmitted AND 0–5 days left AND not overdue
                When(
                    Q(chair_submitted_at__isnull=True)
                    & Q(deadline_date__gte=now)
                    & Q(deadline_date__lte=now + timedelta(days=5))
                    & Q(chair_submitted_at__isnull=True),
                    then=True,
                ),
                default=False,
                output_field=BooleanField()
            )
        )

        # ======================================
        # 🟦 FILTER BY DEADLINE STATUS
        # ======================================
        if filter_status == "overdue":
            qs = qs.filter(is_overdue=True)

        elif filter_status == "near":
            qs = qs.filter(is_overdue=False, is_near=True)

        elif filter_status == "on-time":
            qs = qs.filter(is_overdue=False, is_near=False)

        return qs.order_by("-updated_at")

