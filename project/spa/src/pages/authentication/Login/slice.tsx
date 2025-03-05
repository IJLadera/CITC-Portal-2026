import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from "../providers/models";
import { RootState } from '../../../store';
import Cookies from "js-cookie";

interface AuthState {
    user: User;
    token: string;
    loggedIn: boolean
}

const initialState: AuthState = {
    user: {
        first_name: '',
        last_name: '',
        middle_name: '',
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
            state.token = action.payload;
            // Cookies.set('auth_token', action.payload, { expires: 10 / (60 * 24) }); // 1 hour
        },
        mutateLoggedIn: (state, action:PayloadAction<boolean>) => {
            state.loggedIn = action.payload
        }
    }
})

export const { storeUser, storeToken, mutateLoggedIn } = AuthSlice.actions

export const selectAuth = (state: RootState) => state.auth

export default AuthSlice.reducer