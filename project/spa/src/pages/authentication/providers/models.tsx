import { ReactNode } from "react";

export interface User {
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    avatar: string;
    is_student: boolean;
    is_employee: boolean;
    is_staff: boolean;
    is_active: boolean;
    is_superuser: boolean;
    is_bayanihan_leader: boolean;
    id_number: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => void;
    forgotPassword: (email:string) => void;
    logout: () => void;
    loggedIn: boolean;
}

export interface AuthProviderProps {
    children: ReactNode
}
