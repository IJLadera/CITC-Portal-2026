from rest_framework.routers import DefaultRouter
from .views import ( 
  SyllabusViewSet, SyllabusCourseOutcomeViewSet, SyllCoPoViewSet, 
  SyllabusCourseOutlineViewSet, SyllabusTemplateViewSet, 
  SyllabusCommentViewSet, ReviewFormTemplateViewSet, SRFFormViewSet
)

router = DefaultRouter() 
router.register(r"syllabi", SyllabusViewSet, basename="syllabi")
router.register(r"course-outcomes", SyllabusCourseOutcomeViewSet, basename="course-outcomes")
router.register(r"syllcopos", SyllCoPoViewSet, basename="syllcopos")
router.register(r"course-outlines", SyllabusCourseOutlineViewSet, basename="course-outlines") 
router.register(r"syllabus-templates", SyllabusTemplateViewSet, basename="syllabus-templates")
router.register(r"syllabus-comments", SyllabusCommentViewSet, basename="syllabus-comments")
router.register(r"review-templates", ReviewFormTemplateViewSet, basename="review-template")
router.register(r"syllabus-review-form", SRFFormViewSet, basename="syllabus-review-form")

urlpatterns = router.urls
