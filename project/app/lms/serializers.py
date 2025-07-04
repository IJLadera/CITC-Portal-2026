from django.contrib.auth import get_user_model

from rest_framework import serializers
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
from app.users.serializers import StudentSerializers

from app.unieventify.serializers import CreatedBySerializer


User = get_user_model()

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = "__all__"


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"

class SchoolYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolYear
        fields = "__all__"

class YearLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = YearLevel
        fields = "__all__"


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = "__all__"


class AttendanceSerializer(serializers.ModelSerializer):
    
    student = serializers.CharField(write_only=True)
    
    class Meta:
        fields = ['id','date', 'student', 'is_present', 'classroom']
        model = Attendance
    
    def to_representation(self, instance):
        data = {}
        data['id'] = instance.id
        data['date'] = instance.date
        data['student'] = instance.student.id_number
        data['is_present'] = instance.is_present
        data['classroom'] = instance.classroom.id
        return data

    def create(self, validated_data):
        student_id_number = validated_data.pop('student')
        student_obj = User.objects.get(id_number=student_id_number)
        att = Attendance.objects.create(student=student_obj, **validated_data)
        return att
    
    def update(self, instance, validated_data):
        instance.is_absent = validated_data.get('is_absent')
        return instance


class ClassSerializer(serializers.ModelSerializer):
    students = StudentSerializers(many=True)

    class Meta:
        fields = '__all__'
        model = Class
    
    def create(self, validated_data):
        # get all students
        students = validated_data.pop('students')
        # create class
        clas = Class.objects.create(**validated_data)
        for student in students:
            std = ''
            try:
                std = User.objects.get(id_number=student.get('id_number'))
            except:
                std = User.objects.create_user(
                    **student,
                    is_student=True
                )
            clas.students.add(std)
        return clas
    
    def update(self, instance, validated_data):

        students = validated_data.pop('students')
        # create or add student
        for student in students:
            std = ''
            try:
                std = User.objects.get(id_number=student.get('id_number'))
            except:
                std = User.objects.create_user(
                    **student,
                    is_student=True
                )
            instance.students.add(std)
        return instance
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['department'] = instance.department.name
        data['school_year'] = instance.school_year.name
        data['section'] = instance.section.section
        data['year_level'] = instance.year_level.level
        data['subject'] = instance.subject.name
        data['teacher'] = '{}, {}'.format(instance.teacher.last_name, instance.teacher.first_name)
        return data
    
class StudentClassSerializers(serializers.ModelSerializer):
    class Meta:
        fields = ['teacher', 'department', 'school_year', 'section', 'subject', 'id']
        model = Class
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['department'] = instance.department.name
        data['school_year'] = instance.school_year.sy
        data['section'] = instance.section.section
        data['year_level'] = instance.year_level.level
        data['subject'] = instance.subject.name
        data['teacher'] = '{}, {}'.format(instance.teacher.last_name, instance.teacher.first_name)
        return data
    
class PostSerializers(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)
    class Meta:
        fields = '__all__'
        model = Post

