import http from "../../../http";
import { LoginModel } from "./model";

export const loginAPI = (data?:LoginModel) => {
    return http.post('auth/token/login/', data)
}