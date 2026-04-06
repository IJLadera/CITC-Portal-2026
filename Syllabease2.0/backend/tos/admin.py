from django.contrib import admin 
from .models import TOS, TOSRow, TOSTemplate, TOSComment

# Register your models here.
admin.site.register(TOS)   
admin.site.register(TOSRow)  
admin.site.register(TOSTemplate)  
admin.site.register(TOSComment)  
  