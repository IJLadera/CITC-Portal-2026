from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from tos.models import TOSTemplate
from syllabi.models import (
    SyllabusTemplate, 
    ReviewFormTemplate,
    ReviewFormItem,
    ReviewFormField,
)


class Command(BaseCommand):
    help = "Seed the database with default Syllabus Template, its sections, and Review Form Template with related items and fields."

    def handle(self, *args, **options):
      with transaction.atomic():
        self.stdout.write(self.style.MIGRATE_HEADING("🌱 Seeding initial data..."))
        
        effective_date = timezone.datetime(2025, 3, 17).date()
 
        # ✅ Syllabus Template 
        template, created = SyllabusTemplate.objects.get_or_create(
            code_no="FM-USTP-ACAD-01",
            defaults={
                "title": "Syllabus",
                "description": "Default syllabus template for university courses.",
                "effective_date": effective_date,
                "header_image": None,
                "revision_no": 0,
                "is_active": True,
            },
        )
         
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Created Syllabus Template v{template.revision_no}"))
        else:
            SyllabusTemplate.objects.exclude(pk=template.pk).update(is_active=False)
            template.is_active = True
            template.save(update_fields=["is_active"])
            self.stdout.write(self.style.WARNING(f"⚠️ Reusing existing active Syllabus Template v{template.revision_no}")) 
 
 
        # ✅ TOS Template 
        template, created = TOSTemplate.objects.get_or_create(
            code_no="FM-USTP-ACAD-08",
            defaults={
                "title": "Syllabus",
                "description": "Default tos template for university.",
                "effective_date": effective_date,
                "header_image": None,
                "revision_no": 0,
                "is_active": True,
            },
        )
         
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Created TOS Template v{template.revision_no} Effective Date{template.effective_date}"))
        else:
            TOSTemplate.objects.exclude(pk=template.pk).update(is_active=False)
            template.is_active = True
            template.save(update_fields=["is_active"])
            self.stdout.write(self.style.WARNING(f"⚠️ Reusing existing active TOS Template v{template.revision_no} Effective Date{template.effective_date}")) 
 
 
        # ✅ Review Form Template 
        form_template, created = ReviewFormTemplate.objects.get_or_create(
            code_no="FM-USTP-ACAD-12",
            revision_no=1,
            defaults={
                "title": "Syllabus Review Form",
                "description": "Form used for evaluating submitted syllabi.",
                "effective_date": effective_date,
                "revision_no": 0,
                "is_active": True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Created Review Form Template: {form_template.title} (Rev {form_template.revision_no})"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ Review Form Template already exists (Rev {form_template.revision_no})"))
 
        # ✅ Review Form Items (Parts + Indicators) 
        review_items_data = [ 
            {
                "type": ReviewFormItem.PART,
                "text": "PART I. BASIC SYLLABUS INFORMATION",
                "order": 1,
                "syllabus_section": None,
            }, 
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "1. The syllabus follows the prescribed OBE syllabus format of the University and include the following:",
                "order": 2,
                "syllabus_section": "format",
            }, 
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Name of the College/Campus is indicated below the University name/brand.",
                "order": 3,
                "syllabus_section": "header_1",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Program, Course Title, Course Code and Unit Credits are specified in the syllabus.",
                "order": 4,
                "syllabus_section": "header_2",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Pre-requisites and co-requisites are indicated.",
                "order": 5,
                "syllabus_section": "section_2",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Semester, Academic Year, Schedule of Course, Building and Room Number are stipulated in the syllabus.",
                "order": 6,
                "syllabus_section": "section_1",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Contact details of the instructor such as the instructor’s name, email address OR mobile number (optional) are specified in the syllabus.",
                "order": 7,
                "syllabus_section": "section_3",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	Instructor’s consultation schedules, oﬃce or consultation venue, oﬃce phone number is indicated in the syllabus.",
                "order": 8,
                "syllabus_section": "section_4",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "●	The University’s Vision and Mission are indicated in the syllabus.",
                "order": 9,
                "syllabus_section": "side_section",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "2. The course description stipulates its relevance to the curriculum in general and provides an overview of the course content.",
                "order": 10,
                "syllabus_section": "course_description",
            },
            {
                "type": ReviewFormItem.PART,
                "text": "PART II. PROGRAM EDUCATIONAL OBJECTIVES (or General Outcomes for Gen Ed courses)",
                "order": 11,
                "syllabus_section": None,
            }, 
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "3. The Approved Program Educational Objectives (PEO) and Program Outcomes (PO) are listed with alphabets in the syllabus (which will be referred to in the mapping of the course outcomes).",
                "order": 12,
                "syllabus_section": "side_section",
            },
            {
                "type": ReviewFormItem.PART,
                "text": "PART III. COURSE OUTCOMES",
                "order": 13,
                "syllabus_section": None,
            }, 
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "4. The course outcomes are measurable and aligned with the course description and program outcomes.",
                "order": 14,
                "syllabus_section": "course_outcomes",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "5. The course outcomes are mapped accordingly to the program outcomes/GELOs using the markers: i - introductory, e - enabling, and d - demonstrative.",
                "order": 15,
                "syllabus_section": "course_outcomes",
            },
            {
                "type": ReviewFormItem.PART,
                "text": "PART IV. COURSE OUTLINE",
                "order": 16,
                "syllabus_section": None,
            }, 
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "6. The course outline indicates the number of hours.",
                "order": 17,
                "syllabus_section": "course_outlines",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "7. Topics are assigned to intended learning outcomes (ILO).",
                "order": 18,
                "syllabus_section": "course_outlines",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "8. Suggested readings are provided.",
                "order": 19,
                "syllabus_section": "course_outlines",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "9. The Teaching-Learning Activities (TLAs) are indicated in the outline.",
                "order": 20,
                "syllabus_section": "course_outlines",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "10. Assessment tools are indicated.",
                "order": 21,
                "syllabus_section": "course_outlines",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "11. Rubrics are attached for all outputs/requirements.",
                "order": 22,
                "syllabus_section": "course_requirements",
            },
            {
                "type": ReviewFormItem.INDICATOR,
                "text": "12. The grading criteria are clearly stated in the syllabus.",
                "order": 23,
                "syllabus_section": "course_requirements",
            },
        ]

        for item_data in review_items_data:
            try:
                ReviewFormItem.objects.create(
                    form_template=form_template, **item_data
                )
                self.stdout.write(self.style.SUCCESS(f"   → Added {item_data['type']}: {item_data['text'][:60]}..."))
            except ValueError:
                self.stdout.write(self.style.WARNING(f"⚠️ Skipped (immutable): {item_data['text'][:60]}..."))
 
        # ✅ Review Form Fields 
        review_fields_data = [ 
            {
                "label": "Course Code",
                "field_type": ReviewFormField.TEXT,
                "is_required": True,
                "prefill_source": "course_code",
                "position": "header",
                "row": 0,
                "column": 1,
                "span_full": False,
                "display_order": 1,
            },
            {
                "label": "Sem and Year",
                "field_type": ReviewFormField.TEXT,
                "is_required": True,
                "prefill_source": "semester_and_year",
                "position": "header",
                "row": 0,
                "column": 2,
                "span_full": False,
                "display_order": 2,
            },  
            {
                "label": "Descriptive Title",
                "field_type": ReviewFormField.TEXT,
                "is_required": True,
                "prefill_source": "course_title",
                "position": "header",
                "row": 1,
                "column": 1,
                "span_full": False,
                "display_order": 3,
            }, 
            {
                "label": "Faculty",
                "field_type": ReviewFormField.TEXT,
                "is_required": True,
                "prefill_source": "faculty",
                "position": "header",
                "row": 1,
                "column": 2,
                "span_full": False,
                "display_order": 4,
            }, 
            {
                "label": "For revision",
                "field_type": ReviewFormField.TEXT,
                "is_required": False,
                "prefill_source": "none",
                "position": "footer",
                "row": 0,
                "column": 1,
                "span_full": True,
                "display_order": 5,
            },
            {
                "label": "Approved for implementation",
                "field_type": ReviewFormField.TEXT,
                "is_required": False,
                "prefill_source": "none",
                "position": "footer",
                "row": 1,
                "column": 1,
                "span_full": True,
                "display_order": 6,
            },
        ]

        for field_data in review_fields_data:
            try:
                ReviewFormField.objects.create(form_template=form_template, **field_data)
                self.stdout.write(self.style.SUCCESS(f"   → Added field: {field_data['label']} ({field_data['position']}: r{field_data['row']}c{field_data['column']})"))
            except ValueError:
                self.stdout.write(self.style.WARNING(f"⚠️ Skipped (immutable): {field_data['label']}"))

        # =====================================================
        self.stdout.write(self.style.SUCCESS("🎉 Seeding complete!"))
