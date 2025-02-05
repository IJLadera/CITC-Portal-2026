import { configureStore } from '@reduxjs/toolkit'
import AuthSlice from './pages/authentication/Login/slice'
import LMSSlice from './pages/Application/pages/lms/slice'



const store = configureStore({
    reducer: {
        'auth' : AuthSlice,
        'lms' : LMSSlice,
    }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch


export default store