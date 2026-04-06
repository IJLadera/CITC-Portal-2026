from django.contrib import admin
from .models import Deadline, Report, TOSReport

# Register your models here.
admin.site.register(Deadline)
admin.site.register(Report)
admin.site.register(TOSReport)