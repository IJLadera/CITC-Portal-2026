import { RiHomeLine, RiInboxLine } from "react-icons/ri";
import { PiSignOutLight, PiBooksThin } from "react-icons/pi";
import { FaUserPlus } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import { FaNotesMedical } from "react-icons/fa6";
import { Modal, Button, Label, Textarea, FileInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { mutateLoggedIn } from "../../authentication/Login/slice";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { fetchUserProfileApi } from "../../../api";
import { Role } from "../../../pages/Application/pages/unieventify/src/Components/models"

export default function SideBar () {
    const [openModal, setOpenModal] = useState(false)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [role, setRole] = useState<Role>();
    


    // Fetch role when the component mounts
    useEffect(() => {
        fetchRole();
    }, []);

    // Fetch user profile and set the role
    const fetchRole = async () => {
        const userProfile = await fetchUserProfileApi(); // Fetch user profile
        console.log("Fetched user profile:", userProfile);

        if (userProfile.roles && userProfile.roles.length > 0) {
            const highestRankRole = userProfile.roles.reduce((minRole: Role, currentRole: Role) => {
                return currentRole.rank < minRole.rank ? currentRole : minRole;
            }, userProfile.roles[0]);

            console.log("Highest rank role:", highestRankRole);
            setRole(highestRankRole);
        } else {
            console.error("No roles found for user.");
        }
    };

    return (
        <aside id="default-sidebar" className="fixed z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto">
                <div className="w-[100px] flex">
                    <img src={ process.env.PUBLIC_URL + 'inverted-logo.png' } alt="inverted-logo" />
                    <div className="content-center"><p className="text-2xl font-bold text-white">CITC</p></div>
                </div>
                {/* <img src={ process.env.PUBLIC_URL + 'USTP Logo against Dark Background.png' } className="App-logo" alt="logo" /> */}
                <ul className="space-y-2 font-medium">
                    <li>
                        <NavLink to="/"  className={({isActive}) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <RiHomeLine className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="ms-3">Home</span>
                        </NavLink>
                        {/* <a href="#" className="flex items-center p-2 text-white rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                        
                        </a> */}
                    </li>
                    <li>
                        <a href="#" className="flex items-center p-2 text-gray-500 rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                        <RiInboxLine className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                        <span className="flex-1 ms-3 whitespace-nowrap">Inbox</span>
                        <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span>
                        </a>
                    </li>
                    <li onClick={() => navigate('lms')}>
                        <NavLink to="lms" className={({isActive}) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <PiBooksThin className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">LMS</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li onClick={() => navigate('/unieventifys')}>
                        <NavLink to="" className={({isActive}) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <MdEvent className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Unieventify</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                    </li>
                    <li onClick={() => setOpenModal(true)}>
                        <a href="#" className="flex items-center p-2 text-white rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                        <FaNotesMedical className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                        <span className="flex-1 ms-3 whitespace-nowrap">Add Post</span>
                        </a>
                    </li>
                    {role && role.name === "Admin" && (
                        <li onClick={() => navigate('adduser')}>
                        <NavLink to="" className={({isActive}) => (isActive) ? "flex items-center p-2 rounded-lg text-white dark:text-white dark:hover:bg-gray-700 group" : "flex items-center p-2 rounded-lg text-gray-500 hover:text-white dark:text-white dark:hover:bg-gray-700 group"}>
                            <FaUserPlus className="flex-shrink-0 w-5 h-5 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                            <span className="flex-1 ms-3 whitespace-nowrap">Add User</span>
                            {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">3</span> */}
                        </NavLink>
                        </li>
                    )}
                    <li onClick={() => {
                        dispatch(mutateLoggedIn(false))
                        navigate('/login')
                    }}>
                        <a href="#" className="flex items-center p-2 text-white rounded-lg dark:text-white dark:hover:bg-gray-700 group">
                        <PiSignOutLight className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white" />
                        <span className="flex-1 ms-3 whitespace-nowrap">Sign Out</span>
                        </a>
                    </li>
                </ul>
            </div>
            <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
                <Modal.Header />
                <Modal.Body>
                <div className="">
                    <div className="max-w-md">
                        <div className="flex w-full">
                            <Label htmlFor="dropzone-file" className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                <svg
                                    className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                                </div>
                                <FileInput id="dropzone-file" className="hidden" />
                            </Label>
                        </div>
                        <div className="mb-2 block">
                            <Label htmlFor="comment" value="Your message" />
                        </div>
                        <Textarea id="comment" placeholder="Leave a comment..." required rows={4} />
                    </div>                    
                    <div className="flex justify-end gap-4 pt-5">
                    <Button onClick={() => setOpenModal(false)}>
                        Post
                    </Button>
                    </div>
                </div>
                </Modal.Body>
            </Modal>
        </aside>
    )
}