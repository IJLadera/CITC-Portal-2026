import http from "../../../http";
import { LoginModel } from "./model";

export const loginAPI = async (data?:LoginModel) => {
    return await http.post('auth/token/login/', data)
}

export const getProfile = (token:string) => {
    return http.get('auth/users/me/', {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

export const resetPassword = (email:string) => {
    return http.post('auth/users/reset_password/', {email: email})
}
