import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchEvents } from '../unieventify/src/Application/slice';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../posts/api';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaRegComment, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import unieventifyLogo from '../../../../assets/apps/unieventify.png';
import syllabeaseLogo from '../../../../assets/apps/syllabease.png';

const appLogos: Record<string, string> = {
    Syllabease: syllabeaseLogo,
    UniEventify: unieventifyLogo,
};

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
    is_active: boolean;
    is_visible_to_users: boolean;
    display_order: number;
}

interface ModalItem {
    image: string;
    title: string;
    description: string;
    authorName: string;
    authorImage?: string;
    timestamp: string | number;
    type: string;
    id: string;
    venue?: string;
}

function MiniCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();

    const days: (number | null)[] = [];

    // Fill empty slots before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }

    // Fill actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    return (
        <div className="bg-gray-100 rounded-2xl p-5 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => changeMonth(-1)}
                    className="text-gray-600 hover:text-black"
                >
                    ‹
                </button>
                <h3 className="font-bold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year}
                </h3>
                <button
                    onClick={() => changeMonth(1)}
                    className="text-gray-600 hover:text-black"
                >
                    ›
                </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 text-xs text-gray-500 mb-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i}>{d}</div>
                ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-7 gap-1 text-sm text-center">
                {days.map((day, i) => {
                    const isToday =
                        day &&
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();

                    return (
                        <div
                            key={i}
                            className={`p-2 rounded-lg ${
                                isToday
                                    ? 'bg-blue-500 text-white font-bold'
                                    : 'text-gray-700'
                            }`}
                        >
                            {day || ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Post Image component: handles any aspect ratio gracefully ───────────────
function PostImage({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
    const [orientation, setOrientation] = useState<'landscape' | 'portrait' | 'square'>('landscape');

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1.2) setOrientation('landscape');
        else if (ratio < 0.85) setOrientation('portrait');
        else setOrientation('square');
    };

    return (
        <div
            className="w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
            style={{
                maxHeight: orientation === 'portrait' ? '500px' : '420px',
                minHeight: '200px',
            }}
            onClick={onClick}
        >
            <img
                src={src}
                alt={alt}
                onLoad={handleLoad}
                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                className="w-full h-full object-contain hover:opacity-95 transition-opacity"
                style={{
                    maxHeight: orientation === 'portrait' ? '500px' : '420px',
                    objectFit: orientation === 'portrait' ? 'contain' : 'cover',
                }}
            />
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function PostModal({
    item,
    liked,
    onClose,
    onToggleLike,
}: {
    item: ModalItem;
    liked: boolean;
    onClose: () => void;
    onToggleLike: () => void;
}) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const timeStr = (() => {
        try {
            const d = new Date(item.timestamp);
            return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch { return ''; }
    })();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={onClose}
        >
            {/* Close button */}
            <button
                className="absolute top-4 right-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center z-10 transition-colors"
                onClick={onClose}
            >
                <FaTimes size={18} />
            </button>

            <div
                className="flex w-full max-w-5xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxHeight: '90vh', backgroundColor: '#fff' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left — Image */}
                <div
                    className="flex-1 bg-black flex items-center justify-center"
                    style={{ minWidth: 0 }}
                >
                    <img
                        src={item.image}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: '90vh' }}
                    />
                </div>

                {/* Right — Info + Actions */}
                <div className="w-80 flex-shrink-0 flex flex-col bg-white">
                    {/* Author */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                        {item.authorImage ? (
                            <img src={item.authorImage} alt="author"
                                className="w-10 h-10 rounded-full object-cover border"
                                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                                {(item.authorName || 'U')[0]}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.authorName}</p>
                            <p className="text-xs text-gray-400">{timeStr}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                        {item.venue && (
                            <p className="text-xs text-gray-400 mt-3">📍 {item.venue}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 p-4 flex gap-4">
                        <button
                            onClick={onToggleLike}
                            className={`flex items-center gap-2 font-semibold text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
                        >
                            {liked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                            <span>{liked ? 'Liked' : 'Like'}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 font-semibold text-sm transition-colors">
                            <FaRegComment size={20} />
                            <span>Comment</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);
    const user = useAppSelector((state) => state.auth.user);
    const { events } = useAppSelector((state) => state.unieventify);
    const navigate = useNavigate();

    const [apps, setApps] = useState<App[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [appsLoading, setAppsLoading] = useState(true);
    const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [likedContent, setLikedContent] = useState<Set<string>>(new Set());
    const [modalItem, setModalItem] = useState<ModalItem | null>(null);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await axios.get('/api/v1/apps/', {
                    headers: { Authorization: `Token ${token}` },
                });
                const visibleApps = Array.isArray(response.data)
                    ? response.data
                        .filter((app: App) => app.is_active && app.is_visible_to_users)
                        .sort((a: App, b: App) => a.display_order - b.display_order)
                    : [];
                setApps(visibleApps);
            } catch (error) {
                console.error('Failed to fetch apps:', error);
            } finally {
                setAppsLoading(false);
            }
        };
        if (token) fetchApps();
    }, [token]);

    useEffect(() => {
        dispatch(fetchEvents());
        getPosts()
            .then((response) => {
                const data = response.data?.results ?? response.data;
                setPosts(Array.isArray(data) ? data : []);
            })
            .catch(() => setPosts([]))
            .finally(() => setPostsLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (events && events.length > 0) {
            const now = new Date();
            const ongoing: any[] = [];
            const upcoming: any[] = [];
            events.forEach((event: any) => {
                const startDate = new Date(event.startDateTime);
                const endDate = new Date(event.endDateTime);
                if (startDate <= now && now <= endDate) ongoing.push(event);
                else if (startDate > now) upcoming.push(event);
            });
            setOngoingEvents(ongoing.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()));
            setUpcomingEvents(upcoming.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()));
        }
    }, [events]);

    const parseDraftContent = (content: any) => {
        if (typeof content === 'string') {
            try {
                const parsed = JSON.parse(content);
                if (parsed.blocks && Array.isArray(parsed.blocks)) {
                    return parsed.blocks.map((block: any) => block.text).join('\n');
                }
            } catch { return content; }
        }
        return content || '';
    };

    const sortedContent = useMemo(() => {
        const majorEvents = events
            ? events.filter((event: any) => event.majorEvent === true).map((event: any) => ({
                ...event, type: 'event', timestamp: new Date(event.timestamp).getTime(),
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
                    : post.author?.name || (post.created_by?.first_name
                        ? `${post.created_by.first_name} ${post.created_by.last_name}` : 'Anonymous'),
                authorImage: post.user?.profile_picture || post.user?.avatar || post.created_by?.profile_picture || null,
            }))
            : [];
        return [...majorEvents, ...formattedPosts].sort((a, b) => b.timestamp - a.timestamp);
    }, [events, posts]);

    const toggleLike = useCallback((contentId: string) => {
        setLikedContent(prev => {
            const next = new Set(prev);
            next.has(contentId) ? next.delete(contentId) : next.add(contentId);
            return next;
        });
    }, []);

    const openModal = useCallback((item: any) => {
        const image = item.image || item.images || null;
        if (!image) return;
        setModalItem({
            image,
            title: item.eventName || item.title || 'Post',
            description: item.eventDescription?.replace(/<[^>]+>/g, '') || item.description || '',
            authorName: item.authorName || item.department?.[0]?.name || 'Unknown',
            authorImage: item.authorImage,
            timestamp: item.startDateTime || item.timestamp || item.created_at || item.createdAt,
            type: item.type,
            id: item.id,
            venue: item.venue?.venueName || item.setup?.setupName,
        });
    }, []);

    const handleAppClick = (app: App) => {
        if (app.url.startsWith('http://') || app.url.startsWith('https://')) {
            window.open(app.url, '_blank');
        } else {
            navigate(app.url);
        }
    };

    if (postsLoading) {
        return <div className="text-gray-800 text-center p-5">Loading dashboard...</div>;
    }

    return (
        <>
            {/* Modal */}
            {modalItem && (
                <PostModal
                    item={modalItem}
                    liked={likedContent.has(`${modalItem.type}-${modalItem.id}`)}
                    onClose={() => setModalItem(null)}
                    onToggleLike={() => toggleLike(`${modalItem.type}-${modalItem.id}`)}
                />
            )}

            <div className="flex gap-6 h-full overflow-hidden px-8 py-6 bg-white">
                {/* Left Sidebar - Events */}
                <div className="w-72 flex-shrink-0 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="mb-8">
                        <h3 className="text-gray-800 font-bold text-lg mb-4">Ongoing</h3>
                        <div className="space-y-3">
                            {ongoingEvents.length > 0 ? ongoingEvents.map((event) => (
                                <div key={`ongoing-${event.id}`}
                                    onClick={() => navigate(`/unieventify/app/eventdetails/${event.id}`)}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl p-4 cursor-pointer transition-colors text-white shadow-lg"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold text-lg">📅</span>
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold text-sm truncate">{event.eventName}</p>
                                            <p className="text-xs opacity-80">{new Date(event.startDateTime).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500 text-sm p-4 bg-gray-100 rounded-lg">No ongoing events</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-gray-800 font-bold text-lg mb-4">Upcoming</h3>
                        <div className="space-y-3">
                            {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map((event) => (
                                <div key={`upcoming-${event.id}`}
                                    onClick={() => navigate(`/unieventify/app/eventdetails/${event.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-700 rounded-xl p-4 cursor-pointer transition-colors text-white shadow-lg"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-indigo-600 font-bold text-lg">🗓️</span>
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold text-sm truncate">{event.eventName}</p>
                                            <p className="text-xs opacity-80">{new Date(event.startDateTime).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500 text-sm p-4 bg-gray-100 rounded-lg">No upcoming events</div>
                            )}
                        </div>
                    </div>
                    {upcomingEvents.length > 5 && (
                        <button className="text-blue-600 text-sm mt-4 hover:text-blue-500 w-full">View All</button>
                    )}
                </div>

                {/* Center - Feed */}
                <div className="flex flex-col flex-1 h-full min-w-0">
                    <h2 className="font-bold text-yellow-500 mb-4 text-center shrink-0">Posts</h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4 pb-24 max-w-2xl mx-auto">
                            {sortedContent.length > 0 ? sortedContent.map((item) => {
                                const contentId = `${item.type}-${item.id}`;
                                const isLiked = likedContent.has(contentId);
                                const hasImage = !!(item.image || item.images);
                                const imageUrl = item.image || item.images;
                                const timeStr = (() => {
                                    try {
                                        const d = new Date(item.startDateTime || item.timestamp || item.created_at || item.createdAt);
                                        return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    } catch { return ''; }
                                })();

                                return (
                                    <div
                                        key={contentId}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                                            {item.authorImage ? (
                                                <img src={item.authorImage} alt="author"
                                                    className="w-10 h-10 rounded-full object-cover border flex-shrink-0"
                                                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {(item.authorName || 'U')[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {item.authorName || item.department?.[0]?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-400">{timeStr}</p>
                                            </div>
                                            {item.type === 'event' && (
                                                <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-1 rounded-full flex-shrink-0">
                                                    Event
                                                </span>
                                            )}
                                        </div>

                                        {/* Post Text */}
                                        <div className="px-4 pb-3">
                                            <p className="font-bold text-gray-900 text-base mb-1">
                                                {item.eventName || item.title || 'Post'}
                                            </p>
                                            <p className="text-sm text-gray-600 line-clamp-3">
                                                {item.eventDescription?.replace(/<[^>]+>/g, '') || item.description || ''}
                                            </p>
                                            {(item.venue?.venueName || item.setup?.setupName) && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    📍 {item.venue?.venueName || item.setup?.setupName}
                                                </p>
                                            )}
                                        </div>

                                        {/* Post Image — click to open modal */}
                                        {hasImage && (
                                            <PostImage
                                                src={imageUrl}
                                                alt={item.eventName || item.title || 'Post image'}
                                                onClick={() => openModal(item)}
                                            />
                                        )}

                                        {/* Actions row */}
                                        <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100">
                                            <button
                                                onClick={() => toggleLike(contentId)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-colors flex-1 justify-center ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                                            >
                                                {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                                            </button>
                                            <button
                                                onClick={() => hasImage ? openModal(item) : undefined}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 font-semibold text-sm transition-colors flex-1 justify-center"
                                            >
                                                <FaRegComment size={16} />
                                                <span>Comment</span>
                                            </button>
                                            {item.type === 'event' && (
                                                <button
                                                    onClick={() => navigate(`/unieventify/app/eventdetails/${item.id}`)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-500 hover:bg-blue-50 font-semibold text-sm transition-colors flex-1 justify-center"
                                                >
                                                    <span>View Event</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-gray-600 text-center p-10">No events or posts to display</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 flex-shrink-0 overflow-y-auto pl-4 custom-scrollbar space-y-6">

                    {/* Apps */}
                    <div>
                        <h3 className="text-gray-800 font-bold text-lg mb-4">Apps</h3>
                        {appsLoading ? (
                            <div className="text-gray-400 text-sm text-center p-4">Loading apps...</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {apps.length > 0 ? apps.map((app) => {
                                    const logoSrc = appLogos[app.name] || app.logo_url || app.logo || null;
                                    return (
                                        <div
                                            key={app.uuid}
                                            onClick={() => handleAppClick(app)}
                                            className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                                            title={app.description}
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow group-hover:scale-105 transition-transform overflow-hidden border border-gray-100">
                                                {logoSrc ? (
                                                    <img src={logoSrc} alt={app.name}
                                                        className="w-10 h-10 object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fb = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (fb) fb.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className="w-full h-full items-center justify-center text-xl"
                                                    style={{ display: logoSrc ? 'none' : 'flex' }}>
                                                    {app.name[0]}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 mt-2 text-center line-clamp-2">{app.name}</p>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-3 text-gray-500 text-sm text-center p-4 bg-gray-100 rounded-lg">
                                        No apps available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <MiniCalendar />
                </div>
            </div>
        </>
    );
}