from django.contrib import admin 
from .models import ( 
  Syllabus, SyllabusCotCo, SyllabusCourseOutcome, 
  SyllabusCourseOutline, SyllabusDeanFeedback, SyllabusInstructor, 
  SyllCoPo, SyllabusComment,
  ReviewFormTemplate, ReviewFormItem, ReviewFormField,
  SRFForm, SRFIndicator, SRFFieldValue, SyllabusTemplate
)

# Register your models here.
admin.site.register(SyllabusTemplate)
admin.site.register(Syllabus) 
admin.site.register(SyllabusInstructor) 
admin.site.register(SyllabusCourseOutcome) 
admin.site.register(SyllCoPo) 
admin.site.register(SyllabusCourseOutline) 
admin.site.register(SyllabusCotCo)  
admin.site.register(SyllabusDeanFeedback)
admin.site.register(SyllabusComment)
admin.site.register(SRFForm)
admin.site.register(SRFIndicator)
admin.site.register(SRFFieldValue)
admin.site.register(ReviewFormTemplate)
admin.site.register(ReviewFormItem)
admin.site.register(ReviewFormField)
 
  