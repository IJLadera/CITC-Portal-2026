import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { AuthContextType, AuthProviderProps, User } from "./models";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { mutateLoggedIn } from "../Login/slice";


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }:AuthProviderProps) {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const loggedIn = useAppSelector(state => state.auth.loggedIn)
    const dispatch = useAppDispatch()

    const login = (email: string, password: string) => {
        dispatch(mutateLoggedIn(true))
    }

    const logout = () => {
        dispatch(mutateLoggedIn(false))
    }

    const value: AuthContextType = {
        user,
        login,
        logout,
        loggedIn
    }

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login')
        }
    }, [])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context == undefined) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context;
}
