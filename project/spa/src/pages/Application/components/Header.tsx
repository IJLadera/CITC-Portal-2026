import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../hooks';
import { useNavigate } from 'react-router-dom';
import { RiNotification2Line, RiMenuLine } from 'react-icons/ri';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { mutateLoggedIn } from '../../authentication/Login/slice';
import { persistor } from '../../../store';
import Cookies from 'js-cookie';
import { getRoleDisplay } from '../../../types/roles';

// Helper function to extract role name from string or object
function getRoleName(role: any): string {
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role?.name) return role.name;
    return String(role);
}

export default function Header() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotificationMenu, setShowNotificationMenu] = useState(false);
    const [activeNotificationTab, setActiveNotificationTab] = useState<'notifications' | 'announcements'>('notifications');

    const handleLogout = () => {
        // First dispatch the logout action to clear the Redux state
        dispatch(mutateLoggedIn(false));

        // Clear all storage
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('expires_at');
        sessionStorage.removeItem('persist:root');

        // Clear cookies
        Cookies.remove("auth_token");
        Cookies.remove("login_attempts_*");

        // Purge the persistor
        persistor.purge().then(() => {
            // Force a page reload to ensure clean state
            window.location.href = '/login';
        });
    };

    return (
        <header className="bg-[#1A1851] border-b border-indigo-600 px-6 py-4">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                {/* Left - Logo */}
                <div className="flex items-center gap-3">
                    <img 
                        src={process.env.PUBLIC_URL + 'inverted-logo.png'} 
                        alt="CITC Logo" 
                        className="w-10 h-10"
                    />
                    <h1 className="text-white font-bold text-xl">CITC</h1>
                </div>

                {/* Right - Icons */}
                <div className="flex items-center gap-6">
                    {/* Combined Notifications & Announcements */}
                    <div className="relative">
                        <button 
                            className="text-gray-400 hover:text-white transition-colors relative"
                            title="Notifications & Announcements"
                            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                        >
                            <RiNotification2Line size={24} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* Notification Dropdown Menu */}
                        {showNotificationMenu && (
                            <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg border border-indigo-600 z-50">
                                {/* Tab Navigation */}
                                <div className="flex border-b border-gray-700">
                                    <button
                                        onClick={() => setActiveNotificationTab('notifications')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeNotificationTab === 'notifications'
                                                ? 'text-white border-b-2 border-indigo-500'
                                                : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                    >
                                        Notifications
                                    </button>
                                    <button
                                        onClick={() => setActiveNotificationTab('announcements')}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeNotificationTab === 'announcements'
                                                ? 'text-white border-b-2 border-indigo-500'
                                                : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                    >
                                        Announcements
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4 max-h-96 overflow-y-auto">
                                    {activeNotificationTab === 'notifications' ? (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                                <p className="text-gray-100 text-sm font-medium">New Event Created</p>
                                                <p className="text-gray-400 text-xs mt-1">UniEventify - 2 hours ago</p>
                                            </div>
                                            <div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                                <p className="text-gray-100 text-sm font-medium">Event Registration Confirmed</p>
                                                <p className="text-gray-400 text-xs mt-1">UniEventify - 5 hours ago</p>
                                            </div>
                                            <div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                                <p className="text-gray-100 text-sm font-medium">New Announcement</p>
                                                <p className="text-gray-400 text-xs mt-1">System - 1 day ago</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                                <p className="text-gray-100 text-sm font-medium">Important System Update</p>
                                                <p className="text-gray-400 text-xs mt-1">Admin - 3 days ago</p>
                                            </div>
                                            <div className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                                <p className="text-gray-100 text-sm font-medium">Maintenance Scheduled</p>
                                                <p className="text-gray-400 text-xs mt-1">Admin - 1 week ago</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* View All Button */}
                                <div className="border-t border-gray-700 p-3">
                                    <button
                                        onClick={() => {
                                            navigate(
                                                activeNotificationTab === 'notifications'
                                                    ? '/unieventify/app/notifications/'
                                                    : '/unieventify/app/announcements/'
                                            );
                                            setShowNotificationMenu(false);
                                        }}
                                        className="w-full text-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                                    >
                                        View All {activeNotificationTab === 'notifications' ? 'Notifications' : 'Announcements'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
                        >
                            <FaUser />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-indigo-600 z-50">
                                <div className="p-4 border-b border-gray-700">
                                    <p className="text-white font-semibold">
                                        {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-gray-400 text-sm">{user.email}</p>
                                    {user.roles && user.roles.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {user.roles.map((role: any, index: number) => {
                                                const roleName = getRoleName(role);
                                                return (
                                                    <span 
                                                        key={typeof role === 'object' && role?.uuid ? role.uuid : `${roleName}-${index}`}
                                                        className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full"
                                                    >
                                                        {getRoleDisplay(roleName)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <FaUser size={16} />
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <FaCog size={16} />
                                        Settings
                                    </button>
                                    <div className="border-t border-gray-700 my-2"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 flex items-center gap-2 transition-colors"
                                    >
                                        <FaSignOutAlt size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
