import { RiHomeLine, RiInboxLine } from "react-icons/ri";
import { PiSignOutLight, PiBooksThin } from "react-icons/pi";
import { FaUserPlus, FaUser } from "react-icons/fa";
import { FaNotesMedical, FaFileLines } from "react-icons/fa6";
import { Modal, Button, Label, Textarea, FileInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { mutateLoggedIn } from "../../authentication/Login/slice";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { fetchUserRole } from "../pages/unieventify/src/Application/slice";
import { persistor } from "../../../store";
import Cookies from "js-cookie";
import CreatePost from "../pages/posts/createpost";

export default function SideBar() {
    const [openModal, setOpenModal] = useState(false)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

    // const dispatch = useAppDispatch()
    const highestRankRole = useAppSelector((state) => state.unieventify.userRole)

    // Fetch role when the component mounts
    useEffect(() => {
        // fetchRole();
        dispatch(fetchUserRole())
    }, []);


    useEffect(() => {
        const checkSessionExpiration = () => {
            const expiresAt = sessionStorage.getItem('expires_at');
            if (expiresAt && Date.now() > parseInt(expiresAt)) {
                dispatch(mutateLoggedIn(false));
                sessionStorage.removeItem('persist:root');
                sessionStorage.removeItem('auth_token');
                sessionStorage.removeItem('expires_at');
                navigate('/login');
                Cookies.remove("auth_token")
            }
        };

        const interval = setInterval(checkSessionExpiration, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [dispatch, navigate]);

    // Logout handler function
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

    // Auto-logout on session expiration (e.g., 3 minutes)
    useEffect(() => {
        const expirationTimer = setTimeout(() => {
            handleLogout();  // Trigger logout when session expires
        }, 24 * 60 * 60 * 1000); // 1 day expiration

        return () => clearTimeout(expirationTimer); // Cleanup on unmount
    }, [dispatch, navigate]);

    useEffect(() => {
        const token = sessionStorage.getItem('auth_token');
        const expiresAt = sessionStorage.getItem('expires_at');

        if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
            dispatch(mutateLoggedIn(true));
        } else {
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('expires_at');
            dispatch(mutateLoggedIn(false));
        }
    }, [dispatch]);


    return (
        <aside id="default-sidebar" className="fixed z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto">
                <div className="w-[100px] flex">
                    <img src={process.env.PUBLIC_URL + 'inverted-logo.png'} alt="inverted-logo" />
                    <div className="content-center"><p className="text-2xl font-bold text-white">CITC</p></div>
                </div>
                {/* <img src={ process.env.PUBLIC_URL + 'USTP Logo against Dark Background.png' } className="App-logo" alt="logo" /> */}
                <ul className="space-y-2 font-medium">
                    <li>
                        <NavLink to="/" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <RiHomeLine className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="ms-3">Home</span>
                        </NavLink>
                        {/* <a href="#" className="flex items-center p-2 text-white rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                        
                        </a> */}
                    </li>
                    <li>
                        <a href="#" className="flex items-center p-2 text-gray-500 rounded-lg hover:text-white dark:text-white dark:hover:bg-gray-700 group">
                            <RiInboxLine className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Inbox</span>
                            <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span>
                        </a>
                    </li>
                    <li onClick={() => navigate('lms')}>
                        <NavLink to="lms" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <PiBooksThin className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">LMS</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="unieventify/app/dashboard/" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <PiBooksThin className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Unieventify</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="syllabease/dashboard/" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <FaFileLines className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Syllabease</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li onClick={() => setIsCreatePostOpen(true)}>
                        <a href="#" className="flex items-center p-2 text-gray-500 rounded-lg hover:text-white dark:text-white dark:hover:bg-gray-700 group">
                            <FaNotesMedical className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Add Post</span>
                        </a>
                    </li>
                    {highestRankRole && highestRankRole.name === "Admin" && (
                        <li>
                            <NavLink to="/adduser" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                                <FaUserPlus className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                                <span className="flex-1 ms-3 whitespace-nowrap">Add User</span>
                                {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink to="/profile" className={({ isActive }) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <FaUser className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Profile</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li onClick={handleLogout}>
                        <a href="#" className="flex items-center p-2 text-gray-500 hover:text-white rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                            <PiSignOutLight className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 hover:text-white dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Sign Out</span>
                        </a>
                    </li>
                </ul>
            </div>
            <CreatePost 
            isOpen={isCreatePostOpen} 
            onClose={() => setIsCreatePostOpen(false)} 
            />
        </aside>
    )
}
