import http from '../../../../../../http';

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

export {
  getAllModules,
  getAllSubjects,
  uploadFile,
}
