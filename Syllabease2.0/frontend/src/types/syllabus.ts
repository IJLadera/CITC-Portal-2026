import type { College, Program, Curriculum, Course, PEO, ProgramOutcome } from "./academic";
import type { BayanihanGroup } from "./bayanihan";

export interface SyllabusVersions {
  id: number; 

  chair_submitted_at: string;
  chair_rejected_at: string;
  dean_submitted_at: string;
  dean_rejected_at: string;
  dean_approved_at: string;
  status: string;
  version: number; 
}
 
export interface User {
  id: number;
  faculty_id: string;
  prefix?: string; 
  first_name: string;
  last_name: string;
  suffix?: string;
  email: string;
  phone: string; 
  signature: string;
};

export interface Dean {
  id: number;
  name: string;
  email: string;
  signature: string;
  assigned_at: string; 
}

export interface Chairperson {
  id: number;
  name: string;
  email: string;
  signature: string;
  assigned_at: string; 
} 

export interface SyllabusTemplate {
  id: number;
  code_no: string;
  title: string;
  description: string;
  revision_no: number;
  effective_date?: string | null;
  header_image: string | null;
  is_active: boolean; 
}

export interface PreviousSyllabus {
  id: number;
  version: number;
  status: string;

  review_form?: SRFForm; // if status = "Returned by Chair"
  dean_feedback?: SyllabusDeanFeedback; // if status = "Returned by Dean"
}

export interface Syllabus {
  id: number;
  syllabus_template: SyllabusTemplate | null;
  effective_date: string;
  class_schedules: string;
  building_room: string;
  class_contact: string;
  consultation_hours: string;
  consultation_room: string;
  consultation_contact: string;
  course_description: string;
  course_requirements: string;

  chair_submitted_at: string;
  chair_rejected_at: string;
  dean_submitted_at: string;
  dean_rejected_at: string;
  dean_approved_at: string;
  status: string;
  version: number;

  instructors: SyllabusInstructor[];

  peos: PEO[];
  program_outcomes: ProgramOutcome[];
  syllcopos: SyllCoPo[];
  course_outcomes: SyllabusCourseOutcomes[];
  course_outlines: SyllabusCourseOutlines[];

  dean: Dean;
  chair: Chairperson;

  bayanihan_group: BayanihanGroup;
  college: College;
  program: Program;
  curriculum: Curriculum;
  course: Course;

  dean_feedback?: SyllabusDeanFeedback; 
  review_form?: SRFForm;

  previous_version?: PreviousSyllabus;

  is_latest: boolean; 
}

export interface SyllabusInstructor {
  id: number;
  user: User;
}

export interface SyllabusCourseOutcomes {
  id: number;
  co_code: string;
  co_description: string;
} 
 
type SyllCoPo = {
  id: number;
  course_outcome: SyllabusCourseOutcomes;
  program_outcome: ProgramOutcome;
  syllabus_co_po_code?: string;
};

export interface SyllabusCourseOutlines {
  id: number;
  row_no: number;
  syllabus_term: string;
  
  allotted_hour: number;
  allotted_time: string;
  intended_learning: string;
  topics: string;
  suggested_readings: string;
  learning_activities: string;
  assessment_tools: string;
  grading_criteria: string;
  remarks: string;

  cotcos: SyllabusCotCo[]
};

type SyllabusCotCo = {
  id: number; 
  course_outcome: SyllabusCourseOutcomes; 
};

export interface SrfChecklist {
  id: number;
  number: number;
  response: "yes" | "no" | null; 
  remarks: string | null;

  created_at: string;
  updated_at: string;
}

export interface EnrichedChecklist extends SrfChecklist {
  text: string;
  isBullet?: boolean;
}

export interface SyllabusReviewForm {
  id: number;  

  syllabus: Syllabus;
  user: User;

  effective_date: string | null;
  course_code: string;
  course_title: string;
  sem_year: string;
  faculty: string;

  review_date: string;
  reviewed_by_snapshot: string;
  action: 0 | 1; 

  created_at: string;
  updated_at: string;

  checklist_items: EnrichedChecklist[];
}

export interface SyllabusDeanFeedback { 
  user: User;
  feedback_text: string;
  created_at: string;
  updated_at: string;
}

// New Review Form Schema
export interface SRFForm {
  id: number;
  effective_date: string;
  review_date: string;
  reviewed_by_snapshot: string; 
  action: 0 | 1; 

  checklist_items: SRFItem[];
}

export interface SRFItem {
  id: number;
  item: ReviewItem;
  response: "yes" | "no" | null;
  remarks: string; 
} 

export interface ReviewItem {
  id: number;
  type: "part" | "indicator";
  text: string;
  syllabus_section: string | null; 
  order: number;
} 