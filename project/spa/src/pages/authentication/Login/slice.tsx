import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from "../providers/models";
import { RootState } from '../../../store';

interface AuthState {
    user: User;
    token: string;
    loggedIn: boolean
}

const initialState: AuthState = {
    user: {
        first_name: '',
        last_name: '',
        email: '',
        uuid: ''
    },
    token: '',
    loggedIn: false
}

export const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        storeUser: (state, action:PayloadAction<User>) => {
            state.user = action.payload
        },
        storeToken: (state, action:PayloadAction<string>) => {
            state.token = action.payload
        },
        mutateLoggedIn: (state, action:PayloadAction<boolean>) => {
            state.loggedIn = action.payload
        }
    }
})

export const { storeUser, storeToken, mutateLoggedIn } = AuthSlice.actions

export const selectAuth = (state: RootState) => state.auth

export default AuthSlice.reducer