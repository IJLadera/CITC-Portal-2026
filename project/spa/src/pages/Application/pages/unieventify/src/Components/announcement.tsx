import { Banner } from "flowbite-react";
import { MdAnnouncement } from "react-icons/md";
import { Editor, EditorState, convertFromRaw, ContentState } from "draft-js";
import { useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';

interface AnnouncementProps {
    event: any;
}

export default function Announcement({ event } : AnnouncementProps) {

    // Helper function to create the editor state from event description
    const getEditorContent = () => {
        try {
            const contentState = convertFromRaw(JSON.parse(event.eventDescription));
            return EditorState.createWithContent(contentState);
        } catch (error) {
            return null;
        }
    };
    const navigate = useNavigate();

    const editorState = getEditorContent();

    const handleclick = () => {
        navigate(`/events/${event.id}`)
    }

    // Conditionally render the banner based on showBanner state
    return (
        <Banner>
            <div className="flex w-full items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700 cursor-pointer" onClick={handleclick}>
                <div className="flex items-center space-x-4 px-2">
                    <MdAnnouncement className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div className="flex flex-col max-w-80">
                        <p className="text-base font-semibold text-gray-700 dark:text-gray-100 break-words overflow-visible whitespace-normal">
                            {event.eventName}
                        </p>
                        <div className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                            {editorState ? (
                                <Editor editorState={editorState} readOnly={true} onChange={() => {}}/>
                            ) : (
                                <span>{event.eventDescription || "No description provided."}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Banner>
    );
}
