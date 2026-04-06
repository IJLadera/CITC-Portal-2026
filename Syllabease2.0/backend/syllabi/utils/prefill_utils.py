def get_prefill_value(field, syllabus):
    """
    Determines the default value for a ReviewFormField
    based on the syllabus data.
    """ 
    match field.prefill_source:
        case "course_code":
            return syllabus.course.course_code

        case "course_title":
            return syllabus.course.course_title

        case "course_year_level":
            level = int(syllabus.course.course_year_level or 0)
            suffix = "th"
            if level == 1: suffix = "st"
            elif level == 2: suffix = "nd"
            elif level == 3: suffix = "rd"
            return f"{level}{suffix} year"

        case "program_code":
            return syllabus.course.program.program_code

        case "program_name":
            return syllabus.course.program.program_name

        case "department_code":
            return syllabus.course.program.department.department_code

        case "department_name":
            return syllabus.course.program.department.department_name

        case "college_code":
            return syllabus.course.program.department.college_code

        case "college_name":
            return syllabus.course.program.department.college.college_description

        case "faculty":
            instructors = syllabus.instructors.all()
            if not instructors:
                return ""

            # Each instructor on a new line
            return "\n".join(i.user.get_full_name() for i in instructors)

        case "semester":
            return f"{syllabus.course.course_semester.lower()} Semester"

        case "course_code_title": 
            return f"{syllabus.course.course_code} - {syllabus.course.course_title}"

        case "semester_and_year":
            return f"{syllabus.course.course_semester.lower()} Semester - SY {syllabus.bayanihan_group.school_year}"

        case _:
            return ""  # No prefill
