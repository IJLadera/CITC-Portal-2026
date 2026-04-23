import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Friends from "../../components/Friends";
import { fetchEvents } from "../unieventify/src/Application/slice";
import { useNavigate } from "react-router-dom";
import { getPosts } from './api';
import { storePost } from './slice';

import {
  Editor,
  EditorState,
  convertFromRaw,
  ContentState,
} from "draft-js";
import "draft-js/dist/Draft.css"; // Import Draft.js styles

export default function Post() {
    const dispatch = useAppDispatch();
    const { first_name, middle_name, last_name } = useAppSelector((state) => state.auth.user);
    const { events } = useAppSelector((state) => state.unieventify);
    const navigate = useNavigate();
    const token = useAppSelector((state) => state.auth.token);

    // State to store LMS posts
    const posts = useAppSelector((state) => state?.post.posts)
    //const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch events and LMS posts
    useEffect(() => {
        // Dispatch events fetch
        dispatch(fetchEvents());
        if (posts.length === 0) {
            const fetchPost = getPosts();
            fetchPost.then(response => {
                //setPosts(response.data);
                dispatch(storePost(response.data))
                setLoading(false)
            })
        }

    }, []);
    
    // Function to parse description to EditorState
    const parseDescription = (description: string): EditorState => {
        try {
            // Check if description is a valid JSON string
            const parsedDescription = typeof description === 'string' 
                ? JSON.parse(description) 
                : description;

            // Convert raw content to ContentState
            const contentState = convertFromRaw(parsedDescription);
            return EditorState.createWithContent(contentState);
        } catch (error) {
            // Fallback to plain text if parsing fails
            console.warn("Error parsing description:", error);
            const contentState = ContentState.createFromText(
                typeof description === 'string' 
                    ? description 
                    : JSON.stringify(description)
            );
            return EditorState.createWithContent(contentState);
        }
    };
    
    // Memoized sorting of events and posts
    const sortedContent = useMemo(() => {
        // Filter and prepare major events
        const majorEvents = events 
            ? events
                .filter((event: any) => event.majorEvent === true)
                .map(event => ({
                    ...event,
                    type: 'event',
                    timestamp: new Date(event.timestamp).getTime()
                }))
            : [];
        
        // Prepare posts

        const formattedPosts = Array.isArray(posts) ? posts.map(post => ({
            ...post,
            type: 'post',
            timestamp: new Date(post.timestamp).getTime()
        })) : []

        // Combine and sort by timestamp (most recent first)
        return [...majorEvents, ...formattedPosts]
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [events, posts]);

    // Loading and error states
    if (posts.length === 0) {
        return (
            <div className="text-white text-center p-5">
                Loading events and posts...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-5">
                {error}
            </div>
        );
    }

    return (
        <>
            <div className="col-span-2">
                <div className="p-5">
                </div>
                <div className="p-5">
                    <Friends />
                </div>
                <div className="max-h-screen overflow-y-scroll px-5 pb-28 pt-5">
                    <h3 className="text-lg text-white font-semibold mb-4">Recent Events and Postsasdas</h3>    
                    {sortedContent.map((item) => (
                        item.type === 'event' ? (
                            <div 
                                key={`event-${item.id}`} 
                                className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-4 cursor-pointer"
                                onClick={() => navigate(`/unieventify/app/eventdetails/${item.id}`)}
                            >
                                <img
                                    src={item.images || require("../unieventify/src/images/logo.png")}
                                    alt={item.eventName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-6 text-white">
                                    <h4 className="text-2xl font-bold mb-2">{item.eventName}</h4>
                                    <p className="text-sm opacity-80 mb-4">
                                        {item.eventDescription.replace(/<[^>]+>/g, '')}
                                    </p>
                                    <div className="flex justify-between text-sm opacity-70">
                                        <span>
                                            {new Date(item.startDateTime).toLocaleDateString()} at {" "}
                                            {new Date(item.startDateTime).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span>{item.venue?.venueName || item.setup?.setupName || "No venue specified"}</span>
                                    </div>

                                    {item.department && item.department.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {item.department.map((dept:any) => (
                                                <span
                                                    key={dept.id}
                                                    className="px-3 py-1 bg-blue-900 text-xs rounded-full"
                                                >
                                                    {dept.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div 
                                key={`post-${item.uuid}`} 
                                className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-4"
                            >
                                <div className="p-6 text-white">
                                    {
                                            item.image && (
                                                <img
                                                    src={item.image}
                                                    alt="Post"
                                                    className="w-full mt-4 rounded"
                                                />
                                            )
                                    }
                                    <div className="flex items-center mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold">
                                                {item.created_by.first_name} {item.created_by.last_name}
                                            </h4>
                                            <p className="text-sm opacity-70">
                                                { new Date(item.timestamp).toLocaleString() }
                                            </p>
                                        </div>
                                    </div>
                                    {item.description && (
                                        <div className="text-sm">
                                            <Editor
                                                editorState={parseDescription(item.description)}
                                                readOnly={true}
                                                onChange={() => {}} // Required prop for controlled component
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
            <div>
                <h1 className="text-xl text-white font-bold">Notifications</h1>
                {/* school matters here! */}
            </div>
        </>
    );
}
