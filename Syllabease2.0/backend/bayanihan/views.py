from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action 
from rest_framework.response import Response

from django.db.models import Exists, OuterRef, Q
from django.db.models.deletion import ProtectedError

from .models import BayanihanGroup
from users.models import UserRole
from syllabi.models import Syllabus
from bayanihan.models import BayanihanGroupUser 
from tos.models import TOS

from .serializers import BayanihanGroupSerializer, BayanihanGroupReadSerializer 
from .pagination import BayanihanPagination

from users.permissions import RolePermission


class BayanihanGroupViewSet(viewsets.ModelViewSet): 
    permission_classes = [RolePermission("ADMIN", "CHAIRPERSON", "BAYANIHAN_LEADER", "BAYANIHAN_TEACHER", "AUDITOR", "DEAN")]
    pagination_class = BayanihanPagination  # ✅ Add this line
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {"This Bayanihan Team cannot be deleted because a Syllabus or TOS already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_204_NO_CONTENT) 
    
    def get_serializer_class(self):
        if self.action in ["without_syllabus", "list"]:
            return BayanihanGroupReadSerializer
        return BayanihanGroupSerializer

    def get_queryset(self):
        user = self.request.user
        role = self.request.GET.get("role")  

        # Base queryset
        qs = (
            BayanihanGroup.objects.select_related("course")
            .prefetch_related("bayanihan_members__user")
            .order_by("-created_at")
        )
 
        # Only enforce role filtering for list
        if self.action in ["list"]:
            if role == "ADMIN":
                if not UserRole.objects.filter(user=user, role__name="ADMIN").exists():
                    raise PermissionDenied("You are not an admin.") 
                pass
    
            elif role == "CHAIRPERSON":
                if not UserRole.objects.filter(user=user, role__name="CHAIRPERSON").exists():
                    raise PermissionDenied("You are not a chairperson.")
    
                chair_roles = UserRole.objects.filter(
                    user=user, role__name="CHAIRPERSON", entity_type="Department"
                )
                department_ids = [ur.entity_id for ur in chair_roles if ur.entity_id]

                if not department_ids:
                    raise PermissionDenied("No department assigned for this chairperson.")

                qs = qs.filter(course__curriculum__program__department_id__in=department_ids)
            
            elif role == "BAYANIHAN_LEADER":
                if not UserRole.objects.filter(user=user, role__name="BAYANIHAN_LEADER").exists():
                    raise PermissionDenied("You are not a bayanihan leader.")
                
                leader_groups = BayanihanGroupUser.objects.filter(
                    user=user, role="LEADER"
                ).values_list("group_id", flat=True)

                if not leader_groups:
                    raise PermissionDenied("You are not a part of any Bayanihan Team.")

                qs = qs.filter(id__in=leader_groups)
            
            elif role == "BAYANIHAN_TEACHER":
                if not UserRole.objects.filter(user=user, role__name="BAYANIHAN_TEACHER").exists():
                    raise PermissionDenied("You are not a bayanihan teacher.")
                
                teacher_groups = BayanihanGroupUser.objects.filter(
                    user=user, role="TEACHER"
                ).values_list("group_id", flat=True)

                if not teacher_groups:
                    raise PermissionDenied("You are not a part of any Bayanihan Team.")

                qs = qs.filter(id__in=teacher_groups)
                
            else:
                raise PermissionDenied("Invalid or missing role parameter.")

        # ✅ FILTERS
        year_level = self.request.GET.get("year_level")
        program = self.request.GET.get("program")
        school_year = self.request.GET.get("school_year")
        semester = self.request.GET.get("semester")
        search = self.request.GET.get("search")

        if year_level:
            qs = qs.filter(course__course_year_level__iexact=year_level)
            
        if program:
            qs = qs.filter(course__curriculum__program=program)
            
        if school_year:
            qs = qs.filter(school_year__iexact=school_year)

        if semester:
            qs = qs.filter(course__course_semester__iexact=semester)

        if search:
            qs = qs.filter(
                Q(course__course_code__icontains=search)
                | Q(course__course_title__icontains=search)
            )

        return qs 
    
    @action(detail=False, methods=["get"], url_path="without-syllabus")
    def without_syllabus(self, request):
        """ 
        Returns groups with their courses that do not have a syllabus yet. 
        - ADMINs can see all Bayanihan groups without syllabi.
        - BAYANIHAN_LEADERs can only see their groups without syllabi. 
        Usage: GET /api/academics/courses/without-syllabus?role=ADMIN
        """
        user = request.user
        role = request.query_params.get("role")     

        if not role:
            raise PermissionDenied("Role parameter is required.")
        role = role.upper() 

        # Build base queryset
        qs = BayanihanGroup.objects.select_related("course")

        if role == "ADMIN" and UserRole.objects.filter(user=user, role__name="ADMIN").exists():
            pass  # Admins can see all
         
        elif role == "BAYANIHAN_LEADER" and UserRole.objects.filter(user=user, role__name="BAYANIHAN_LEADER").exists():
            leader_groups = BayanihanGroupUser.objects.filter(
                user=user, role="LEADER"
            ).values_list("group_id", flat=True)

            if not leader_groups:
                return Response(
                    {"detail": "You are not a leader in any Bayanihan group."},
                    status=403,
                )
            qs = qs.filter(id__in=leader_groups)

        else:
            raise PermissionDenied("You do not have permission to get this data.") 

        # Subquery: check if a syllabus exists for this group
        has_syllabus = Syllabus.objects.filter(
            bayanihan_group_id=OuterRef("pk")
        )  
        # Final filtering: groups without a syllabus
        qs = (
            qs.annotate(has_syllabus=Exists(has_syllabus))
            .filter(has_syllabus=False)
            .order_by("school_year")
        )
        
        return Response(self.get_serializer(qs, many=True).data)
    
    @action(detail=False, methods=["get"], url_path="by-syllabus/(?P<syllabus_id>[^/.]+)")
    def by_syllabus(self, request, syllabus_id=None):
        """
        Fetch the BayanihanGroup (with members) that is linked to a given syllabus_id.
        """
        try:
            syllabus = Syllabus.objects.get(id=syllabus_id)
        except Syllabus.DoesNotExist:
            return Response({"detail": "Syllabus not found."}, status=status.HTTP_404_NOT_FOUND)

        group = syllabus.bayanihan_group
        if not group:
            return Response({"detail": "This syllabus has no Bayanihan group."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BayanihanGroupReadSerializer(group, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"], url_path="by-tos/(?P<tos_id>[^/.]+)")
    def by_tos(self, request, tos_id=None):
        """
        Fetch the BayanihanGroup (with members) that is linked to a given tos_id.
        """
        try:
            tos = TOS.objects.get(id=tos_id)
        except TOS.DoesNotExist:
            return Response({"detail": "TOS not found."}, status=status.HTTP_404_NOT_FOUND)

        group = tos.bayanihan_group
        if not group:
            return Response({"detail": "This TOS has no Bayanihan group."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BayanihanGroupReadSerializer(group, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

