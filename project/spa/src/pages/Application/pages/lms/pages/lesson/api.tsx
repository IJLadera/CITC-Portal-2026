import http from '../../../../../../http';
import { LessonType } from './models';

const getAllModules = () => {
  return http.get('lms/module/')
}

const getAllSubjects = () => {
  return http.get('lms/subjects/')
}

const uploadFile = (file: File) => {
  
  const formData = new FormData();
  formData.append('file', file)

  return http.post('lms/upload/', formData, {
    headers: {
      'Content-Type' : 'multipart/form-data',
    },
  })
}

const createLesson = (data:LessonType) => {
  return http.post('lms/lesson/', data)
}

const getLessons = (id:any) => {
  return http.get(`lms/lesson/${id}/`)
}

const updateLesson = (id:any) => {
  return http.put(`lms/lesson-update/${id}/`)
}

export {
  getAllModules,
  getAllSubjects,
  uploadFile,
  createLesson,
  getLessons,
  updateLesson
}
