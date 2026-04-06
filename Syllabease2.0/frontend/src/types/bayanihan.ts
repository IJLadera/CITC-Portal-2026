import type { Course } from "./academic";

export interface BayanihanGroup {
  id: number;
  school_year: string;
  course: Course;
  bayanihan_members: BayanihanMember[];
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
  signature?: string;
};

export interface BayanihanMember {
  id: number;
  user: User;
  role: "LEADER" | "TEACHER";
};
