import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useEffect } from "react";
import Friends from "../../components/Friends";
import PostMain from "./components/post";
import { fetchEvents } from "../unieventify/src/Application/slice"; // Adjust path as needed

export default function Post() {
    const dispatch = useAppDispatch();
    const { first_name, middle_name, last_name } = useAppSelector((state) => state.auth.user);
    const { events, loading, error } = useAppSelector((state) => state.unieventify); // Adjust based on your state structure
    
    useEffect(() => {
        dispatch(fetchEvents());
    }, [dispatch]);
    
    // Filter only major events
    const majorEvents = events ? events.filter((event: any) => event.majorEvent === true) : [];

    return (
        <>
            <div className="col-span-2">
                {/* Avatars first */}
                <div className="p-5">
                    <h2 className="text-xl text-white font-bold">
                        Welcome, {first_name} {middle_name} {last_name}!
                    </h2>
                </div>
                <div className="p-5">
                    <Friends />
                </div>
                <div className="max-h-screen overflow-y-scroll px-5 pb-28 pt-5">
                    <h3 className="text-lg text-white font-semibold mb-4">Unieventify Major Events </h3>
                    {loading ? (
                        <p className="text-white">Loading events...</p>
                    ) : error ? (
                        <p className="text-red-500">Error loading events: {error}</p>
                    ) : majorEvents.length > 0 ? (
                        majorEvents.map(event => (
                            <div key={event.id} className="bg-gray-800 rounded-lg p-4 mb-4 text-white">
                                <h4 className="text-lg font-bold">{event.eventName}</h4>
                                <p className="text-sm opacity-80 mt-1">{event.eventDescription}</p>
                                <div className="flex justify-between mt-2 text-sm opacity-70">
                                    <span>
                                        {new Date(event.startDateTime).toLocaleDateString()} at{' '}
                                        {new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span>{event.venue.venueName || event.setup?.setupName || "No venue specified"}</span>
                                </div>
                                {event.department && event.department.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {event.department.map(dept => (
                                            <span key={dept.id} className="px-2 py-1 bg-blue-900 text-xs rounded-full">
                                                {dept.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-white">No major events found.</p>
                    )}
                    <PostMain />
                    <PostMain />
                </div>
            </div>
            <div>
                <h1 className="text-xl text-white font-bold">Notifications</h1>
                {/* school matters here! */}
            </div>
        </>
    );
}