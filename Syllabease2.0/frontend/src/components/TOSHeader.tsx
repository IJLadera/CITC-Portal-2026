
import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaHistory, FaUsers, FaChevronDown } from "react-icons/fa";
import { MdModeComment, MdEdit, MdExitToApp } from "react-icons/md"; 
import type { BayanihanGroup } from "../types/bayanihan";
import type { TOSVersions } from "../types/tos";
import { createEmptyBayanihanGroup } from "../utils/factories";
import { AuthContext } from "../context/AuthContext"; 
import { useTOSMode } from "../context/TOSModeContext";
import { MdFileDownload } from "react-icons/md";
import api from "../api";
import { TbVersionsFilled } from "react-icons/tb";

export default function TOSHeader() {
  const { tosId } = useParams<{ tosId: string }>();
  const { user, logout } = useContext(AuthContext)!; 
  const activeRole = localStorage.getItem("activeRole") || "";
  const role = activeRole.toUpperCase(); 

  const { isCommentMode, setIsCommentMode } = useTOSMode();
  const [isDownloading, setIsDownloading] = useState(false);  
  const [bayanihanGroup, setBayanihanGroup] = useState<BayanihanGroup>(createEmptyBayanihanGroup());
  const [TOSVersions, setTOSVersions] = useState<TOSVersions[]>([]); 
  const [TOSStatus, setTOSStatus] = useState<string>(""); // 👈 new state
  const [openDropdown, setOpenDropdown] = useState(null); 

  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const fullName = user
    ? `${user.prefix || ""} ${user.first_name || ""} ${user.last_name || ""} ${user.suffix || ""}`.trim()
    : "Unknown User";

  const email = user?.email || "unknown@example.com";

  // Fetch TOS details (to check its status)
  useEffect(() => {
    if (!tosId) return; 
    api.get(`/tos/${tosId}/`)
      .then((res) => {
        setTOSStatus(res.data.status);
      })
      .catch((err) => console.error("Failed to fetch TOS status:", err));
  }, [tosId]);
  
  // Fetch Bayanihan Group of the TOS
  useEffect(() => {
    if (!tosId) return;
    
    api.get(`/bayanihan/groups/by-tos/${tosId}/`)
      .then((res) => {
        setBayanihanGroup(res.data); 
      })
      .catch((err) => console.error(err));
  }, [tosId]);
 
  // Fetch Versions of the TOS
  useEffect(() => {
    if (!tosId) return;
 
    api.get(`/tos/${tosId}/tos-versions/?role=${role}`)
      .then((res) => {
        setTOSVersions(res.data); 
      })
      .catch((err) => console.error(err));
  }, [tosId]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (!event.target.closest(".relative")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDownloadDocx = async () => {
    if (!tosId) return;
    setIsDownloading(true);

    try {
      const response = await api.get(`/tos/${tosId}/export_docx/`);

      const docxUrl = response.data.docx_url;
      if (!docxUrl) throw new Error("No DOCX URL returned.");

      // Download from Spaces directly
      const link = document.createElement("a");
      link.href = docxUrl;
      link.download = ""; // Let Spaces filename be used
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("Failed to download DOCX", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!tosId) return;
    setIsDownloading(true);

    try {
      const response = await api.get(`/tos/${tosId}/export_pdf/`);

      const pdfUrl = response.data.pdf_url;
      if (!pdfUrl) throw new Error("No PDF URL returned.");

      // Download from Spaces directly
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = ""; // Let Spaces filename be used
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("Failed to download PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

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

  const canComment = ["Draft", "Requires Revision"].includes(TOSStatus);

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
        <div onClick={() => navigate(`/${activeRole}/tos`)} className="ml-4 text-white text-sm border px-2 py-1 rounded-full cursor-pointer">
          {formatRole(activeRole)}
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-4"> 
          {/* ✅ Download PDF (only if approved) */}
          {TOSStatus === "Approved by Chair" && !["AUDITOR"].includes(role) && (
            <div className="relative group">
              <button
                onClick={() => !isDownloading && toggleDropdown("download")}
                disabled={isDownloading}
                className={`p-1 rounded-full text-white transition-all duration-200 ease-in-out ${
                  isDownloading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                {isDownloading ? (
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : (
                  <MdFileDownload size={25} />
                )}
              </button>

              {!isDownloading && (
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
                  Download PDF
                </span>
              )}

              {/* Dropdown */}
              {openDropdown === "download" && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg p-2 text-sm z-50">
                  <div className="font-semibold text-gray-700 border-b pb-2 mb-2">
                    Export TOS
                  </div>

                  {/* PDF */}
                  <button
                    disabled={isDownloading}
                    onClick={async () => {
                      setOpenDropdown(null);
                      await handleDownloadPdf();
                    }}
                    className={`px-3 py-2 w-full text-left rounded-md transition ${
                      isDownloading
                        ? "bg-gray-200 cursor-not-allowed text-gray-500"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    Export to PDF
                  </button>

                  {/* DOCX */}
                  <button
                    disabled={isDownloading}
                    onClick={async () => {
                      setOpenDropdown(null);
                      await handleDownloadDocx();
                    }}
                    className={`px-3 py-2 w-full text-left rounded-md transition ${
                      isDownloading
                        ? "bg-gray-200 cursor-not-allowed text-gray-500"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    Export to DOCX
                  </button>
                </div>
              )}
            </div>
          )}  

          {/* Audit Log History Button */} 
          {!["AUDITOR"].includes(role) && ( 
            <div className="relative group">
              <button onClick={() => navigate("view/audit-logs")} className="p-1 hover:bg-blue-700 rounded-full text-white">
                <FaHistory size={21} />
              </button>
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
                TOS Audit Logs
              </span>
            </div> 
          )}

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
                  TOS Versions
                </div>

                {TOSVersions.length > 0 ? (
                  <div className="space-y-2">
                    {TOSVersions.map((version) => {
                      // pick correct timestamp
                      let rawDate =
                        version.status === "Returned by Chair"
                          ? version.chair_returned_at 
                          : version.status === "Approved by Dean"
                          ? version.chair_approved_at
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

                      // check if this version matches the current tosId
                      const isCurrent = version.id === parseInt(tosId || "0");

                      return (
                        <div
                          onClick={() => navigate(`/${activeRole}/tos/${version.id}/view`)}
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
                              version.status === "Approved by Chair"
                                ? "bg-green-200 text-green-700 font-semibold"
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

          {/* ✏️ Comment / Edit Mode Toggle */}
          {["BAYANIHAN_LEADER", "BAYANIHAN_TEACHER", "ADMIN"].includes(role) && canComment &&  ( 
            <div className="relative">
              <button
                id="modeButton"
                className={`px-3 py-1 rounded-full flex items-center gap-2 text-white transition-all duration-200 ${
                  isCommentMode
                    ? "bg-purple-600 hover:bg-purple-500"
                    : "bg-blue-500 hover:bg-blue-400"
                }`}
                onClick={() => toggleDropdown("mode")}
              >
                {isCommentMode ? (
                  <>
                    <MdModeComment />
                    <span className="text-sm">Comment Mode</span>
                  </>
                ) : (
                  <>
                    <MdEdit />
                    <span className="text-sm">
                      {role === "BAYANIHAN_TEACHER" ? "View Mode" : "Editing Mode"}
                    </span>
                  </>
                )}
                <FaChevronDown size={12} />
              </button>

              {openDropdown === "mode" && (
                <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md text-sm z-50">
                  <button
                    onClick={() => {
                      setIsCommentMode(false);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 w-full flex items-center gap-2 rounded-md transition ${
                      !isCommentMode ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-gray-200"
                    }`}
                  >
                    <MdEdit size={18} /> {role === "BAYANIHAN_TEACHER" ? "View Mode" : "Editing Mode"}
                  </button>
                  <button
                    onClick={() => {
                      setIsCommentMode(true);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2 w-full flex items-center gap-2 rounded-md transition ${
                      isCommentMode ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-gray-200"
                    }`}
                  >
                    <MdModeComment size={18} /> Comment Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bayanihan Team Dropdown */}
          <div className="relative group">
            <button
              className="p-1 hover:bg-blue-700 rounded-full text-white"
              onClick={() => toggleDropdown("team")}
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
