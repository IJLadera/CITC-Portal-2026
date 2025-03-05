import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AuthSlice from './pages/authentication/Login/slice';
import LMSSlice from './pages/Application/pages/lms/slice';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';
import eventCategoriesReducer from './pages/Application/pages/unieventify/src/Application/Contents/Events/slice'

// Combine reducers
const rootReducer = combineReducers({
    auth: AuthSlice,
    lms: LMSSlice,
    eventCategories: eventCategoriesReducer,
});

// Persist configuration
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'], // persist only auth slice
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
