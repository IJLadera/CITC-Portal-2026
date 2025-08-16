import http from '../../../../../../http';
import { ClassType } from '../../models';

export const GetAllSchoolYear = () => {
  return http.get('lms/school-year/')
}

export const GetAllClasses = () => {
  return http.get('lms/')
}

export const createClass = (data:ClassType) => {
  return http.post('lms/', data)
}

export const yearLevelList = () => {
  return http.get('class/year-level')
} 

export const schoolYearList = () => {
  return http.get('class/school-year')
}

export const departmentList = () => {
  return http.get('class/department')
}

export const sectionList = () => {
  return http.get('class/sections')
}

export const subjectList = () => {
  return http.get('class/subjects')
}

export const classList = () => {
  return http.get('class/')
}

export const studentClass = () => {
  return http.get('class/student-list/')
}

export const createAttendance = (data:any) => {
  return http.post('lms/attendance/', data)
}

export const updateAttendance = (data:any) => {
  return http.put(`lms/attendance/${data.id}/`, data)
}

export const attendanceListClass = (id:string | undefined) => {
  return http.get(`lms/attendance-list/${id}/`)
}

export const getTopicList = (subject:string) => {
  return http.get(`lesson/${subject}/`)
}

export const getTopic = (slug:string) => {
  return http.get(`lms/topic/${slug}/`)
}

export const addStudentToClass = (id:any, data:any) => {
  return http.patch(`lms/${id}/`, data)
}

export const getStudentClass = (pk: any) => {
  return http.get(`lms/class/students/${pk}/`)
}
