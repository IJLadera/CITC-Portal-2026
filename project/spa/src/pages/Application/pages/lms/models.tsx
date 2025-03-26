export type attendance = {
    student: string;
    classroom: string;
    is_present: boolean;
    date: string;
}

export type Department = {
    id : number;
    name: string;
    code : string;
    college : number;
}

export type SchoolYear = {
    id: number;
    name: string;
}

export type ClassType = {
    department: number | null;
    year_level: number | null;
    section: number | null;
    subject: number | null;
    teacher: string | null;
    school_year: number | null;
    students: [];
}

export type YearLevelType = {
    id : number;
    level: string;
}

export type SectionType = {
    id: number;
    section: string;
}

export type SubjectType = {
    id: number;
    name: string;
}