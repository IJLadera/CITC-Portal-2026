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
    semester:string;
}

export type ClassType = {
    department: number | null;
    year_level: number | null;
    section: number | null;
    subject: number | null;
    teacher: string | null;
    school_year: number | null;
    students: any[];
}

export type ClassroomType = {
    id: number;
    students: StudentAttendance[];
    is_active: boolean;
    department: string;
    school_year: string;
    year_level: string;
    subject: string;
    section: string;
    teacher: string;
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

export type RoomType = {
    id: number;
    name: string;
    subject: string;
    teacher: string;
    year_level: number;
    section: string;
}


export type StudentAttendance = {
    id_number: string;
    first_name: string;
    last_name: string;
}
