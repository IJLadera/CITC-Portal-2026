import http from "./http"

// Fetching UserProfile
export const fetchUserProfileApi = async () => {
  try {
    const response = await http.get('auth/users/me/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetching YearLevels
export const fetchUserApi = async () => {
  try {
    const response = await http.get('unieventify/users/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetching Colleges
export const fetchCollegesesApi = async () => {
  try {
    const response = await http.get('unieventify/colleges/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetching YearLevels
export const fetchYearLevelsApi = async () => {
  try {
    const response = await http.get('unieventify/yearlevel/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventsApi = async () => {
  try {
    const response = await http.get('unieventify/events/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSetupsApi = async () => {
  try {
    const response = await http.get('unieventify/setups/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchVenuesApi = async () => {
  try {
    const response = await http.get('unieventify/venues/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStatusApi = async () => {
  try {
    const response = await http.get('unieventify/status/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSectionsApi = async () => {
  try {
    const response = await http.get('unieventify/sections/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventLogsApi = async () => {
  try {
    const response = await http.get('unieventify/eventlogs/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserRolesApi = async () => {
  try {
    const response = await http.get('unieventify/userroles/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDepartmentsApi = async () => {
  try {
    const response = await http.get('unieventify/departments/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStudentOrgsApi = async () => {
  try {
    const response = await http.get('unieventify/studentorgs/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventTypesApi = async () => {
  try {
    const response = await http.get('unieventify/eventtypes/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventCategoriesApi = async () => {
  try {
    const response = await http.get('unieventify/eventcategories/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSchoolYearandSemestersApi = async () => {
  try {
    const response = await http.get('unieventify/schoolyearandsemester/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSchoolYearApi = async () => {
  try {
    const response = await http.get('unieventify/schoolyear/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSemestersApi = async () => {
  try {
    const response = await http.get('unieventify/semester/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventRemarksApi = async () => {
  try {
    const response = await http.get('unieventify/eventremark/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserEventsApi = async () => {
  try {
    const response = await http.get('unieventify/userevents/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchParticipatedEventsApi = async () => {
  try {
    const response = await http.get('unieventify/participatedevents/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventStatisticsApi = async () => {
  try {
    const response = await http.get('unieventify/events/statistics/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventStatisticsCreatedApi = async () => {
  try {
    const response = await http.get('unieventify/events/statistics/created/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventStatisticsCancelledApi = async () => {
  try {
    const response = await http.get('unieventify/events/statistics/cancelled/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDesignationCountApi = async () => {
  try {
    const response = await http.get('unieventify/designation-count/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDesignationByCategoriesApi = async () => {
  try {
    const response = await http.get('unieventify/events/statistics/byCategories/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDesignationByDepartmentApi = async () => {
  try {
    const response = await http.get('unieventify/events/statistics/byDepartment/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchEventsPersonalApi = async () => {
  try {
    const response = await http.get('unieventify/events/personal/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUploadCSVApi = async () => {
  try {
    const response = await http.get('unieventify/upload-csv/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPublicEventsApi = async () => {
  try {
    const response = await http.get('unieventify/public-events/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDepartmentsByCollegeApi = async () => {
  try {
    const response = await http.get('unieventify/departmentsbycollege/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchNotificationsApi = async () => {
  try {
    const response = await http.get('unieventify/notifications/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchApprovalEventsApi = async () => {
  try {
    const response = await http.get('unieventify/approvalevents/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUnavailableSlotsPersonalApi = async () => {
  try {
    const response = await http.get('unieventify/unavail-slots/personal/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUnavailableSlotsNonPersonalApi = async () => {
  try {
    const response = await http.get('unieventify/unavail-slots/nonpersonal/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchFacultyEventsApi = async () => {
  try {
    const response = await http.get('unieventify/faculty/events/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchRolesEventsApi = async () => {
  try {
    const response = await http.get('unieventify/roles/events/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAnnouncementApi = async () => {
  try {
    const response = await http.get('unieventify/announcement/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDocumentsApi = async () => {
  try {
    const response = await http.get('unieventify/documents/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAuditLogsApi = async () => {
  try {
    const response = await http.get('unieventify/auditlogs/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAuditLogsStatusChangeApi = async () => {
  try {
    const response = await http.get('unieventify/auditlogstatuschange/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAuditLogsEventChangeApi = async () => {
  try {
    const response = await http.get('unieventify/auditlogeventchange/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAuditLogsDateChangeApi = async () => {
  try {
    const response = await http.get('unieventify/auditlogdatechange/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchTimelineApi = async () => {
  try {
    const response = await http.get('unieventify/timeline/');
    return response.data;
  } catch (error) {
    throw error;
  }
};





