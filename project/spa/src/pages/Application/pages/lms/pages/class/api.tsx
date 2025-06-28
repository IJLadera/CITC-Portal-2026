import http from '../../../../../../http';


export const GetAllSchoolYear = () => {
  return http.get('lms/school-year/')
}

export const GetAllClasses = () => {
  return http.get('lms/')
}
