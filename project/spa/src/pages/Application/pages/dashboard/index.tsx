import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchEvents } from '../unieventify/src/Application/slice';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../posts/api';
import { storePost } from '../posts/slice';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaComment, FaRegComment } from 'react-icons/fa';

interface Event {
    id: string;
    eventName: string;
    eventDescription: string;
    startDateTime: string;
    endDateTime: string;
    images?: string;
    venue?: { venueName: string };
    setup?: { setupName: string };
    department?: Array<{ name: string }>;
    majorEvent: boolean;
    timestamp: string;
    type: 'event';
    image?: string;
}

interface App {
    uuid: string;
    name: string;
    logo?: string;
    logo_url?: string;
    url: string;
    description: string;
}


export default function Dashboard() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);
    const user = useAppSelector((state) => state.auth.user);
    const { events } = useAppSelector((state) => state.unieventify);
    const navigate = useNavigate();
    
    const [apps, setApps] = useState<App[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [likedContent, setLikedContent] = useState<Set<string>>(new Set());

    // Fetch applications
    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await axios.get('/api/apps/', {
                    headers: { Authorization: `Bearer ${ token }` },
                });
                setApps(response.data);
            } catch (error) {
                console.error('Failed to fetch apps:', error);
            }
        };

        if (token) {
            fetchApps();
        }
    }, [token]);

    // Fetch events and posts
    useEffect(() => {
        dispatch(fetchEvents());
        const fetchPost = getPosts();
        fetchPost.then((response) => {
            setPosts(response.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [dispatch]);

    // Categorize events
    useEffect(() => {
        if (events && events.length > 0) {
            const now = new Date();
            const ongoing: any[] = [];
            const upcoming: any[] = [];

            events.forEach((event: any) => {
                const startDate = new Date(event.startDateTime);
                const endDate = new Date(event.endDateTime);

                if (startDate <= now && now <= endDate) {
                    ongoing.push(event);
                } else if (startDate > now) {
                    upcoming.push(event);
                }
            });

            setOngoingEvents(ongoing.sort((a: any, b: any) => 
                new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
            ));

            setUpcomingEvents(upcoming.sort((a: any, b: any) => 
                new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
            ));
        }
    }, [events]);

    // Helper function to parse Draft.js content
    const parseDraftContent = (content: any) => {
        if (typeof content === 'string') {
            try {
                const parsed = JSON.parse(content);
                if (parsed.blocks && Array.isArray(parsed.blocks)) {
                    return parsed.blocks.map((block: any) => block.text).join('\n');
                }
            } catch {
                return content;
            }
        }
        return content || '';
    };

    // Combine and sort events and posts for center area
    const sortedContent = useMemo(() => {
        const majorEvents = events
            ? events
                .filter((event: any) => event.majorEvent === true)
                .map((event: any) => ({
                    ...event,
                    type: 'event',
                    timestamp: new Date(event.timestamp).getTime(),
                }))
            : [];

        const formattedPosts = Array.isArray(posts)
            ? posts.map((post) => ({
                ...post,
                type: 'post',
                timestamp: new Date(post.timestamp || post.created_at || post.createdAt).getTime(),
                description: post.description ? parseDraftContent(post.description) : post.content || '',

                authorName: post.user?.first_name && post.user?.last_name 
                    ? `${post.user.first_name} ${post.user.last_name}`
                    : post.author?.name || post.created_by?.first_name 
                        ? `${post.created_by.first_name} ${post.created_by.last_name}` 
                        : 'Anonymous',

                // ✅ ADD THIS
                authorImage: post.user?.profile_picture 
                    || post.user?.avatar 
                    || post.created_by?.profile_picture 
                    || null,
            }))
            : [];

        return [...majorEvents, ...formattedPosts].sort((a, b) => b.timestamp - a.timestamp);
    }, [events, posts]);

    const toggleLike = (contentId: string) => {
        const newLiked = new Set(likedContent);
        if (newLiked.has(contentId)) {
            newLiked.delete(contentId);
        } else {
            newLiked.add(contentId);
        }
        setLikedContent(newLiked);
    };

    const handleAppClick = (app: App) => {
        navigate(app.url);
    };

    if (loading) {
        return <div className="text-gray-800 text-center p-5">Loading dashboard...</div>;
    }

    return (
        <div className="flex gap-6 h-full overflow-hidden px-8 py-6 bg-white">
            {/* Left Sidebar - Events */}
            <div className="w-72 flex-shrink-0 overflow-y-auto pr-4 custom-scrollbar">
                <div className="mb-8">
                    <h3 className="text-gray-800 font-bold text-lg mb-4">Ongoing</h3>
                    <div className="space-y-3">
                        {ongoingEvents.length > 0 ? (
                            ongoingEvents.map((event) => (
                                <div
                                    key={`ongoing-${event.id}`}
                                    onClick={() => navigate(`/unieventify/app/eventdetails/${event.id}`)}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl p-4 cursor-pointer transition-colors text-white shadow-lg"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold text-lg"></span>
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold text-sm truncate">{event.eventName}</p>
                                            <p className="text-xs opacity-80">
                                                {new Date(event.startDateTime).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-sm p-4 bg-gray-100 rounded-lg">No ongoing events</div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-gray-800 font-bold text-lg mb-4">Upcoming</h3>
                    <div className="space-y-3">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.slice(0, 5).map((event) => (
                                <div
                                    key={`upcoming-${event.id}`}
                                    onClick={() => navigate(`/unieventify/app/eventdetails/${event.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl p-4 cursor-pointer transition-colors text-white shadow-lg"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-indigo-600 font-bold text-lg"></span>
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold text-sm truncate">{event.eventName}</p>
                                            <p className="text-xs opacity-80">
                                                {new Date(event.startDateTime).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-sm p-4 bg-gray-100 rounded-lg">No upcoming events</div>
                        )}
                    </div>
                </div>
                {upcomingEvents.length > 5 && (
                    <button className="text-blue-600 text-sm mt-4 hover:text-blue-500 w-full">
                        View All
                    </button>
                )}
            </div>

            {/* Center - Recent Events and Posts */}
            <div className="flex flex-col h-full">
                <h2 className="font-bold text-yellow-500 mb-4 text-center shrink-0">
                    Recent Events and Posts
                </h2>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="space-y-6 pb-24">
                        {sortedContent.length > 0 ? (
                            sortedContent.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                                    onClick={() => {
                                        if (item.type === 'event') {
                                            navigate(`/unieventify/app/eventdetails/${item.id}`);
                                        }
                                    }}
                                >
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.eventName || item.title || 'Content'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div className="p-6 text-gray-800">
                                        <h4 className="text-2xl font-bold mb-2 text-gray-900">{item.eventName || item.title || 'Post'}</h4>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                            {item.eventDescription?.replace(/<[^>]+>/g, '') || item.description || 'No description'}
                                        </p>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-2">
                                                {item.authorImage ? (
                                                    <img
                                                        src={item.authorImage}
                                                        alt="author"
                                                        className="w-8 h-8 rounded-full object-cover border"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/default-avatar.png'; // fallback image
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
                                                        {(item.authorName || 'U')[0]}
                                                    </div>
                                                )}

                                                <span>
                                                    {item.authorName || item.department?.[0]?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                {new Date(item.startDateTime || item.timestamp || item.created_at || item.createdAt).toLocaleDateString()} at{' '}
                                                {new Date(item.startDateTime || item.timestamp || item.created_at || item.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span>
                                                {item.venue?.venueName || item.setup?.setupName || (item.type === 'post' ? '' : 'No venue')}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLike(`${item.type}-${item.id}`);
                                                }}
                                                className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                {likedContent.has(`${item.type}-${item.id}`) ? (
                                                    <FaHeart size={18} />
                                                ) : (
                                                    <FaRegHeart size={18} />
                                                )}
                                            </button>
                                            <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLike(`${item.type}-${item.id}`);
                                                }}
                                                className="flex items-center gap-1 text-green-500 hover:text-green-400 transition-colors"
                                            >
                                                {likedContent.has(`${item.type}-${item.id}`) ? (
                                                    <FaComment size={18} />
                                                ) : (
                                                    <FaRegComment size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-600 text-center p-10">
                                No events or posts to display
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - User Profile and Apps */}
            <div className="w-80 flex-shrink-0 overflow-y-auto pl-4 custom-scrollbar space-y-6">
                {/* User Profile */}
                <div className="bg-gray-100 rounded-2xl p-8 text-center shadow-lg">
                    <div className="w-20 h-20 bg-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl"></span>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg">
                        {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-gray-600 text-sm">Student</p>
                </div>

                {/* Apps Section */}
                <div>
                    <h3 className="text-gray-800 font-bold text-lg mb-4">Apps</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {apps && apps.length > 0 ? (
                            apps.map((app) => (
                                <div
                                    key={app.uuid}
                                    onClick={() => handleAppClick(app)}
                                    className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 cursor-pointer hover:from-indigo-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center min-h-32 shadow-lg"
                                >
                                    {app.logo || app.logo_url ? (
                                        <img
                                            src={app.logo || app.logo_url}
                                            alt={app.name}
                                            className="w-14 h-14 object-contain mb-3"
                                        />
                                    ) : (
                                        <span className="text-3xl mb-2"></span>
                                    )}
                                    <p className="text-white font-semibold text-sm text-center">{app.name}</p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-gray-500 text-sm text-center p-4 bg-gray-100 rounded-lg">
                                No apps available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}