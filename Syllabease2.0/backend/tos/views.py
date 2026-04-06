from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response  
from django.http import FileResponse, JsonResponse
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.contenttypes.models import ContentType
from django.db.models import F, OuterRef, Subquery, Q
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from shared.models import TOSReport

from .models import TOS, TOSComment, TOSRow, TOSTemplate
from auditlog.models import LogEntry
from bayanihan.models import BayanihanGroupUser 
from users.models import UserRole 

from .serializers import (
  TOSCommentSerializer,
  TOSListSerializer,
  TOSDetailSerializer,
  TOSCreateSerializer,
  TOSTemplateSerializer,
  TOSUpdateSerializer,
  TOSVersionSerializer, 
  TOSRowSerializer,
)
from .pagination import TOSPagination

from users.permissions import RolePermission

import os
from docxtpl import DocxTemplate, RichText, InlineImage, Subdoc 
from docx.shared import Pt, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from bs4 import BeautifulSoup 
from urllib.parse import urlsplit, urlunsplit
import sys
import io
import requests
import tempfile

if sys.platform == "win32":
    import pythoncom
    from docx2pdf import convert
else:
    pythoncom = None
    convert = None

import platform
import subprocess
    
from urllib.parse import urlparse

# Create your views here.
class TOSTemplateViewSet(viewsets.ModelViewSet):
    queryset = TOSTemplate.objects.all().order_by("-created_at")
    serializer_class = TOSTemplateSerializer
    permission_classes = [RolePermission("ADMIN")] 

    @action(detail=False, methods=["get"], url_path="latest")
    def latest_template(self, request):
        """Fetch the latest active template"""
        latest = TOSTemplate.objects.filter(is_active=True).order_by("-revision_no").first()
        if not latest:
            return Response({"detail": "No active TOS template found."}, status=404)
        serializer = self.get_serializer(latest)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Treat 'create' as an update event — always create a new revision_no
        instead of modifying existing.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


def convert_docx_to_pdf(input_path, output_path):
    """
    Cross-platform DOCX → PDF converter.
    - Windows  → docx2pdf (Microsoft Word COM)
    - Linux/Mac → LibreOffice (headless)
    """

    system = platform.system().lower()

    # --- WINDOWS: Use docx2pdf ---
    if system == "windows":
        try:
            convert(input_path, output_path)
        except Exception as e:
            raise RuntimeError(f"docx2pdf conversion failed: {e}")
        return output_path

    # --- Linux / macOS: Use LibreOffice ---
    try:
        result = subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                input_path,
                "--outdir", os.path.dirname(output_path),
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"LibreOffice failed with code {result.returncode}: {result.stderr}"
            )

        return output_path

    except FileNotFoundError:
        raise RuntimeError(
            "LibreOffice is not installed. Install via: sudo apt install libreoffice"
        )
    
class TOSViewSet(viewsets.ModelViewSet):
    permission_classes = [RolePermission("ADMIN", "BAYANIHAN_LEADER", "BAYANIHAN_TEACHER", "CHAIRPERSON", "AUDITOR")] 
    pagination_class = TOSPagination
    
    def get_queryset(self):
        user = self.request.user
        role = (self.request.GET.get("role") or "").upper()

        # === Base queryset ===
        qs = TOS.objects.select_related(
            "tos_template", "syllabus", "user", "bayanihan_group", "course", "program"
        ).prefetch_related("tos_rows").order_by("-created_at")
        
        # === Role-based filtering (only for list) ===
        if self.action in ["list"]:
            # --- ADMIN ---
            if role == "ADMIN":
                if not UserRole.objects.filter(user=user, role__name="ADMIN").exists():
                    raise PermissionDenied("You are not an admin.")

                latest_sub = (
                    TOS.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"),
                        term=OuterRef("term"),
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = qs.annotate(latest_version=Subquery(latest_sub)).filter(
                    version=F("latest_version")
                )

            # --- BAYANIHAN LEADER ---
            elif role == "BAYANIHAN_LEADER":
                leader_groups = BayanihanGroupUser.objects.filter(
                    user=user, role="LEADER"
                ).values_list("group_id", flat=True)

                if not leader_groups:
                    raise PermissionDenied("You are not a leader in any Bayanihan group.")

                latest_sub = (
                    TOS.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"),
                        term=OuterRef("term"),
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = qs.annotate(latest_version=Subquery(latest_sub)).filter(
                    bayanihan_group_id__in=leader_groups,
                    version=F("latest_version")
                )

            # --- BAYANIHAN TEACHER ---
            elif role == "BAYANIHAN_TEACHER":
                teacher_groups = BayanihanGroupUser.objects.filter(
                    user=user, role="TEACHER"
                ).values_list("group_id", flat=True)

                if not teacher_groups:
                    raise PermissionDenied("You are not a teacher in any Bayanihan group.")

                latest_sub = (
                    TOS.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"),
                        term=OuterRef("term"),
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = qs.annotate(latest_version=Subquery(latest_sub)).filter(
                    bayanihan_group_id__in=teacher_groups,
                    version=F("latest_version")
                )

            # --- CHAIRPERSON ---
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
                    raise PermissionDenied("Multiple Chairperson roles found. Contact admin.")

                latest_sub = (
                    TOS.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"),
                        chair_submitted_at__isnull=False,
                        term=OuterRef("term"),
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = qs.annotate(latest_chair_version=Subquery(latest_sub)).filter(
                    program__department_id=chair_role.entity_id,
                    version=F("latest_chair_version")
                )

            # --- AUDITOR ---
            elif role == "AUDITOR":
                if not UserRole.objects.filter(user=user, role__name="AUDITOR").exists():
                    raise PermissionDenied("You are not an Auditor.")

                latest_sub = (
                    TOS.objects.filter(
                        bayanihan_group_id=OuterRef("bayanihan_group_id"),
                        chair_approved_at__isnull=False,
                        term=OuterRef("term"),
                    )
                    .order_by("-version")
                    .values("version")[:1]
                )

                qs = qs.annotate(latest_version=Subquery(latest_sub)).filter(
                    version=F("latest_version")
                )

            else:
                raise PermissionDenied("Invalid role parameter.")

        # === Filters (apply to all roles) ===
        year_level = self.request.GET.get("year_level")
        program = self.request.GET.get("program")
        semester = self.request.GET.get("semester")
        school_year = self.request.GET.get("school_year")
        status = self.request.GET.get("status")
        search = self.request.GET.get("search")

        if year_level:
            qs = qs.filter(course__course_year_level__iexact=year_level)
        if program:
            qs = qs.filter(program_id=program)
        if semester:
            qs = qs.filter(course__course_semester__iexact=semester)
        if school_year:
            qs = qs.filter(bayanihan_group__school_year__iexact=school_year)
        if status:
            qs = qs.filter(status__iexact=status)
        if search:
            qs = qs.filter(
                Q(course__course_code__icontains=search)
                | Q(course__course_title__icontains=search)
            )

        # === Optional: return all if ?all=true (for dropdowns) ===
        if self.request.GET.get("all") == "true":
            self.pagination_class = None

        return qs.order_by("-created_at")
    
    def get_serializer_class(self):
        if self.action == "create":
            return TOSCreateSerializer
        if self.action in ["update", "partial_update"]:
            return TOSUpdateSerializer
        if self.action == "list":
            return TOSListSerializer
        if self.action == "retrieve":
            return TOSDetailSerializer 
        return TOSDetailSerializer 
        
    @action(detail=True, methods=["get"], url_path="tos-versions")
    def get_tos_versions(self, request, pk=None):
        tos = self.get_object()

        try: 
            tos_versions = TOS.objects.filter(
                bayanihan_group_id=tos.bayanihan_group_id,
                term=tos.term
            ).order_by("-version")  # optional: order by version desc
        except TOS.DoesNotExist:
            return Response(
                {"detail": "No versions found for this TOS."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TOSVersionSerializer(tos_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="submit-tos")
    def submit_tos(self, request, pk=None):
        tos = self.get_object()
        user = request.user
        
        role = request.query_params.get("role")      
        if not role:
            raise PermissionDenied("Role parameter is required.") 
        role = role.upper()  
        allowed = False 
        # ADMIN can always submit
        if role == "ADMIN" and UserRole.objects.filter(user=user, role__name="ADMIN").exists():
            allowed = True 
        # BAYANIHAN_LEADER can submit only for their groups
        elif role == "BAYANIHAN_LEADER" and UserRole.objects.filter(user=user, role__name="BAYANIHAN_LEADER").exists():
            leader_group_ids = BayanihanGroupUser.objects.filter(
                user=user, role="LEADER"
            ).values_list("group_id", flat=True)
            if tos.bayanihan_group.id in leader_group_ids:
                allowed = True 
        if not allowed:
            raise PermissionDenied("You do not have permission to submit this TOS.")

        # Status update logic
        if tos.status == "Draft":
            tos.status = "Pending Chair Review"
            tos.chair_submitted_at = timezone.now()
        elif tos.status == "Requires Revision":
            tos.status = "Revisions Applied"
            tos.chair_submitted_at = timezone.now()
        else:
            return Response(
                {"detail": "TOS cannot be submitted from its current status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tos.save()
        tos.refresh_from_db()
        
        # --- ✅ Update or create TOS Report record for this TOS ---
        try:
            report = TOSReport.objects.get(tos=tos)
        except TOSReport.DoesNotExist:
            report = TOSReport.objects.create(
                bayanihan_group=tos.bayanihan_group,
                tos=tos,
                version=tos.version,
            )  
        report.mark_chair_submitted()

        # Return minimal info via serializer
        serializer = TOSDetailSerializer(tos)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["patch"], url_path="review-tos")
    @transaction.atomic
    def review_tos(self, request, pk=None):
        tos = self.get_object()
        user = request.user
        
        role = request.query_params.get("role") 
        if not role:
            raise PermissionDenied("Role parameter is required.")
        role = role.upper() 
        allowed = False
        if role == "ADMIN" and UserRole.objects.filter(user=user, role__name="ADMIN").exists():
            allowed = True
        elif role == "CHAIRPERSON":
            chair_dept_ids = UserRole.objects.filter(
                user=user,
                entity_type="Department",
                role__name="CHAIRPERSON",
            ).values_list("entity_id", flat=True)
            if tos.program.department_id in chair_dept_ids:
                allowed = True
        if not allowed:
            raise PermissionDenied("You do not have permission to review this TOS as Chairperson.")

        decision = request.data.get("decision")
        if decision not in ["approve", "reject"]:
            return Response(
                {"detail": "Invalid decision. Must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if decision == "approve":
            tos.status = "Approved by Chair"
            tos.chair_approved_at = timezone.now()
            tos.save()
        else:  
            tos.status = "Returned by Chair"
            tos.chair_returned_at = timezone.now()
            tos.save()

        # ✅ Ensure TOS Report record exists
        report, _ = TOSReport.objects.get_or_create(
            tos=tos,
            defaults={
                "bayanihan_group": tos.bayanihan_group,
                "version": tos.version,
            },
        )
        if decision == "approve":
            report.mark_chair_approved()
        else:
            report.mark_chair_returned()
                
        tos_data = TOSDetailSerializer(tos).data
        return Response(tos_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["put"], url_path="update-rows")
    def update_rows(self, request, pk=None):
        """
        Update all rows of a specific TOS.
        """
        try:
            tos = self.get_object()
        except TOS.DoesNotExist:
            return Response({"detail": "TOS not found."}, status=status.HTTP_404_NOT_FOUND)

        rows_data = request.data.get("rows", [])
        if not isinstance(rows_data, list):
            return Response({"detail": "Invalid payload format."}, status=status.HTTP_400_BAD_REQUEST)

        updated_rows = []
        for row in rows_data:
            try:
                row_instance = TOSRow.objects.get(id=row["id"], tos=tos)
            except TOSRow.DoesNotExist:
                continue  # skip invalid rows

            serializer = TOSRowSerializer(row_instance, data=row, partial=True)
            if serializer.is_valid():
                serializer.save()
                updated_rows.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({"updated_rows": updated_rows}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["post"], url_path="replicate-tos")
    @transaction.atomic
    def replicate_tos(self, request, pk=None):
        tos = self.get_object()
        user = request.user
 
        if tos.status != "Returned by Chair":
            return Response(
                {"detail": "Replication allowed only for returned TOS."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Only Bayanihan Leader of that group (or Admin) can replicate
        role = request.query_params.get("role", "").upper()
        allowed = False
        if role == "ADMIN" and UserRole.objects.filter(user=user, role__name="ADMIN").exists():
            allowed = True
        elif role == "BAYANIHAN_LEADER":
            leader_group_ids = BayanihanGroupUser.objects.filter(
                user=user, role="LEADER"
            ).values_list("group_id", flat=True)
            if tos.bayanihan_group_id in leader_group_ids:
                allowed = True

        if not allowed:
            raise PermissionDenied("You do not have permission to replicate this TOS.")
 
        new_tos = TOS.objects.create(
            tos_template=tos.tos_template,
            effective_date=tos.effective_date,
            syllabus=tos.syllabus, 
            user=tos.user, 
            course=tos.course, 
            program=tos.program,
            bayanihan_group=tos.bayanihan_group, 
            
            term=tos.term,

            total_items=tos.total_items,
            col1_percentage=tos.col1_percentage,
            col2_percentage=tos.col2_percentage,
            col3_percentage=tos.col3_percentage,
            col4_percentage=tos.col4_percentage,
            col1_expected=tos.col1_expected,
            col2_expected=tos.col2_expected,
            col3_expected=tos.col3_expected,
            col4_expected=tos.col4_expected,
            
            tos_cpys=tos.tos_cpys,
            chair=tos.chair,
            
            chair_submitted_at=None,
            chair_returned_at=None, 
            chair_approved_at=None, 
            
            version=tos.version + 1,
            status="Requires Revision",
        )  

        # ✅ Clone course outcomes
        rows = TOSRow.objects.filter(tos=tos)
        for row in rows:
            TOSRow.objects.create(
                tos=new_tos, 
                topic=row.topic,
                no_hours=row.no_hours,
                percent=row.percent,
                no_items=row.no_items,

                col1_value=row.col1_value,
                col2_value=row.col2_value,
                col3_value=row.col3_value,
                col4_value=row.col4_value,
            )  
            
        # Create another TOS Report record (next version)
        TOSReport.objects.create(
            tos=new_tos,
            bayanihan_group=new_tos.bayanihan_group, 
            version=new_tos.version,
        )
            
        new_tos_data = TOSDetailSerializer(new_tos).data
        return Response(new_tos_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["get"], url_path="audit-logs")
    def get_audit_logs(self, request, pk=None):
        tos = self.get_object()

        logs = LogEntry.objects.get_for_object(tos).select_related("actor").order_by("-timestamp")

        results = []
        for log in logs:
            results.append({
                "id": log.id,
                "event": log.get_action_display(),  # CREATE / UPDATE / DELETE
                "user": {
                    "firstname": getattr(log.actor, "first_name", ""),
                    "lastname": getattr(log.actor, "last_name", ""),
                },
                "changes": {
                    field: {"old": values[0], "new": values[1]}
                    for field, values in log.changes_dict.items()
                },
                "created_at": log.timestamp,
            })

        return Response(results, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["patch"], url_path="update-dates")
    def update_dates(self, request, pk=None):
        tos = self.get_object()
        serializer = TOSVersionSerializer(
            tos, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["get"])
    def export_docx(self, request, pk=None):
        # Windows-only COM initialization
        is_windows = platform.system().lower() == "windows"

        if is_windows and pythoncom is not None:
            pythoncom.CoInitialize() 
           
        def url_to_local_file(url):
            """Convert absolute URL to local MEDIA_ROOT path."""
            if not url:
                return None

            response = requests.get(url)
            if response.status_code != 200:
                return None

            # Create a temporary file
            suffix = os.path.splitext(url)[1] or ".png"
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            tmp_file.write(response.content)
            tmp_file.flush()
            tmp_file.close()
            return tmp_file.name

        def get_public_url(url: str):
            parts = urlsplit(url)
            # Remove querystring (signed params)
            clean = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
            return clean
         
        try:
            tos = self.get_object()  
            template_path = os.path.join(settings.BASE_DIR, "tos", "templates", "TOSTemplate.docx")
            doc = DocxTemplate(template_path) 

            # ---------- Get Course Outcomes of Syllabus Associated with TOS ----------
            course_outcomes = []
            if tos.syllabus:
                for co in tos.syllabus.course_outcomes.all():
                    course_outcomes.append({
                        "co_code": co.co_code,
                        "co_description": co.co_description,
                    }) 
            
             # ---------- Build Course Outline ---------- 
            tos_rows = []
            
            # Initialize totals
            totals = {
                "total_hours": 0,
                "total_percent": 0,
                "total_items": 0,
                "total_col1": 0,
                "total_col2": 0,
                "total_col3": 0,
                "total_col4": 0,
            }
            
            for row in tos.tos_rows.all():
                # Convert to float/int safely
                no_hours = int(row.no_hours or 0)
                percent = int(row.percent or 0)
                no_items = int(row.no_items or 0)
                col1_value = int(row.col1_value or 0)
                col2_value = int(row.col2_value or 0)
                col3_value = int(row.col3_value or 0)
                col4_value = int(row.col4_value or 0)

                # Append row
                tos_rows.append({
                    "topic": row.topic or "",
                    "no_hours": no_hours,
                    "percent": percent,
                    "no_items": no_items,
                    "col1_value": col1_value,
                    "col2_value": col2_value,
                    "col3_value": col3_value,
                    "col4_value": col4_value,
                })

                # Add to totals
                totals["total_hours"] += no_hours
                totals["total_percent"] += percent
                totals["total_items"] += no_items
                totals["total_col1"] += col1_value
                totals["total_col2"] += col2_value
                totals["total_col3"] += col3_value
                totals["total_col4"] += col4_value
            
            def safe_percentage(value):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    return 0    
            
            # --- Leaders ---
            leaders = [
                m for m in tos.bayanihan_group.bayanihan_members.all()
                if m.role == "LEADER"
            ]
            leaders_context = []
            for m in leaders:
                sig_url = getattr(m.user, "signature", None)
                clean_url = get_public_url(sig_url.url) if sig_url else None
                
                local_sig_path = url_to_local_file(clean_url) if clean_url else None 
                leaders_context.append({
                    "fname": m.user.first_name,
                    "lname": m.user.last_name,
                    "signature": InlineImage(doc, local_sig_path, width=Mm(20)) if local_sig_path else "",
                })   

            # --- Chairperson ---
            chair_name = tos.chair.get("name") if tos.chair else ""
            chair_sig_url = tos.chair.get("signature") if tos.chair else None
            chair_sig_path = url_to_local_file(chair_sig_url) if chair_sig_url else None
            chair_signature = InlineImage(doc, chair_sig_path, width=Mm(20)) if chair_sig_path else ""
            
            def checkbox(term_name, current_term):
                return "✓" if current_term and current_term.lower() == term_name.lower() else ""

            # 2. Prepare context with TOS fields
            context = {
                "version": (
                    f"{int(tos.tos_template.revision_no):02d}"
                    if tos.tos_template and tos.tos_template.revision_no is not None
                    else ""
                ),
                "effective_date": tos.effective_date.strftime("%m.%d.%y") if tos.effective_date else "",
                "course_code": getattr(tos.course, "course_code", ""),
                "course_title": getattr(tos.course, "course_title", ""),
                "school_year": getattr(tos.bayanihan_group, "school_year", ""),
                "course_semester": getattr(tos.course, "course_semester", "").lower(),
                "tos_cpys": tos.tos_cpys or "",
                "chair_submitted_at": tos.chair_submitted_at.strftime("%B %d, %Y") if tos.chair_submitted_at else "",
                "course_outcomes": course_outcomes,
                "col1_percentage": safe_percentage(tos.col1_percentage),
                "col2_percentage": safe_percentage(tos.col2_percentage),
                "col3_percentage": safe_percentage(tos.col3_percentage),
                "col4_percentage": safe_percentage(tos.col4_percentage),
                "tos_rows": tos_rows,
                "totals": totals, 
                
                "prelim_box": checkbox("Prelim", tos.term),
                "midterm_box": checkbox("Midterm", tos.term),
                "semifinal_box": checkbox("Semi-Finals", tos.term),
                "final_box": checkbox("Finals", tos.term),
                
                # Signatories 
                "leaders": leaders_context,
                "chair": chair_name,
                "chair_signature": chair_signature,
            }

            # 3. Render the DOCX with data
            doc.render(context)

            # ---------- Save DOCX directly to Spaces ----------
            timestamp = tos.chair_approved_at.strftime("%Y-%m-%d") if tos.chair_approved_at else "NA"
            filename_docx = (
                f"TOS-{tos.term}-{tos.course.course_code}-"
                f"{tos.course.course_semester.lower()} Semester-"
                f"{tos.bayanihan_group.school_year}-{tos.status}-{timestamp}.docx"
            )

            file_bytes = io.BytesIO()
            doc.save(file_bytes)
            file_bytes.seek(0)

            docx_path = default_storage.save(
                f"tos/{filename_docx}",
                ContentFile(file_bytes.read())
            )

            docx_url = default_storage.url(docx_path)

            return JsonResponse({"docx_url": docx_url})
            
            # filename_pdf = filename_docx.replace(".docx", ".pdf")  

            # # Use a temp directory so we can run LibreOffice/win32com conversion
            # with tempfile.TemporaryDirectory() as tmpdir:
            #     temp_docx = os.path.join(tmpdir, filename_docx)
            #     temp_pdf = os.path.join(tmpdir, filename_pdf)

            #     # Save generated .docx locally for conversion
            #     doc.save(temp_docx)

            #     # Convert DOCX -> PDF
            #     convert_docx_to_pdf(temp_docx, temp_pdf)

            #     # Read PDF file
            #     with open(temp_pdf, "rb") as f:
            #         pdf_bytes = f.read()

            #     # Upload to DigitalOcean Spaces
            #     pdf_path = default_storage.save(
            #         f"tos/{filename_pdf}",  # folder inside bucket
            #         ContentFile(pdf_bytes)
            #     )

            # # Get the public URL for the browser to download
            # pdf_url = default_storage.url(pdf_path)
 
            # # 9️⃣ Return PDF as HTTP response
            # return JsonResponse({"pdf_url": pdf_url})
            # return FileResponse(open(output_pdf, "rb"), content_type="application/pdf")  
            
        finally:
            if is_windows and pythoncom is not None:
                pythoncom.CoUninitialize() 

    @action(detail=True, methods=["get"])
    def export_pdf(self, request, pk=None):
        # Windows-only COM initialization
        is_windows = platform.system().lower() == "windows"

        if is_windows and pythoncom is not None:
            pythoncom.CoInitialize() 
           
        def url_to_local_file(url):
            """Convert absolute URL to local MEDIA_ROOT path."""
            if not url:
                return None

            response = requests.get(url)
            if response.status_code != 200:
                return None

            # Create a temporary file
            suffix = os.path.splitext(url)[1] or ".png"
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            tmp_file.write(response.content)
            tmp_file.flush()
            tmp_file.close()
            return tmp_file.name

        def get_public_url(url: str):
            parts = urlsplit(url)
            # Remove querystring (signed params)
            clean = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
            return clean
         
        try:
            tos = self.get_object()  
            template_path = os.path.join(settings.BASE_DIR, "tos", "templates", "TOSTemplate.docx")
            doc = DocxTemplate(template_path) 

            # ---------- Get Course Outcomes of Syllabus Associated with TOS ----------
            course_outcomes = []
            if tos.syllabus:
                for co in tos.syllabus.course_outcomes.all():
                    course_outcomes.append({
                        "co_code": co.co_code,
                        "co_description": co.co_description,
                    }) 
            
             # ---------- Build Course Outline ---------- 
            tos_rows = []
            
            # Initialize totals
            totals = {
                "total_hours": 0,
                "total_percent": 0,
                "total_items": 0,
                "total_col1": 0,
                "total_col2": 0,
                "total_col3": 0,
                "total_col4": 0,
            }
            
            for row in tos.tos_rows.all():
                # Convert to float/int safely
                no_hours = int(row.no_hours or 0)
                percent = int(row.percent or 0)
                no_items = int(row.no_items or 0)
                col1_value = int(row.col1_value or 0)
                col2_value = int(row.col2_value or 0)
                col3_value = int(row.col3_value or 0)
                col4_value = int(row.col4_value or 0)

                # Append row
                tos_rows.append({
                    "topic": row.topic or "",
                    "no_hours": no_hours,
                    "percent": percent,
                    "no_items": no_items,
                    "col1_value": col1_value,
                    "col2_value": col2_value,
                    "col3_value": col3_value,
                    "col4_value": col4_value,
                })

                # Add to totals
                totals["total_hours"] += no_hours
                totals["total_percent"] += percent
                totals["total_items"] += no_items
                totals["total_col1"] += col1_value
                totals["total_col2"] += col2_value
                totals["total_col3"] += col3_value
                totals["total_col4"] += col4_value
            
            def safe_percentage(value):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    return 0    
            
            # --- Leaders ---
            leaders = [
                m for m in tos.bayanihan_group.bayanihan_members.all()
                if m.role == "LEADER"
            ]
            leaders_context = []
            for m in leaders:
                sig_url = getattr(m.user, "signature", None)
                clean_url = get_public_url(sig_url.url) if sig_url else None
                
                local_sig_path = url_to_local_file(clean_url) if clean_url else None 
                leaders_context.append({
                    "fname": m.user.first_name,
                    "lname": m.user.last_name,
                    "signature": InlineImage(doc, local_sig_path, width=Mm(20)) if local_sig_path else "",
                })   

            # --- Chairperson ---
            chair_name = tos.chair.get("name") if tos.chair else ""
            chair_sig_url = tos.chair.get("signature") if tos.chair else None
            chair_sig_path = url_to_local_file(chair_sig_url) if chair_sig_url else None
            chair_signature = InlineImage(doc, chair_sig_path, width=Mm(20)) if chair_sig_path else ""
            
            def checkbox(term_name, current_term):
                return "✓" if current_term and current_term.lower() == term_name.lower() else ""

            # 2. Prepare context with TOS fields
            context = {
                "version": (
                    f"{int(tos.tos_template.revision_no):02d}"
                    if tos.tos_template and tos.tos_template.revision_no is not None
                    else ""
                ),
                "effective_date": tos.effective_date.strftime("%m.%d.%y") if tos.effective_date else "",
                "course_code": getattr(tos.course, "course_code", ""),
                "course_title": getattr(tos.course, "course_title", ""),
                "school_year": getattr(tos.bayanihan_group, "school_year", ""),
                "course_semester": getattr(tos.course, "course_semester", "").lower(),
                "tos_cpys": tos.tos_cpys or "",
                "chair_submitted_at": tos.chair_submitted_at.strftime("%B %d, %Y") if tos.chair_submitted_at else "",
                "course_outcomes": course_outcomes,
                "col1_percentage": safe_percentage(tos.col1_percentage),
                "col2_percentage": safe_percentage(tos.col2_percentage),
                "col3_percentage": safe_percentage(tos.col3_percentage),
                "col4_percentage": safe_percentage(tos.col4_percentage),
                "tos_rows": tos_rows,
                "totals": totals, 
                
                "prelim_box": checkbox("Prelim", tos.term),
                "midterm_box": checkbox("Midterm", tos.term),
                "semifinal_box": checkbox("Semi-Finals", tos.term),
                "final_box": checkbox("Finals", tos.term),
                
                # Signatories 
                "leaders": leaders_context,
                "chair": chair_name,
                "chair_signature": chair_signature,
            }

            # 3. Render the DOCX with data
            doc.render(context)

            # ---------- Save DOCX directly to Spaces ----------
            timestamp = tos.chair_approved_at.strftime("%Y-%m-%d") if tos.chair_approved_at else "NA"
            filename_docx = (
                f"TOS-{tos.term}-{tos.course.course_code}-"
                f"{tos.course.course_semester.lower()} Semester-"
                f"{tos.bayanihan_group.school_year}-{tos.status}-{timestamp}.docx"
            ) 
            
            filename_pdf = filename_docx.replace(".docx", ".pdf")  

            # Use a temp directory so we can run LibreOffice/win32com conversion
            with tempfile.TemporaryDirectory() as tmpdir:
                temp_docx = os.path.join(tmpdir, filename_docx)
                temp_pdf = os.path.join(tmpdir, filename_pdf)

                # Save generated .docx locally for conversion
                doc.save(temp_docx)

                # Convert DOCX -> PDF
                convert_docx_to_pdf(temp_docx, temp_pdf)

                # Read PDF file
                with open(temp_pdf, "rb") as f:
                    pdf_bytes = f.read()

                # Upload to DigitalOcean Spaces
                pdf_path = default_storage.save(
                    f"tos/{filename_pdf}",  # folder inside bucket
                    ContentFile(pdf_bytes)
                )

            # Get the public URL for the browser to download
            pdf_url = default_storage.url(pdf_path)
 
            # 9️⃣ Return PDF as HTTP response
            return JsonResponse({"pdf_url": pdf_url})
            # return FileResponse(open(output_pdf, "rb"), content_type="application/pdf")  
            
        finally:
            if is_windows and pythoncom is not None:
                pythoncom.CoUninitialize() 


class TOSCommentViewSet(viewsets.ModelViewSet):
    queryset = TOSComment.objects.select_related("user", "tos", "tos_row")
    serializer_class = TOSCommentSerializer
    permission_classes = [RolePermission("ADMIN", "BAYANIHAN_LEADER", "BAYANIHAN_TEACHER")]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 

    @action(detail=False, methods=["get"])
    def by_tos_context(self, request):
        tos_id = request.query_params.get("tos_id") 
        target = request.query_params.get("target")
        
        if not tos_id:
            return Response(
                {"detail": "The 'tos_id' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        # Start with all comments for the given TOS
        comments = self.queryset.filter(tos_id=tos_id)

        # Apply grouping/filtering based on the 'target' parameter
        if target == "tos":
            # Filter for comments that apply to the whole TOS (tos_row is NULL)
            comments = comments.filter(tos_row__isnull=True)
            
        elif target == "row":
            # Filter for comments that apply to a specific TOSRow (tos_row is NOT NULL)
            comments = comments.filter(tos_row__isnull=False)

        # Order the results (e.g., sort by creation date and then by row ID for 'row' target)
        if target == "row":
            # Order by TOSRow ID (to group rows together) then by creation date
            comments = comments.order_by(F('tos_row').asc(nulls_last=True), 'created_at')
        else:
            # Default ordering
            comments = comments.order_by('-created_at')

        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)