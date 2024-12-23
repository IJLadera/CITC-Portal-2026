import { Avatar } from "flowbite-react";

export default function Friends () {
    return (
        <div className="flex justify-center gap-4">
            <Avatar rounded />
            <Avatar rounded />
            <Avatar rounded />
            <Avatar rounded />
            <Avatar rounded />
            <Avatar.Group>
                <Avatar rounded stacked />
                <Avatar rounded stacked />
                <Avatar rounded stacked />
                <Avatar rounded stacked />
                <Avatar.Counter total={10} href="#" />
            </Avatar.Group>
        </div>
    )
}