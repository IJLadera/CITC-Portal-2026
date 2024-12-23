import Friends from "../../components/Friends";
import PostMain from "./components/post";

export default function Post () {
    return (
        <>
            <div className="col-span-2">
                {/* Avatars first */}
                <div className="p-5">
                    <Friends />
                </div>
                <div className="max-h-screen overflow-y-scroll px-5 pb-28 pt-5">
                    <PostMain />
                    <PostMain />
                </div>
            </div>
            <div>
                <h1 className="text-xl text-white font-bold">Notifications</h1>
                {/* school matters here! */}
            </div>
        </>
    )
}