import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { attendance } from "./models";
import { RootState } from "../../../../store";

interface LMSSlice {
    attendance: attendance[]
}

const initialState: LMSSlice = {
    attendance: []
}

export const LMSSlice = createSlice({
    name: 'lms',
    initialState,
    reducers: {
        storeAttendance: (state, action:PayloadAction<Array <attendance>>) => {
            state.attendance = action.payload;
        }
    }
})

export const { storeAttendance } = LMSSlice.actions

export const selectLMS = (state: RootState) => state.lms

export default LMSSlice.reducer