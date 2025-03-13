import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { EventCategorySlice, College, Department, EventType, Document, User, Event, EventNotification, Role, EventCategory, Setup, Venue, Status } from '../Components/models';
import http from '../../../../../../http';

interface UserEvents {
  id: string;
  eventName: string;
  start: string;
  end: string;
  duration: { hours: number; minutes: number };
  rrule: string | null;
  allDay: boolean;
  category: number | null;
  color: string;
  departments: Department[];
  participants: any[];
  created_by: User | null;
  eventCategory: EventCategory | null;
  eventType: string | string[] | null;  // Change eventType to an array of strings or null
  startDateTime: string;
  endDateTime: string;
  title: string;
}

// Define the Timeline event interface
interface TimelineEvent {
  id: number;
  eventName: string;
  startDateTime: string;
  endDateTime: string;
  status?: { 
    id: number;
    statusName: string;
  };
  eventCategory?: {
    id: number;
    eventCategoryName: string;
  };
  venue?: {
    id: number;
    venueName: string;
    location: string;
  };
  setup?: {
    id: number;
    setupName: string;
  };
  department?: {
    id: number;
    departmentName: string;
    collegeName: number;
  };
  participants: any[];
  created_by: {
    id: number;
    idNumber: number;
    email: string;
    first_name: string;
    last_name: string;
    role: {
      id: number;
      designation: string;
      rank: number;
    };
    department: number;
  };
  eventType?: {
    id: number;
    eventTypeName: string;
  };
  meetinglink: string;
  eventDescription: string;
  timestamp: string;
  approveDocuments: string;
  images: string;
  isAnnouncement: boolean;
  isAprrovedByDean: boolean;
  isAprrovedByChairman: boolean;
  majorEvent: boolean;
  recurrence_type: string;
  recurrence_days: string;
}

// Define initial state type
interface unieventifyState {
  user: User | null;
  users: User[],
  events: Event[];
  participatedEvents: any[];
  listEvents: UserEvents[];
  timeline: TimelineEvent[];
  approvalEvents: Event[];
  notifications: EventNotification[];
  userRole: Role | null;
  userRoles: Role | null,
  categories: EventCategorySlice[];
  types: EventType[];
  setups: Setup[];
  venues: Venue[];
  status: Status[];
  sections: any;
  schoolyear: any;
  eventremark: string;
  colleges: College[];
  departments: Department[];
  departmentsByCollege: any[];
  documentsByYear: any[];
  loading: boolean;
  timelineLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: unieventifyState = {
  user: null,
  users: [],
  events: [],
  participatedEvents: [],
  listEvents: [],
  timeline: [],
  approvalEvents: [],
  notifications: [],
  userRole: null,
  userRoles: null,
  categories: [],
  types: [],
  setups: [],
  venues: [],
  status: [],
  sections: [],
  schoolyear: [],
  eventremark: "",
  colleges: [],
  departments: [],
  departmentsByCollege: [],
  documentsByYear: [],
  loading: false,
  timelineLoading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  'unieventify/fetchCurrentUser',
  async () => {
    const response = await http.get('auth/users/me');
    if (response.status !== 200) {
      throw new Error('Failed to fetch current user');
    }
    return response.data;
  }
);

// Fetch Users
export const fetchUsers = createAsyncThunk(
  'eventData/fetchUsers',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("unieventify/users/", {
      headers: { Authorization: `Token ${token}` }
    });
    return response.data;
  }
);

export const fetchEvents = createAsyncThunk(
  'unieventify/fetchEvent',
  async () => {
    const response = await http.get('unieventify/events/');
    if (response.status !== 200) {
      throw new Error('Failed to fetch events');
    }
    return response.data;
  }
);

export const fetchParticipatedEvents = createAsyncThunk(
  'unieventify/fetchParticipatedEvents',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    
    if (!token) {
      throw new Error("Authentication token is missing.");
    }
    
    const response = await http.get('unieventify/participatedevents/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch participated events');
    }
    
    return response.data; // Just return the raw data
  }
);

export const fetchListEvents = createAsyncThunk(
  'unieventify/fetchListEvents',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    
    if (!token) {
      throw new Error("Authentication token is missing.");
    }
    
    const response = await http.get('unieventify/participatedevents/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch participated events');
    }
    
    return response.data; // Just return the raw data
  }
);

// New async thunk for timeline events
export const fetchTimelineEvents = createAsyncThunk(
  'unieventify/fetchTimelineEvents',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get('unieventify/timeline/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch timeline events');
    }
    
    const filteredEvents = response.data.filter((event: any) => 
      event.status?.statusName !== 'draft'
    );
    
    const sortedEvents = filteredEvents.sort(
      (a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
    
    return sortedEvents.map((event: any) => ({
      id: event.id,
      participants: [],
      created_by: {
        id: 0,
        idNumber: 0,
        email: '',
        first_name: '',
        last_name: '',
        role: {
          id: 0,
          designation: '',
          rank: 0
        },
        department: 0
      },
      eventCategory: event.status ? 
        { id: 0, eventCategoryName: event.status.statusName } 
        : { id: 0, eventCategoryName: '' },
      eventType: { id: 0, eventTypeName: '' },
      status: event.status ? { id: 0, statusName: event.status.statusName } : { id: 0, statusName: '' },
      venue: { id: 0, venueName: '', location: '' },
      setup: { id: 0, setupName: '' },
      department: { id: 0, departmentName: '', collegeName: 0 },
      meetinglink: '',
      eventName: event.eventName,
      eventDescription: '',
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      timestamp: '',
      approveDocuments: '',
      images: '',
      isAnnouncement: false,
      isAprrovedByDean: false,
      isAprrovedByChairman: false,
      majorEvent: false,
      recurrence_type: '',
      recurrence_days: ''
    }));
  }
);

export const fetchApprovalEvents = createAsyncThunk(
  'eventData/fetchApprovalEvents',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("unieventify/approvalevents/", {
      headers: { Authorization: `Token ${token}` }
    });
    return response.data;
  }
);

export const fetchNotifications = createAsyncThunk(
  'eventData/fetchNotifications',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("unieventify/notifications/", {
      headers: { Authorization: `Token ${token}` }
    });
    return response.data;
  }
);

export const fetchUserRole = createAsyncThunk(
  'eventData/fetchUserRole',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("auth/users/me", {
      headers: { Authorization: `Token ${token}` }
    });

    const highestRankRole = response.data.roles.reduce((minRole: any, currentRole: any) => {
      return currentRole.rank < minRole.rank ? currentRole : minRole;
    }, response.data.roles[0]);

    return highestRankRole;
  }
);


export const fetchUserRoles = createAsyncThunk(
  'eventData/fetchUserRoles',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("unieventify/userroles/", {
      headers: { Authorization: `Token ${token}` }
    });
    return response.data;
  }
);

// Create async thunk for fetching event categories from the API
export const fetchEventCategories = createAsyncThunk(
  'unieventify/fetchEventCategories',
  async () => {
    const response = await http.get('unieventify/eventcategories/');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event categories');
    }
    return response.data;
  }
);

export const fetchEventTypes = createAsyncThunk(
  'unieventify/fetchEventTypes',
  async () => {
    const response = await http.get('unieventify/eventtypes');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchSchoolYears = createAsyncThunk(
  'unieventify/fetchSchoolYears',
  async () => {
    const response = await http.get('unieventify/schoolyear');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchSetRemarks = createAsyncThunk(
  'unieventify/fetchSetRemark',
  async () => {
    const response = await http.get('unieventify/eventremark');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchSetup = createAsyncThunk(
  'unieventify/fetchSetup',
  async () => {
    const response = await http.get('unieventify/setups');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchVenues = createAsyncThunk(
  'unieventify/fetchVenues',
  async () => {
    const response = await http.get('unieventify/venues');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchStatus = createAsyncThunk(
  'unieventify/fetchStatus',
  async () => {
    const response = await http.get('unieventify/status');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);

export const fetchSections = createAsyncThunk(
  'unieventify/fetchSections',
  async () => {
    const response = await http.get('unieventify/sections');
    if (response.status !== 200) {
      throw new Error('Failed to fetch event types');
    }
    return response.data;
  }
);


// Create async thunk for fetching colleges from the API
export const fetchCollegeses = createAsyncThunk(
  'unieventify/fetchColleges',
  async () => {
    const response = await http.get('unieventify/colleges/');
    if (response.status !== 200) {
      throw new Error('Failed to fetch colleges');
    }
    return response.data;
  }
);


export const fetchDepartments = createAsyncThunk(
  'eventData/fetchDepartments',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get("unieventify/departments/", {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  }
);

export const fetchDepartmentsByCollege = createAsyncThunk(
  'unieventify/fetchDepartmentsByCollege',
  async () => {
    const response = await http.get('unieventify/departmentsbycollege/');
    if (response.status !== 200) {
      throw new Error('Failed to fetch departments by college');
    }
    return response.data;
  }
);

export const fetchDocuments = createAsyncThunk(
  'unieventify/fetchDocuments',
  async (_, { getState }: any) => {
    const token = getState().auth.token;
    const response = await http.get('unieventify/documents/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    
    if (response.status !== 200) {
      throw new Error('Failed to fetch documents');
    }
    
    // Return the raw documents array to be processed in the component
    return response.data;
  }
);

// Create the slice
const unieventifySlice = createSlice({
  name: 'eventCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to current uder details';
      })

      .addCase(fetchUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.userRole = action.payload;
      })
      .addCase(fetchUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to current uder details';
      })      

      .addCase(fetchUserRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.userRoles = action.payload;
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to current uder details';
      })

      // fetch users 
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to users';
      })

      // fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event categories';
      })
      
      //participated events
      .addCase(fetchParticipatedEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipatedEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.participatedEvents = action.payload;
      })
      .addCase(fetchParticipatedEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load participated events';
      })

      //list events
      .addCase(fetchListEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.listEvents = action.payload;
      })
      .addCase(fetchListEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load participated events';
      })

      // fetch Timeline Events
      .addCase(fetchTimelineEvents.pending, (state) => {
        state.timelineLoading = true;
        state.error = null;
      })
      .addCase(fetchTimelineEvents.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.timeline = action.payload;
      })
      .addCase(fetchTimelineEvents.rejected, (state, action) => {
        state.timelineLoading = false;
        state.error = action.error.message || 'Failed to load timeline events';
      })

      //fetch approval events
      .addCase(fetchApprovalEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.approvalEvents = action.payload;
      })
      .addCase(fetchApprovalEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load timeline events';
      })

      //fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load timeline events';
      })      

      // fetch Event Categories
      .addCase(fetchEventCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event categories';
      })

      //fetch EventTypes
      .addCase(fetchEventTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.types = action.payload;
      })
      .addCase(fetchEventTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event types';
      })

      //fetch Setups
      .addCase(fetchSetup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSetup.fulfilled, (state, action) => {
        state.loading = false;
        state.setups = action.payload;
      })
      .addCase(fetchSetup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load setups';
      })

      //fetch EventTypes
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event types';
      })
      
      //fetch EventTypes
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event types';
      })      

      // fetch College
      .addCase(fetchCollegeses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeses.fulfilled, (state, action) => {
        state.loading = false;
        state.colleges = action.payload;
      })
      .addCase(fetchCollegeses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load colleges';
      })

      //fetch departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load departments';
      })

      //fetch DepartmentsByCollege
      .addCase(fetchDepartmentsByCollege.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentsByCollege.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentsByCollege = action.payload;
      })
      .addCase(fetchDepartmentsByCollege.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load departments by college';
      })

      //fetch Documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documentsByYear = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load departments by college';
      });
  },
});

// Export the actions and reducer
export default unieventifySlice.reducer;