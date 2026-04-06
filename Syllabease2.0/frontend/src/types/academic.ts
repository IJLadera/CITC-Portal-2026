export interface College  {
  id: number;
  college_code: string;
  college_description: string; 
  college_status: string;
  created_at: string;
  updated_at: string;
};

export interface Department {
  id: number;
  department_code: string;
  department_name: string; 
  department_status: string;
  created_at: string;
  updated_at: string;

  college: College;
};

export interface Program {
  id: number; 
  program_code: string;
  program_name: string;
  program_status: string;
  created_at: string;
  updated_at: string;

  department: Department;
};

export interface Curriculum {
  id: number;
  curr_code: string;
  effectivity: string;
  created_at: string;
  updated_at: string;

  program: Program;
}

export interface Course {
  id: number;
  course_title: string;
  course_code: string;
  course_year_level: string;
  course_semester: string;
  course_unit_lec: string;
  course_unit_lab: string;
  course_credit_unit: string;
  course_hrs_lec: string;
  course_hrs_lab: string;
  course_pre_req: string;
  course_co_req: string;
  created_at: string;
  updated_at: string;

  curriculum: Curriculum;
};

export interface ProgramOutcome {
  id: number;
  po_letter: string;
  po_description: string; 
  created_at: string;
  updated_at: string;

  program: Program;
};

export interface PEO {
  id: number;
  peo_code: string;
  peo_description: string; 
  created_at: string;
  updated_at: string;

  program: Program;
};