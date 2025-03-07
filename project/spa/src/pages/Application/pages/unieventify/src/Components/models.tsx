export interface User {
    id: number,
    id_number: number,
    uuid: string,
    email: string,
    first_name: string,
    last_name: string,
    middle_name: string,
    username: string,
    idNumber: number,
    role: {
        uuid: number,
        name: string,
        rank: number
    },
    department: {
        id: number | null,
        name: string,
        college: number
    },
    section: Section,
    organization: StudentOrg,
    image: string,
    is_staff: boolean,
    is_active: boolean,
    highestRankRole: any,
}


export interface EventCategorySlice{
    id: string,
    eventCategoryName: string
}

export interface EventCategory{
    id: number,
    eventCategoryName: string
}



export interface Event{
    id: number,
    participants: [],
    created_by: {
        id: number,
        idNumber: number,
        email: string,
        first_name: string,
        last_name: string,
        role: {
            id: number,
            designation: string,
            rank: number
        },
        department: number
    },
    eventCategory: EventCategory,
    eventType: [],
    status: Status,
    venue: Venue,
    setup: Setup,
    department: Department[],
    meetinglink: string,
    eventName: string,
    eventDescription: string,
    startDateTime: string, 
    endDateTime: string,
    timestamp: Date,
    approveDocuments: string,
    images: string,
    isAnnouncement: boolean,
    isAprrovedByDean: boolean,
    isAprrovedByChairman: boolean,
    majorEvent: boolean,
    recurrence_type: string,
    recurrence_days: string
}

export interface Section{
    id: number,
    section: string,
    tblYearLevel: YearLevel
}

export interface Role{
    uuid: number,
    designation: string,
    //addition ni
    name: string,
    
    rank: number
}

export interface Department{
    id: number,
    name: string,
    college: number
}

export interface College{
    id: number,
    name: string
}

export interface Status{
    id: number,
    name: string
}

export interface Venue {
    id: number,
    venueName: string,
    location: string
}

export interface Setup{
    id: number,
    setupName: string
}

export interface StudentOrg{
    studentOrgName: string
    studentOrgType: string
}

export interface EventType{
    id: number,
    eventTypeName: string
}

export interface YearLevel{
    id: number,
    yearLevel: string
    find: (year: any) => any; 
}

export interface Document {
    approveDocuments: string; 
    timestamp: string; 
  }

export interface EventNotification {
    id: number;
    is_read: boolean;
    event: {
      id: number;
      eventName: string;
      eventDescription: string;
      startDateTime: string;
      endDateTime: string;
      status: string;
    };
  }
  
export interface ApprovalEvent {
    id: number;
    eventName: string;
    eventDescription: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  }