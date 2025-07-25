import http from '../../../http';
import { forgotPasswordType } from './models';

export const forgotPassword = (data: forgotPasswordType) => {
  return http.post('auth/users/reset_password_confirm/', data)
}
