import { configureStore } from '@reduxjs/toolkit'
import AuthSlice from './pages/authentication/Login/slice'



const store = configureStore({
    reducer: {
        'auth' : AuthSlice
    }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch


export default store