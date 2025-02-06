from django.contrib.auth import get_user_model
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import (
    tblcollege, tbldepartment,tblEvent, 
    tblEventType, tblEventCategory, tblEventLog, tblSection, 
    tblSetup,tblStatus, tblstudentOrg, tblUserRole, 
    tblVenue, tblYearLevel, tblEventSchoolYearAndSemester, tblSchoolYear, tblSemester, tblEventRemarks
    )


admin.site.register(tblVenue)
admin.site.register(tblUserRole)
admin.site.register(tblcollege)
admin.site.register(tbldepartment)
admin.site.register(tblEvent)
admin.site.register(tblEventType)
admin.site.register(tblEventCategory)
admin.site.register(tblEventLog)
admin.site.register(tblSection)
admin.site.register(tblSetup)
admin.site.register(tblStatus)
admin.site.register(tblstudentOrg)
admin.site.register(tblYearLevel)
admin.site.register(tblEventSchoolYearAndSemester)
admin.site.register(tblSchoolYear)
admin.site.register(tblSemester)
admin.site.register(tblEventRemarks)

admin.site.site_url = 'https://unieventify-7t3vl.ondigitalocean.app/'  # Change this to your React app URL