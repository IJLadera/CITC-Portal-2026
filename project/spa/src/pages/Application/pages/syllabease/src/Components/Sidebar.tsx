import { NavLink, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { MdDashboard, MdSchool } from "react-icons/md";

export default function SyllabaseSidebar() {
    const navigate = useNavigate();

    return (
        <aside className="w-48 bg-gray-50 border-r border-gray-200 p-3 flex flex-col h-screen overflow-y-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full text-sm"
                title="Back to CITC Portal"
            >
                <IoArrowBack className="w-4 h-4" />
                <span className="font-medium">Back</span>
            </button>

            {/* Syllabease Title */}
            <h2 className="text-base font-bold text-gray-900 mb-4 px-2">Syllabease</h2>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
                <NavLink
                    to="dashboard/"
                    className={({ isActive }) =>
                        isActive
                            ? "flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm"
                            : "flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    }
                >
                    <MdDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="syllabi/"
                    className={({ isActive }) =>
                        isActive
                            ? "flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm"
                            : "flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    }
                >
                    <MdSchool className="w-4 h-4" />
                    <span>Syllabi</span>
                </NavLink>
            </nav>
        </aside>
    );
}
