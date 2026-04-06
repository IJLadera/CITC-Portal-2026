import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Deadline {
  id: number;
  school_year: string;
  semester: string;
  syll_deadline: string | null;
  syll_status?: string;
  tos_midterm_deadline: string | null;
  tos_midterm_status?: string;
  tos_final_deadline: string | null;
  tos_final_status?: string;
  created_at: string;
}

interface Notification {
  id: string | number;
  recipient?: number | { id: number; email: string };
  target_role?: string;
  message: string;
  domain: string;
  type?: string;
  link?: string;
  created_at: string;
  is_read?: boolean;
} 

export default function MainHeader() {
  const activeRole = localStorage.getItem("activeRole")?.toUpperCase();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestDeadline, setLatestDeadline] = useState<Deadline | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Memo" | "Syllabus" | "TOS" | "Deadline" | "Group">("All");
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, logout } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const fullName = user
    ? `${user.prefix || ""} ${user.first_name || ""} ${user.last_name || ""}, ${user.suffix || ""}`.trim()
    : "Unknown User";

  const email = user?.email || "unknown@example.com";  

  const allUserNotifs: Notification[] = [
    ...notifications, 
    // The conditional block is wrapped with .filter(Boolean) and asserted as Notification[] 
    ...(latestDeadline
      ? ([
          latestDeadline.syll_status === "ACTIVE" && latestDeadline.syll_deadline
            ? {
                id: `deadline-syllabus-${latestDeadline.id}`,
                message: `Syllabus deadline: ${new Date(latestDeadline.syll_deadline).toLocaleString()}`,
                created_at: latestDeadline.created_at,
                domain: "deadline",
                type: "deadline_reminder",
                link: "/syllabus",
              }
            : null,
          latestDeadline.tos_midterm_status === "ACTIVE" && latestDeadline.tos_midterm_deadline
            ? {
                id: `deadline-tos-midterm-${latestDeadline.id}`,
                message: `Midterm TOS deadline: ${new Date(latestDeadline.tos_midterm_deadline).toLocaleString()}`,
                created_at: latestDeadline.created_at,
                domain: "deadline",
                type: "deadline_reminder",
                link: "/tos",
              }
            : null,
          latestDeadline.tos_final_status === "ACTIVE" && latestDeadline.tos_final_deadline
            ? {
                id: `deadline-tos-final-${latestDeadline.id}`,
                message: `Final TOS deadline: ${new Date(latestDeadline.tos_final_deadline).toLocaleString()}`,
                created_at: latestDeadline.created_at,
                domain: "deadline",
                type: "deadline_reminder",
                link: "/tos",
              }
            : null,
        ].filter(Boolean) as Notification[])
      : []),
  ];

  // ✅ Filter logic
  const filteredNotifs: Notification[] =
    selectedFilter === "All"
      ? allUserNotifs
      : allUserNotifs.filter((n) => n.domain.toUpperCase() === selectedFilter.toUpperCase());
  
  const signatureToastShown = useRef(false);

  // Signature Warning toastify popup reminder
  useEffect(() => {
    const allowedRoles = ["AUDITOR", "ADMIN"]; 
    if (allowedRoles.includes(activeRole ?? "")) return; 

    if (signatureToastShown.current) return;

    const fetchUserSignature = async () => {
      try {
        const res = await api.get(`/users/${user?.id}/`);
        const currentUser = res.data;

        localStorage.setItem("userSignature", currentUser.signature ? "true" : "false");

        if (!currentUser.signature && !toast.isActive("missing-signature-toast")) {
          // PREVENT duplicate before toast appears
          signatureToastShown.current = true;

          toast.warn(
            `Missing Signature\n\nYou have not uploaded your signature yet.\nPlease update your profile.`,
            {
              toastId: "missing-signature-toast",
              position: "top-right",
              autoClose: 5000,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: false,
              theme: "light",
              style: {
                background: "#FDFDFEFF",
                color: "#191A1EFF",
                fontWeight: "500",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
                padding: "18px 24px",
                whiteSpace: "pre-line",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: "11.5px",
                lineHeight: "1.6",
              },
              onClick: () => navigate("/profile"),
            }
          );
        }
      } catch (err) {
        console.error("Failed to fetch user signature:", err);
      }
    };

    if (user?.id) fetchUserSignature();
  }, []); 

  // Deadline toastify popup reminder   
  useEffect(() => { 
    const allowedRoles = ["BAYANIHAN_LEADER", "BAYANIHAN_TEACHER", "ADMIN"]; 
    if (!allowedRoles.includes(activeRole ?? "")) return;

    let cancelled = false;

    const fetchDeadline = async () => {
      try {
        const res = await api.get("/deadlines/latest/");
        const deadlines: Deadline[] = res.data;

        const activeDeadlines = Array.isArray(deadlines)
          ? deadlines.filter(
              (d) =>
                d.syll_status === "ACTIVE" ||
                d.tos_midterm_status === "ACTIVE" ||
                d.tos_final_status === "ACTIVE"
            )
          : [];

        if (activeDeadlines.length === 0 || cancelled) return;

        const latest = activeDeadlines[0];
        setLatestDeadline(latest); 

        // 🔹 Helper: create toast
        const showDeadlineToast = (id: string, title: string, label: string, date: string) => {
          if (!toast.isActive(id)) { 
            const formattedDate = new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            toast.info(
              <div style={{ lineHeight: 1.6 }}>
                {/* Label in slightly smaller, semi-bold */}
                <div className="text-[14px] font-bold">
                  {title.toUpperCase()}
                </div>
                <div className="text-[14px] font-semibold">
                  {label}
                </div> 
                {/* Date highlighted and bolded */}
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A73E8" }}>
                  {formattedDate}
                </div>
              </div>, 
              {
                toastId: id,
                position: "top-right",
                autoClose: 6000,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false,
                theme: "light",
                style: {
                  background: "#FDFDFEFF",
                  color: "#191A1EFF",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
                  padding: "20px 26px",
                  whiteSpace: "pre-line",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.7",
              },
            }); 
          }
        };

        // 🔹 Syllabus deadline toast
        if (latest.syll_status === "ACTIVE" && latest.syll_deadline) {
          showDeadlineToast(
            "deadline-syllabus",
            "Syllabus Deadline",
            `${latest.semester.toLowerCase()} Semester (${latest.school_year})`,
            latest.syll_deadline
          );
        }

        // 🔹 TOS Midterm deadline toast
        if (latest.tos_midterm_status === "ACTIVE" && latest.tos_midterm_deadline) {
          showDeadlineToast(
            "deadline-tos-midterm",
            "TOS Midterms Deadline",
            `${latest.semester.toLowerCase()} Semester (${latest.school_year})`,
            latest.tos_midterm_deadline
          );
        }

        // 🔹 TOS Final deadline toast
        if (latest.tos_final_status === "ACTIVE" && latest.tos_final_deadline) {
          showDeadlineToast(
            "deadline-tos-final",
            "TOS Finals Deadline",
            `${latest.semester.toLowerCase()} Semester (${latest.school_year})`,
            latest.tos_final_deadline
          );
        }

      } catch (error) {
        console.error("Failed to fetch deadlines:", error);
      }
    };

    fetchDeadline();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch notification unread count periodically
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get<{ unread_count: number }>("/notifications/count/");
        setUnreadCount(res.data.unread_count);
      } catch (error) {
        console.error("Unread fetch error:", error);
        setUnreadCount(0);
      }
    };

    fetchUnread(); 
  }, []);

  // Fetch all notifications
  useEffect(() => {
    if (!user) return;

    const fetchAllNotifications = async () => {
      try {
        const res = await api.get<Notification[]>("/notifications/");
        const data = res.data; 

        const filteredNotifs =
          activeRole?.toUpperCase() === "ADMIN"
            ? data // no filter for ADMIN
            : data.filter(
                (n) =>
                  !n.target_role ||
                  n.target_role.toUpperCase() === activeRole?.toUpperCase()
              );

        setNotifications(filteredNotifs);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchAllNotifications();
  }, []);

  // Count Total Notifications
  const totalNotifs =
    notifications.length + 
    (latestDeadline ? 1 : 0);

  //  When Notification bell is clicked
  const handleNotifClick = () => {
    setNotifOpen(!notifOpen); // just toggle dropdown
  };

  const markNotificationRead = async (notif: Notification) => {
    if (notif.is_read) return;

    try {
      await api.post(`/notifications/${notif.id}/mark_read/`);

      // Update notification list
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );

      // Refresh unread count from backend
      const res = await api.get("/notifications/count/");
      setUnreadCount(res.data.unread_count);
 
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleNotificationClick = (n: Notification) => { 
    markNotificationRead(n);

    // 2. Handle navigation based on notification domain and target role
    if (n.link && n.target_role) {
      if (n.domain === "memo") {
        // Use full link as-is for memos, prefixed by active role
        navigate(`/${activeRole}/${n.link}`);
      } else {
        if (n.target_role) {
          // For non-memo notifications with a target role:
          // a) Correctly set the new active role in local storage
          localStorage.setItem("activeRole", n.target_role.toUpperCase());
          // b) Navigate directly using the link (assuming it's a full path/route)
          navigate(n.link);
        } else { 
          // Fallback: Navigate with existing active role if no target_role
          navigate(`/${activeRole}/${n.link}`);
        }
      }
    }
 
    setNotifOpen(false);
  };

  return ( 
    <nav className="fixed top-0 left-0 right-0 bg-white shadow px-6 py-2 flex items-center justify-between z-50"> 
      <div className="flex items-center ml-5">
        <img src="/assets/Sample/syllabease.png" alt="SyllabEase" className="h-8" />
      </div> 

      {/* <ToastContainer
        position="top-right"
        autoClose={4500}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme="light"
        toastStyle={{
          background: "#FDFDFEFF",
          color: "#191A1EFF",
          fontWeight: 600,
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
          padding: "20px 26px",
          whiteSpace: "pre-line",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          fontSize: "16px",
          lineHeight: "1.7",
        }}
      /> */}

      <div className="flex items-center space-x-4">
        {/* 🔔 Notification Bell */}
        {activeRole != "AUDITOR" && ( 
          <div className="relative">
            <div className="relative group ml-4">
              <button
                onClick={handleNotifClick}
                className="relative p-2 rounded-full hover:bg-gray-200"
              >
                <Bell className="w-6 h-6 text-blue-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Tooltip */}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white text-blue-700 border border-blue-700 text-xs px-2 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md">
                Notification
              </span>
            </div>

            {/* 🔹 Notifications Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-115 max-h-112 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-2xl dark:bg-gray-900 dark:border-gray-700 transition-all">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium bg-red-600 text-white rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  {["All", "Memo", "Syllabus", "TOS", "Deadline", "Group"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter as typeof selectedFilter)}
                      className={`cursor-pointer px-3 py-1 text-xs rounded-full font-medium transition 
                        ${selectedFilter === filter 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifs.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No notifications found.
                    </div>
                  ) : (
                    filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer select-none transition 
                          ${n.is_read ? "bg-white dark:bg-gray-900" : "bg-gray-100 dark:bg-gray-800"}
                          hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg`}
                      >
                        {/* Icon */}
                        <div className="shrink-0 mt-1">
                          {n.is_read ? (
                            <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                          )}
                        </div>

                        {/* Notification Text */}
                        <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-medium">{n.message}</p> 
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>

                        {/* Unread Badge */}
                        {!n.is_read && (
                          <div className="ml-2 shrink-0 mt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {totalNotifs === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 👤 Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
          >
            {initials}
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-lg">{fullName}</p>
                  <p className="text-sm text-gray-600">{email}</p>
                  <button onClick={() => navigate(`/profile`)} className="text-blue-600 underline">
                    My Profile
                  </button>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 flex items-center gap-2 text-red-600 hover:underline"
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav> 
  );
}