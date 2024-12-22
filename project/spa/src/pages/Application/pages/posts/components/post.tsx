import { Avatar } from "flowbite-react";

export default function PostMain () {
    return (
        <div className="m-4">
            <div className="">
                <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fd1csarkz8obe9u.cloudfront.net%2Fposterpreviews%2Fjob-hiring-social-media-post-design-template-56379986d7cddb8c174af8de84b08447_screen.jpg%3Fts%3D1628348180&f=1&nofb=1&ipt=746b96429798c93047cc5f4754d7a2c406ad0e585c8bcefaf18295adac51e73f&ipo=images" alt="something"  />
            </div>
            <div className="flex gap-4 mt-4">
                <div>
                    <Avatar rounded />
                </div>
                <div className="text-white max-w-96">
                    <p className="truncate overflow-hidden">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    <a href="#" className="text-yellow">Comment</a>
                </div>
            </div>
        </div>
    )
}