from django.contrib import admin
from .models import College, Department, Program, Curriculum, Course, PEO, ProgramOutcome, Memo

admin.site.register(College)
admin.site.register(Department)
admin.site.register(Program)
admin.site.register(Curriculum)
admin.site.register(Course)
admin.site.register(PEO)
admin.site.register(ProgramOutcome)
admin.site.register(Memo)
