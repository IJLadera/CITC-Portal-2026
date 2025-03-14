import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AuthSlice from './pages/authentication/Login/slice';
import LMSSlice from './pages/Application/pages/lms/slice';
import sessionStorage from 'redux-persist/lib/storage/session';
import { persistStore, persistReducer } from 'redux-persist';
import unieventifyReducer from './pages/Application/pages/unieventify/src/Application/slice'
import UniEventifyApplication from './pages/Application/pages/unieventify/src/Application/application';

// Combine reducers
const rootReducer = combineReducers({
    auth: AuthSlice,
    lms: LMSSlice,
    unieventify: unieventifyReducer,
});

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: sessionStorage,
    whitelist: ['auth', 'unieventify'], // persist only auth slice
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Required for redux-persist to work correctly
            // serializableCheck: {
            //     // Ignore actions from redux-persist
            //     ignoredActions: ['persist/PERSIST'],
            //   },
        }),
});

// Create persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
