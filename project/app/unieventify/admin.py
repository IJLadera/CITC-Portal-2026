from django.contrib.auth import get_user_model
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import (
    tblEvent, 
    tblEventType, tblEventCategory, tblEventLog,
    tblSetup,tblStatus, tblstudentOrg,
    tblVenue, tblEventSchoolYearAndSemester, tblSemester, tblEventRemarks
    )


admin.site.register(tblVenue)
admin.site.register(tblEvent)
admin.site.register(tblEventType)
admin.site.register(tblEventCategory)
admin.site.register(tblEventLog)
admin.site.register(tblSetup)
admin.site.register(tblStatus)
admin.site.register(tblstudentOrg)
admin.site.register(tblEventSchoolYearAndSemester)
admin.site.register(tblSemester)
admin.site.register(tblEventRemarks)

admin.site.site_url = 'https://unieventify-7t3vl.ondigitalocean.app/'  # Change this to your React app URL