import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { attendance, Department, SchoolYear, SectionType, SubjectType, YearLevelType, ClassroomType, ModuleType } from "./models";
import { RootState } from "@store";


interface LMSSlice {
    attendance: attendance[]
    deparments: Department[],
    schoolyears: SchoolYear[],
    year_level: YearLevelType[],
    sections: SectionType[],
    subjects: SubjectType[],
    classRooms: ClassroomType[],
    modules: ModuleType[],
}

const initialState: LMSSlice = {
    attendance: [],
    deparments: [],
    schoolyears: [],
    year_level: [],
    sections: [],
    subjects: [],
    classRooms: [],
    modules: []
}

export const LMSSlice = createSlice({
    name: 'lms',
    initialState,
    reducers: {
        storeAttendance: (state, action:PayloadAction<Array <attendance>>) => {
            state.attendance = action.payload;
        },
        storeDeparments: (state, action:PayloadAction<Array<Department>>) => {
            state.deparments = action.payload;
        },
        storeSchoolYear: (state, action: PayloadAction<Array<SchoolYear>>) => {
            state.schoolyears = action.payload;
        },
        storeYearLevel: (state, action: PayloadAction<Array<YearLevelType>>) => {
            state.year_level = action.payload;
        },
        storeSections: (state, action: PayloadAction<Array<SectionType>>) => {
            state.sections = action.payload;
        },
        storeSubjects: (state, action: PayloadAction<Array<SubjectType>>) => {
            state.subjects = action.payload;
        },
        storeClassRooms: (state, action:PayloadAction<Array<ClassroomType>>) => {
            state.classRooms = action.payload;
        },
        storeModules: (state, action:PayloadAction<Array<ModuleType>>) => {
            state.modules = action.payload;
        }
    }
})

export const { 
    storeAttendance,
    storeDeparments,
    storeSchoolYear,
    storeYearLevel,
    storeSections,
    storeSubjects,
    storeClassRooms,
    storeModules
} = LMSSlice.actions

export const selectLMS = (state: RootState) => state.lms
export const selectDepartments = (state:RootState):Department[] => state.lms.deparments
export const selectSchoolYear = (state: RootState):SchoolYear[] => state.lms.schoolyears

export default LMSSlice.reducer
