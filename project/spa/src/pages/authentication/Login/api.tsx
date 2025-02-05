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