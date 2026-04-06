
import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaHistory, FaUsers, FaChevronDown } from "react-icons/fa";
import { MdModeComment, MdEdit, MdExitToApp } from "react-icons/md";
import { HiDocumentDuplicate } from "react-icons/hi2";
import { TbVersionsFilled } from "react-icons/tb";
import api from "../api";
import type { BayanihanGroup } from "../types/bayanihan";
import type { SyllabusVersions } from "../types/syllabus";
import { createEmptyBayanihanGroup } from "../utils/factories";
import { AuthContext } from "../context/AuthContext";
import { UserCircleIcon } from "lucide-react";

export default function AUSyllabusHeader() {
  const { syllabusId } = useParams<{ syllabusId: string }>(); 
  const { user, logout } = useContext(AuthContext)!;

  const [bayanihanGroup, setBayanihanGroup] = useState<BayanihanGroup>(createEmptyBayanihanGroup());
  const [syllabusVersions, setSyllabusVersions] = useState<SyllabusVersions[]>([]);

  const [openDropdown, setOpenDropdown] = useState(null); 

  const navigate = useNavigate();

  const activeRole = localStorage.getItem("activeRole") || "";
  const role = activeRole.toUpperCase(); 

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const fullName = user
    ? `${user.prefix || ""} ${user.first_name || ""} ${user.last_name || ""} ${user.suffix || ""}`.trim()
    : "Unknown User";

  const email = user?.email || "unknown@example.com";
  
  // Fetch Bayanihan Group of the Syllabus
  useEffect(() => {
    if (!syllabusId) return;
    
    api.get(`/bayanihan/groups/by-syllabus/${syllabusId}/`)
      .then((res) => {
        setBayanihanGroup(res.data); 
      })
      .catch((err) => console.error(err));
  }, [syllabusId]);
 
  // Fetch Versions of the Syllabus
  useEffect(() => {
    if (!syllabusId) return;
 
    api.get(`/syllabi/${syllabusId}/syllabus-versions/?role=${role}`)
      .then((res) => {
        setSyllabusVersions(res.data); 
      })
      .catch((err) => console.error(err));
  }, [syllabusId]);

  const toggleDropdown = (menu: any) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const formatRole = (role: string) => {
    if (!role) return "";
    return role
      .split("_") 
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize each word
      .join(" "); 
  };  

  return (
    <nav className="fixed top-0 w-full bg-blue-600 shadow-lg z-50">
      <div className="flex items-center px-6 py-3">
        {/* Logo */}
        <img
          src="/assets/Sample/syllabease4.png"
          alt="SyllabEase"
          className="w-40"
        />

        {/* Left Label */}
        <div className="relative group ml-4">
          <button
            onClick={() => navigate(`/${activeRole}/syllabus`)}
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-[#135ddc] hover:bg-[#235cc5] transition transform hover:scale-105 text-white"
          >
            <UserCircleIcon className="w-5 h-5 text-white" />
            <span className="text-sm font-medium">{formatRole(activeRole)}</span>
          </button>

          {/* Tooltip */}
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
            Role Options
          </span>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-4">  
          {/* Versions Dropdown */} 
          <div className="relative group">
            <button
              className="p-1 hover:bg-blue-700 rounded-full text-white transition-all duration-200 ease-in-out"
              onClick={() => toggleDropdown('versions')}
            >
              <TbVersionsFilled size={25} />
            </button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
              Syllabus Versions
            </span>
            
            {openDropdown === "versions" && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-3 text-sm">
                <div className="font-semibold text-gray-700 border-b pb-2 mb-2">
                  Syllabus Versions
                </div>

                {syllabusVersions.length > 0 ? (
                  <div className="space-y-2">
                    {syllabusVersions.map((version) => {
                      // pick correct timestamp
                      let rawDate =
                        version.status === "Returned by Chair"
                          ? version.chair_rejected_at
                          : version.status === "Returned by Dean"
                          ? version.dean_rejected_at
                          : version.status === "Approved by Dean"
                          ? version.dean_approved_at
                          : "";

                      // format
                      let formattedDate = rawDate
                        ? new Date(rawDate).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "";

                      // check if this version matches the current syllabusId
                      const isCurrent = version.id === parseInt(syllabusId || "0");

                      return (
                        <div 
                          onClick={() => navigate(`/auditor/syllabus/${version.id}/view`)}
                          key={version.id}
                          className={`flex items-center justify-between p-2 rounded-md transition cursor-pointer ${
                            isCurrent ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-blue-50"
                          }`}
                        >
                          {/* Left side: version + date */}
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              Version {version.version}
                            </span>
                            <span className="text-xs text-gray-500">{formattedDate}</span>
                          </div>

                          {/* Right side: status */}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              version.status === "Approved by Dean" 
                                ? "bg-green-200 text-green-700 font-bold"
                                : version.status === "Approved by Chair"
                                ? "bg-green-100 text-green-500 font-semibold"
                                : version.status.includes("Returned")
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {version.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 italic p-2">No versions available</div>
                )}
              </div>
            )}
          </div> 

          {/* Bayanihan Team Dropdown */}
          <div className="relative group">
            <button
              className="p-1 hover:bg-blue-700 rounded-full text-white transition-all duration-200 ease-in-out"
              onClick={() => toggleDropdown('team')}
            >
              <FaUsers size={25} />
            </button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
              Bayanihan Team
            </span>

            {openDropdown === "team" && (
              <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-lg p-3">
                <div className="font-semibold">
                  {bayanihanGroup.course.course_code} - {bayanihanGroup.course.course_title}
                </div>
                <div className="text-gray-500 text-sm">
                  {bayanihanGroup.course.course_semester.toLowerCase()} Semester - SY {bayanihanGroup.school_year}
                </div>

                <div className="mt-2 text-xs text-gray-600">People with access</div>

                {/* Leaders */}
                {bayanihanGroup.bayanihan_members
                  .filter((m) => m.role === "LEADER")
                  .map((m) => (
                    <div
                      key={m.id}
                      className="mt-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          {m.user.first_name[0]}
                          {m.user.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {m.user.first_name} {m.user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{m.user.email}</div>
                        </div>
                      </div>
                      <span className="italic text-gray-500 text-xs">Leader</span>
                    </div>
                  ))}

              {/* Teachers */}
              {bayanihanGroup.bayanihan_members
                .filter((m) => m.role === "TEACHER")
                .map((m) => (
                  <div
                    key={m.id}
                    className="mt-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        {m.user.first_name[0]}
                        {m.user.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {m.user.first_name} {m.user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{m.user.email}</div>
                      </div>
                    </div>
                    <span className="italic text-gray-500 text-xs">Teacher</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              className="bg-yellow-400 hover:bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
              onClick={() => toggleDropdown("profile")}
              title="Profile"
            >
              {initials}
            </button>
            
            {openDropdown === "profile" && (
              <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <img
                    src="/assets/Sample/syllabease.png"
                    alt="SyllabEase"
                    className="w-28"
                  />
                  <button
                    onClick={logout}
                    className="flex items-center text-yellow-600 text-sm"
                  >
                    <MdExitToApp className="mr-1" /> <span>Sign out</span>
                  </button>
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl">
                    {initials}
                  </div>
                  <div>
                    <div className="font-semibold">{fullName}</div>
                    <div className="text-sm text-gray-600">{email}</div>
                    <a href="/profile" className="text-blue-600 underline text-sm">
                      My Profile
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
