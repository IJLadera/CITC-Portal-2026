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
    Attendance
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