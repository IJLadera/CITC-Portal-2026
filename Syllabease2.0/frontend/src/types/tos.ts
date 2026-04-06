import type { Course, Program } from "./academic";
import type { BayanihanGroup, User } from "./bayanihan";
import type { Chairperson, Syllabus } from "./syllabus";

export interface TOSVersions {
  id: number; 
  term: string;

  chair_submitted_at: string;
  chair_returned_at: string;
  chair_approved_at: string; 
  status: string;
  version: number; 
}

export interface TOS {
  id: number; 
  effective_date: string;

  term: string;

  total_items: number;
  col1_percentage: number;
  col2_percentage: number;
  col3_percentage: number;
  col4_percentage: number;
  col1_expected: number;
  col2_expected: number;
  col3_expected: number;
  col4_expected: number;

  tos_rows: TOSRows[];
    
  tos_cpys: string;
  chair: Chairperson;

  chair_submitted_at: string;
  chair_returned_at: string; 
  chair_approved_at: string;

  status: string;
  version: number; 

  tos_template: TOSTemplate | null;
  syllabus: Syllabus;
  user: User;
  course: Course;
  bayanihan_group: BayanihanGroup;
  program: Program;

  is_latest: boolean;
}

export interface TOSRows {
  id: number; 
    
  topic: string;
  no_hours: number;
  percent: number;
  no_items: number;

  col1_value: number;
  col2_value: number;
  col3_value: number;
  col4_value: number;  
} 
 
export interface TOSTemplate {
  id: number;
  code_no: string;
  title: string;
  description: string;
  revision_no: number;
  effective_date?: string | null; 
  is_active: boolean; 
}