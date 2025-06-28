from io import BytesIO
from docx import Document

from django.http import StreamingHttpResponse
from django.conf import settings

from django.shortcuts import get_object_or_404


from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    CreateAPIView,
    UpdateAPIView,
    RetrieveUpdateDestroyAPIView
)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from app.users.permissions import IsOwnerOrReadOnly

from core.permissions import TeachersPermission
from core.paginations import LargeNumberOfData
from .models import (
    College,
    Department,
    Post,
    SchoolYear,
    YearLevel,
    Section,
    Subject,
    Class,
    Status,
    Attendance
)

from .serializers import (
    CollegeSerializer,
    DepartmentSerializer,
    PostSerializers,
    SchoolYearSerializer,
    YearLevelSerializer,
    SectionSerializer,
    StatusSerializer,
    SubjectSerializer,
    AttendanceSerializer,
    ClassSerializer,
    StudentClassSerializers,
)
# Create your views here.
class SchoolYearListAPIView(ListAPIView):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [IsAuthenticated]

class YearLevelListAPIView(ListAPIView):
    queryset = YearLevel.objects.all()
    serializer_class = YearLevelSerializer
    permission_classes = [IsAuthenticated]


class CollegeListAPIView(ListAPIView):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticated]


class DepartmentListAPIView(ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class SectionListAPIView(ListAPIView):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]

class StatusListAPIView(ListAPIView):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [IsAuthenticated]

class SubjectListAPIView(ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

class ClassListAPIView(ListCreateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [TeachersPermission, IsAuthenticated]

    def filter_queryset(self, queryset):
        ay_sem = SchoolYear.objects.all().first()
        return queryset.filter(teacher=self.request.user.uuid, school_year=ay_sem.id) if not self.request.user.is_student else queryset.filter(students=self.request.user.uuid)


class ClassUpdateAPIView(UpdateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [TeachersPermission, IsAuthenticated]

class AttendanceCreateAPIView(CreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [TeachersPermission, IsAuthenticated]


class AttendanceUpdateAPIView(UpdateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [TeachersPermission, IsAuthenticated]


class AttendanceClassListAPIView(ListAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LargeNumberOfData

    def filter_queryset(self, queryset):
        return queryset.filter(classroom=self.kwargs['uuid'])


class StudentClassListAPIView(ListAPIView):
    queryset = Class.objects.all()
    serializer_class = StudentClassSerializers
    permission_classes = [IsAuthenticated]

    def filter_queryset(self, queryset):
        return queryset.filter(students=self.request.user.uuid)


class ExportPunctualityAPIView(APIView):
    def get(self, request, *args, **kwargs):
        document = Document('{}'.format(settings.DOCX_FILE))

        buffer = BytesIO()
        buffer.seek(0)
        document.save(buffer)

        # response = HttpResponse(
        #     FileWrapper(buffer),
        #     content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        #     )
        buffer = BytesIO()
        document.save(buffer)
        buffer.seek(0)

        response = StreamingHttpResponse(
            streaming_content=buffer,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment;filename=Test.docx'
        # response['Content-Encoding'] = 'UTF-8'

        return response
    
class PostListCreateAPIView(ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializers
    permission_classes = []

    def perform_create(self, serializer):
        # Automatically set the created_by to the current user when creating a post
        serializer.save(created_by=self.request.user)    

class PostRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializers
    permission_classes = [IsOwnerOrReadOnly]

    def get_object(self): 
        uuid = self.kwargs.get("uuid")
        return get_object_or_404(Post, uuid=uuid)          

