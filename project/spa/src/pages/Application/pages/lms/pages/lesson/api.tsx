import http from '../../../../../../http';

const getAllModules = () => {
  return http.get('lms/module/')
}

const getAllSubjects = () => {
  return http.get('lms/subjects/')
}

const getCsrfToken = () => {
  const name = 'csrftoken'
  const match = document.cookie.match(new RegExp(`(^|;)\\s*${name}=([^;]+)`))
  return match ? match[2] : null
}

const uploadFile = (file: File) => {
  
  const csrftoken = getCsrfToken() || '';

  const formData = new FormData();
  formData.append('csrfmiddlewaretoken', csrftoken)
  formData.append('file', file)

  return http.post('uploads/', formData, {
    headers: {
      'Content-Type' : 'multipart/form-data',
      'X-CSRFToken': getCsrfToken() || '',
    },
    withCredentials: true
  })
}

const getCsrf = () => {
  return http.get('lms/get_csrf/')
}

export {
  getAllModules,
  getAllSubjects,
  uploadFile,
  getCsrfToken
}
