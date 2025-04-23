import { UserPost } from "../../../authentication/Login/model";

export type Post = {
    uuid: string;
    description: string;
    created_by: UserPost;
    image: string;
    timestamp: string;
}
