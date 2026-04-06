from auditlog.registry import auditlog
from .models import (
    Syllabus, SyllabusCourseOutcome, SyllCoPo, SyllabusCourseOutline,
    SyllabusCotCo, SyllabusDeanFeedback, SyllabusInstructor, SRFForm, 
    SRFIndicator, SRFFieldValue
)

# Register all models you want to audit
auditlog.register(Syllabus)
auditlog.register(SyllabusInstructor)
auditlog.register(SyllabusCourseOutcome)
auditlog.register(SyllCoPo)
auditlog.register(SyllabusCourseOutline)
auditlog.register(SyllabusCotCo)
auditlog.register(SyllabusDeanFeedback)
auditlog.register(SRFForm)
auditlog.register(SRFIndicator) 
auditlog.register(SRFFieldValue) 
