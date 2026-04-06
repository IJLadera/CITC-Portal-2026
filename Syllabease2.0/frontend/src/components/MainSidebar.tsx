import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardList,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaFileAlt,
  FaBuilding,
  FaUserCog,
  FaGraduationCap,
  FaLayerGroup,
  FaUniversity,
  FaUserFriends,
  FaUserShield,
} from "react-icons/fa";
import { HiOutlineUserGroup } from "react-icons/hi";
import { MdOutlineSchool, MdOutlineAssignment } from "react-icons/md";


export default function MainSidebar() {
  const location = useLocation();
  const activeRole = localStorage.getItem("activeRole") || "";

  const formatRole = (role: string) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  /** ✅ Updated Icon Map */
  const iconMap: Record<string, React.ReactNode> = {
    Syllabus: <FaBookOpen className="w-5 h-5" />,
    TOS: <FaBookOpen className="w-5 h-5" />,
    // TOS: <FaClipboardList className="w-5 h-5" />,
    Bayanihan: <HiOutlineUserGroup className="w-5 h-5" />,
    "Bayanihan Team": <FaUsers className="w-5 h-5" />,
    Deadline: <FaCalendarAlt className="w-5 h-5" />,
    "Syllabus Reports": <FaChartBar className="w-5 h-5" />,
    "TOS Reports": <FaChartBar className="w-5 h-5" />,
    Memo: <FaFileAlt className="w-5 h-5" />,
    Department: <FaBuilding className="w-5 h-5" />,
    Chairperson: <FaUserCog className="w-5 h-5" />,
    College: <FaUniversity className="w-5 h-5" />,
    "Program Outcome": <MdOutlineSchool className="w-5 h-5" />,
    Curriculum: <FaLayerGroup className="w-5 h-5" />,
    Course: <MdOutlineAssignment className="w-5 h-5" />,
    "Manage Users": <FaUserShield className="w-5 h-5" />,
    Programs: <FaGraduationCap className="w-5 h-5" />,
  };

  const roleSpecific: Record<string, { label: string; path: string }[]> = {
    admin: [
      { label: "Manage Users", path: "/admin/users" },
      { label: "Syllabus", path: "/admin/syllabus" },
      { label: "TOS", path: "/admin/tos" },
      { label: "Syllabus Reports", path: "/admin/syllabus-reports" },
      { label: "TOS Reports", path: "/admin/tos-reports" },
      { label: "Bayanihan", path: "/admin/bayanihan" },
      { label: "Deadline", path: "/admin/deadline" },
      { label: "Memo", path: "/admin/memo" },
      { label: "Course", path: "/admin/course" },
      { label: "Curriculum", path: "/admin/curriculum" },
      { label: "Department", path: "/admin/department" },
      { label: "College", path: "/admin/college" },
    ],
    auditor: [
      { label: "Syllabus", path: "/auditor/syllabus" },
      { label: "TOS", path: "/auditor/tos" },
    ],
    dean: [
      { label: "Syllabus", path: "/dean/syllabus" },
      { label: "Syllabus Reports", path: "/dean/syllabus-reports" },
      { label: "TOS Reports", path: "/admin/tos-reports" },
      { label: "Deadline", path: "/dean/deadline" },
      { label: "Memo", path: "/dean/memo" },
      { label: "Department", path: "/dean/department" },
    ],
    chairperson: [ 
      { label: "Syllabus", path: "/chairperson/syllabus" },
      { label: "TOS", path: "/chairperson/tos" },
      { label: "Syllabus Reports", path: "/chairperson/syllabus-reports" },
      { label: "TOS Reports", path: "/chairperson/tos-reports" },
      { label: "Bayanihan", path: "/chairperson/bayanihan" },
      { label: "Memo", path: "/chairperson/memo" },
      { label: "Course", path: "/chairperson/course" },
      { label: "Programs", path: "/chairperson/programs" },
      { label: "Curriculum", path: "/chairperson/curriculum" },
    ],
    bayanihan_leader: [
      { label: "Bayanihan Team", path: "/bayanihan_leader/team" },
      { label: "Syllabus", path: "/bayanihan_leader/syllabus" },
      { label: "TOS", path: "/bayanihan_leader/tos" },
      { label: "Memo", path: "/bayanihan_leader/memo" },
    ],
    bayanihan_teacher: [
      { label: "Bayanihan Team", path: "/bayanihan_teacher/team" },
      { label: "Syllabus", path: "/bayanihan_teacher/syllabus" },
      { label: "TOS", path: "/bayanihan_teacher/tos" },
      { label: "Memo", path: "/bayanihan_teacher/memo" },
    ],
  };

  const links = [...(roleSpecific[activeRole.toLowerCase()] || [])];

  return (
    <aside className="w-[248px] bg-[#2468d2] text-white p-4 fixed left-0 h-screen shadow-lg overflow-y-auto overflow-x-hidden z-49">
      {/* Role Pill */}
      <div className="flex justify-center mb-4 mt-[60px] relative group">
        <Link
          to="/choose-role"
          className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-[#1e57b8] hover:bg-[#1c4fae] transition transform hover:scale-105"
        >
          <FaUserCog className="w-5 h-5 text-white" />
          <span className="text-sm font-medium">{formatRole(activeRole)}</span>
        </Link>
        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
          Role Options
        </span>
      </div>

      {/* Nav */}
      <nav className="space-y-1 overflow-hidden">
        {links.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-[15px] ${
                isActive
                  ? "bg-white text-[#2468d2] font-semibold shadow-inner border-l-4 border-yellow-400 scale-[1.02]"
                  : "hover:bg-[#1c4fae] hover:scale-105"
              }`}
            >
              <div className={`flex-shrink-0 ${isActive ? "text-[#2468d2]" : "text-white"}`}>
                {iconMap[item.label] || <FaUserCog className="w-5 h-5" />}
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
