import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Post } from './model';
import { RootState } from '../../../../store';

interface PostState {
  posts : any[]
}

const initialState: PostState = {
  posts: []
}

export const PostSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    storePost: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    appendPost: (state, action: PayloadAction<Post>) => {
      state.posts = [
        ...state.posts,
        action.payload
      ]
    }
  }
})

export const { storePost, appendPost } = PostSlice.actions

export const selectPost = (state: RootState) => state.post

export default PostSlice.reducer
