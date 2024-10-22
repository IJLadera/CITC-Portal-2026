import { ReactNode, createContext, useState } from "react";

const authContext = createContext();

function useAuth() {
    const [authed, setAuthed] = useState<Boolean>(false);
    return {
        authed,
        login() {
            return new Promise(res => {
                setAuthed(true);
            })
        },
        logout() {
            return new Promise(res => {
                setAuthed(false);
            })
        }
    }
}

type AuthProps = {
    children: ReactNode
}

export function AuthProvider(props: AuthProps) {
    const auth = useAuth();

    return <authContext></authContext>
}