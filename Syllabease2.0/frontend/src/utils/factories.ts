import type { College, Department, Program, Curriculum, Course, PEO, ProgramOutcome } from "../types/academic";
import type { BayanihanGroup } from "../types/bayanihan";
import type { User, Syllabus, Dean, Chairperson, SyllabusReviewForm, SrfChecklist, SyllabusDeanFeedback, PreviousSyllabus } from "../types/syllabus";
import type { TOS, TOSRows } from "../types/tos";

// base factories 
export const createEmptyCollege = (): College => ({
  id: 0,
  college_code: "",
  college_description: "",
  college_status: "",
  created_at: "",
  updated_at: "",
});

export const createEmptyDepartment = (): Department => ({
  id: 0,
  department_code: "",
  department_name: "", 
  department_status: "",
  created_at: "",
  updated_at: "",

  college: createEmptyCollege(),
});

export const createEmptyProgram = (): Program => ({
  id: 0,
  program_code: "",
  program_name: "",
  program_status: "",
  created_at: "",
  updated_at: "",

  department: createEmptyDepartment(),
}); 

export const createEmptyCurriculum = (): Curriculum => ({
  id: 0,
  curr_code: "",
  effectivity: "",
  created_at: "",
  updated_at: "",

  program: createEmptyProgram(),
});

export const createEmptyCourse = (): Course => ({
  id: 0,
  course_title: "",
  course_code: "",
  course_year_level: "",
  course_semester: "",
  course_unit_lec: "",
  course_unit_lab: "",
  course_credit_unit: "",
  course_hrs_lec: "",
  course_hrs_lab: "",
  course_pre_req: "",
  course_co_req: "",
  created_at: "",
  updated_at: "",

  curriculum: createEmptyCurriculum(),
});

export const createEmptyPEO = (): PEO => ({
  id: 0,
  peo_code: "",
  peo_description: "",
  created_at: "",
  updated_at: "",

  program: createEmptyProgram(),
});

export const createEmptyProgramOutcome = (): ProgramOutcome => ({
  id: 0,
  po_letter: "",
  po_description: "",
  created_at: "",
  updated_at: "",

  program: createEmptyProgram(),
});

export const createEmptyDean = (): Dean => ({
  id: 0,
  name: "",
  email: "",
  signature: "",
  assigned_at: "",
});

export const createEmptyChairperson = (): Chairperson => ({
  id: 0,
  name: "",
  email: "",
  signature: "",
  assigned_at: "",
});

export const createEmptyBayanihanGroup = (): BayanihanGroup => ({
  id: 0,
  school_year: "",
  course: createEmptyCourse(),
  bayanihan_members: [],
});

export const createEmptyPreviousSyllabus = (): PreviousSyllabus => ({
  id: 0,
  version: 0,
  status: "",
  review_form: undefined,
  dean_feedback: undefined,
});

// main syllabus factory
export const createEmptySyllabus = (): Syllabus => ({
  id: 0,
  syllabus_template: null,
  effective_date: "",
  class_schedules: "",
  building_room: "",
  class_contact: '',
  consultation_hours: "",
  consultation_room: "",
  consultation_contact: '',
  course_description: "",
  course_requirements: "",

  chair_submitted_at: "",
  chair_rejected_at: "",
  dean_submitted_at: "",
  dean_rejected_at: "",
  dean_approved_at: "",
  
  instructors: [],

  peos: [],
  program_outcomes: [],
  syllcopos: [],
  course_outcomes: [],
  course_outlines: [],
  
  status: "",
  version: 0,

  dean: createEmptyDean(),
  chair: createEmptyChairperson(),

  bayanihan_group: createEmptyBayanihanGroup(),
  college: createEmptyCollege(),
  program: createEmptyProgram(),
  curriculum: createEmptyCurriculum(),
  course: createEmptyCourse(),

  dean_feedback: createEmptySyllabusDeanFeedback(),
  review_form: undefined,

  is_latest: false,
  
  previous_version: createEmptyPreviousSyllabus(),
});

export const createEmptyUser = (): User => ({
  id: 0,
  prefix: "", 
  first_name: "",
  last_name: "",
  suffix: "",
  email: "",
  phone: "",
  signature: "",
});  

export const createEmptySyllabusReviewForm = (): SyllabusReviewForm => ({
  id: 0, 
  
  syllabus: createEmptySyllabus(),
  user: createEmptyUser(),

  effective_date: null,
  course_code: "",
  course_title: "",
  sem_year: "",
  faculty: "",
  review_date: "",
  reviewed_by_snapshot: "",
  
  action: 0, 

  created_at: "",
  updated_at: "",
  checklist_items: [],
});

export const createEmptySyllabusDeanFeedback = (): SyllabusDeanFeedback => ({
  user: createEmptyUser(),

  feedback_text: "",
  created_at: "",
  updated_at: "",
}); 

export const createEmptyTOS = (): TOS =>  ({
  id: 0,
  effective_date: "",

  term: "",

  total_items: 0,
  col1_percentage: 0,
  col2_percentage: 0,
  col3_percentage: 0,
  col4_percentage: 0,
  col1_expected: 0,
  col2_expected: 0,
  col3_expected: 0,
  col4_expected: 0,

  tos_rows: [],
    
  tos_cpys: "",
  chair: createEmptyChairperson(),

  chair_submitted_at: "",
  chair_returned_at: "", 
  chair_approved_at: "",

  status: "",
  version: 0, 

  tos_template: null,
  syllabus: createEmptySyllabus(),
  user: createEmptyUser(),
  course: createEmptyCourse(),
  bayanihan_group: createEmptyBayanihanGroup(),
  program: createEmptyProgram(),

  is_latest: false,
});