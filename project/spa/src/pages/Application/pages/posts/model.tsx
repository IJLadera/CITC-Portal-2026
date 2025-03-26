import { User } from "../../../authentication/Login/model";

export type Post = {
    message: string,
    author: User,
    post_imgae: string,
}