export type forgotPasswordType = {
  new_password:string;
  re_password: string;
  uid: string;
  token: string;
}

export type forgotParamsType = {
  uid: string;
  token: string;
}
