// src/store/eventCategoriesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { EventCategorySlice, College, Department } from '../../../Components/models';

// Define initial state type
interface EventCategoriesState {
  categories: EventCategorySlice[];
  colleges: College[];
  departments: Department[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: EventCategoriesState = {
  categories: [],
  colleges: [],
  departments: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching event categories from the API
export const fetchEventCategories = createAsyncThunk(
  'eventCategories/fetchEventCategories',
  async () => {
    const response = await fetch('http://localhost:8000/api/v1/unieventify/eventcategories/');
    if (!response.ok) {
      throw new Error('Failed to fetch event categories');
    }
    return response.json();
  }
);

// Create async thunk for fetching colleges from the API
export const fetchCollegeses = createAsyncThunk(
  'eventCategories/fetchColleges',
  async () => {
    const response = await fetch('http://localhost:8000/api/v1/unieventify/colleges/');
    if (!response.ok) {
      throw new Error('Failed to fetch colleges');
    }
    return response.json();
  }
);

export const fetchDepartments = createAsyncThunk(
  'eventCategories/fetchDepartments',
  async () => {
    const response = await fetch('http://localhost:8000/api/v1/unieventify/departments/');
    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }
    return response.json();
  }
);


// Create the slice
const eventCategoriesSlice = createSlice({
  name: 'eventCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load event categories';
      })

      // Handling colleges fetch
      .addCase(fetchCollegeses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollegeses.fulfilled, (state, action) => {
        state.loading = false;
        state.colleges = action.payload;
      })
      .addCase(fetchCollegeses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load colleges';
      })

      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load colleges';
      });
  },
});

// Export the actions and reducer
export default eventCategoriesSlice.reducer;
