import http from "../../../../http"
import { Post } from "./model"

export const getPosts = async () => {
  try {
    const response = await http.get('lms/post/')
    return response
  } catch (error) {
    throw(error)
  }
}

export const createPost = async (payload:Post) => {
  try {
    const response = await http.post('lms/post/')
    return response
  } catch (error) {
    throw (error)
  }
}


