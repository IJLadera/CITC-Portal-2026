import { ReactNode } from "react";

export interface User {
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => void;
    logout: () => void;
    loggedIn: boolean;
}

export interface AuthProviderProps {
    children: ReactNode
}
