export interface LoginModel {
    email: string;
    password: string;
}

export type User = {
    first_name: string,
    last_name: string,
    avatar: string,
    uuid: string,
}

export type Department = {
    id: number;
    name: string;
    code: string;
    college: number;
}

export type Role = {
    uuid : string;
    name: string;
    rank: number;
}

export type UserPost = {
    first_name: string;
    last_name: string;
    id_number: string;
    email: string;
    role: Role,
    department: Department
}
