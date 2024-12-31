import http from "../../../../http"



export const getDepartments = (token:string) => {
    return http.get('lms/department/', {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

export const getYearLevel = (token:string) => {
    return http.get('lms/year-level/', {
        headers: {
            Authorization: `Token ${token}`
        }
    })
}

export const getSections = (token:string) => {
    return http.get('lms/sections/', {
        headers : {
            Authorization : `Token ${token}`
        }
    })
}

export const getSubjects = (token:string) => {
    return http.get('lms/subjects/', {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

export const getClasses = (token:string) => {
    return http.get('lms/', {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

export const getClassById = (token:string, id:string) => {
    return http.get(`lms/${id}/`, {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

export const createAttendance = (token:string, data:any) => {
    return http.post(`lms/attendance/`,data, {
        headers: {
            Authorization : `Token ${token}`
        }
    })
}

