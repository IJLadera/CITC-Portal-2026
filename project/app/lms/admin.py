from django.contrib import admin
from .models import (
    College,
    Department,
    SchoolYear,
    YearLevel,
    Section,
    Subject,
    Class,
    Status,
    Attendance,
    Post,
    Module,
    Lesson,
    UploadedFile,
)

# Register your models here.
admin.site.register(College)
admin.site.register(Department)
admin.site.register(SchoolYear)
admin.site.register(YearLevel)
admin.site.register(Section)
admin.site.register(Subject)
admin.site.register(Class)
admin.site.register(Status)
admin.site.register(Attendance)
admin.site.register(Post)
admin.site.register(Module)
admin.site.register(Lesson)
admin.site.register(UploadedFile)
