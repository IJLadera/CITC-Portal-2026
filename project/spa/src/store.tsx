import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AuthSlice from './pages/authentication/Login/slice';
import LMSSlice from './pages/Application/pages/lms/slice';
import sessionStorage from 'redux-persist/lib/storage/session';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import unieventifyReducer from './pages/Application/pages/unieventify/src/Application/slice';
import UniEventifyApplication from './pages/Application/pages/unieventify/src/Application/application';

// Create a rootReducer with a reset action
const appReducer = combineReducers({
    auth: AuthSlice,
    lms: LMSSlice,
    unieventify: unieventifyReducer,
});

// Reset root reducer when logout action is dispatched
const rootReducer = (state: any, action:any) => {
    if (action.type === 'auth/mutateLoggedIn' && action.payload === false) {
        // Reset redux store on logout
        state = undefined;
    }
    return appReducer(state, action);
};

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: sessionStorage,
    whitelist: ['auth', 'unieventify'], // persist only auth and unieventify slices
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // whitelisting these actions from redux-persist to delete the persist data
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

// Create persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;