import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, AlertCircle, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TOS } from "@/types/tos";
import type { BayanihanGroup, User } from "@/types/bayanihan"; 
import type { College, Program } from "@/types/academic"; 
import { FaChevronDown } from "react-icons/fa";  
import api from "@/api";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "flowbite-react";

type Report = {
  id: number;
  bayanihan_group: BayanihanGroup;
  tos: TOS;
  version: number;
  chair_submitted_at: string;
  chair_returned_at: string; 
  chair_approved_at: string;
  created_at: string;
  updated_at: string;
};

type Deadline = {
  id: number; 
  user: User;
  syll_deadline: string;
  tos_midterm_deadline: string;
  tos_final_deadline: string;

  syll_status: string;
  tos_midterm_status: string;
  tos_final_status: string;

  school_year: string;
  semester: string;
  college: College; 

  created_at: string;
  updated_at: string;
}

type VersionsResponse = {
  all_versions?: Report[]; // what retrieve() returns
};

/* ✅ Helper: format date as "HH:MM AM/PM, Month Day, Year" */
function formatDate(dateString?: string): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  // Format with comma between time and date
  const formatted = date.toLocaleString("en-PH", options);
  // Some browsers put the comma automatically, others don’t — normalize it:
  return formatted.replace(", ", ", ");
}

// Helper: check if past or near deadline
function getDeadlineStatus(report: Report, deadlines: Deadline[]): "on-time" | "near" | "overdue" {
  const collegeId = report.tos.program.department.college.id;
  const schoolYear = report.bayanihan_group.school_year;
  const semester = report.bayanihan_group.course.course_semester;

  // Match deadline by school_year + semester
  const matched = deadlines.find(
    (d) => 
    d.college.id === collegeId && 
    d.school_year === schoolYear && 
    d.semester.toLowerCase() === semester.toLowerCase() 
  );

  if (!matched) return "on-time"; // no issue if missing deadline

  const term = report.tos.term?.toLowerCase(); // "midterm" or "finals"

  let deadlineDate: Date | null = null;

  // 🔥 Decide which deadline to use
  if (term === "midterm" && matched.tos_midterm_status === "ACTIVE") {
    deadlineDate = new Date(matched.tos_midterm_deadline);
  } else if (term === "finals" && matched.tos_final_status === "ACTIVE") {
    deadlineDate = new Date(matched.tos_final_deadline);
  } else {
    // No active deadline for this term
    return "on-time";
  }

  const now = new Date();
  const submittedAt = report.chair_submitted_at
    ? new Date(report.chair_submitted_at)
    : null;

  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ---------- OVERDUE ----------
  if (submittedAt && submittedAt > deadlineDate) return "overdue";
  if (!submittedAt && now > deadlineDate) return "overdue";

  // ---------- ON-TIME (submitted within 5 days rule) ----------
  if (submittedAt) {
    const submitToDeadline = Math.ceil(
      (deadlineDate.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // NEW RULE
    if (submitToDeadline <= 5 && submitToDeadline >= 0) {
      return "on-time"; // 💡 no longer "near"
    }
  }

  // ---------- NEAR DEADLINE ONLY FOR UNSUBMITTED ----------
  if (!submittedAt && daysUntilDeadline <= 5 && daysUntilDeadline >= 0) {
    return "near";
  }

  return "on-time";
}

function getRowClass(status: "on-time" | "near" | "overdue"): string {
  switch (status) {
    case "overdue":
      return "bg-red-200 hover:bg-red-300";
    case "near":
      return "bg-yellow-100 hover:bg-yellow-200";
    default:
      return "hover:bg-gray-100";
  }
}

function getMatchedDeadline(report: Report, deadlines: Deadline[]): string | null {
  const collegeId = report.tos.program.department.college.id;
  const schoolYear = report.bayanihan_group.school_year;
  const semester = report.bayanihan_group.course.course_semester;

  // Find matching deadline entry
  const matched = deadlines.find(
    (d) =>
      d.college.id === collegeId &&
      d.school_year === schoolYear &&
      d.semester.toLowerCase() === semester.toLowerCase()
  );

  if (!matched) return null;

  const term = report.tos.term?.toLowerCase();

  // return the correct term deadline
  if (term === "midterm" && matched.tos_midterm_status === "ACTIVE") {
    return matched.tos_midterm_deadline;
  }
  if (term === "finals" && matched.tos_final_status === "ACTIVE") {
    return matched.tos_final_deadline;
  }

  return null;
}

export default function TOSReportsList() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();

  const [reports, setReports] = useState<Report[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // versions modal state
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedReportVersions, setSelectedReportVersions] = useState<Report[] | null>(null);
  const [selectedReportTitle, setSelectedReportTitle] = useState<string>("");

  // filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterSemester, setFilterSemester] = useState<string>("All");
  const [filterTerm, setFilterTerm] = useState<string>("All");
  const [filterProgram, setFilterProgram] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openSem, setOpenSem] = useState(false);
  const [openTerm, setOpenTerm] = useState(false);
  const [openProg, setOpenProg] = useState(false);
   
  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          role,
          page: currentPage,
          page_size: 10,
        };
        if (searchTerm.trim()) params.course = searchTerm.trim();
        if (filterYear !== "All") params.school_year = filterYear; 
        if (filterSemester !== "All") params.course_semester = filterSemester; 
        if (filterTerm !== "All") params.tos_term = filterTerm; 
        if (filterProgram !== "All") params.program = filterProgram; 
        if (filterStatus !== "All") params.deadline_status = filterStatus;
        if (showApprovedOnly) params.approved_only = true;

        // Fetch reports and deadlines in parallel
        const [reportsRes, deadlinesRes, programRes] = await Promise.all([
          api.get(`/tos-reports/`, { params }),
          api.get(`/deadlines/`, { params: { role: role } }),
          api.get(`/academics/programs/`, { params: { role: role, all: true } })
        ]);

        const reportsData = reportsRes.data;
        setReports(reportsData.results || []);
        setTotalPages(reportsData.total_pages || 1);

        setDeadlines(deadlinesRes.data || []); 
        setPrograms(programRes.data || []); 
        setError(""); // clear previous errors on success

      } catch (err: any) {
        console.error("Failed to load data", err);
        setError("Failed to load reports or deadlines. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, searchTerm, filterYear, filterSemester, filterTerm, filterProgram, filterStatus, showApprovedOnly, role]);  

  const displayName = (u: User) => {
    const prefix = u.prefix ? `${u.prefix} ` : "";
    const suffix = u.suffix ? `, ${u.suffix}` : "";

    const fullName = `${prefix}${u.first_name} ${u.last_name}${suffix}`.trim();

    return fullName || u.email;
  };

  // ---------------------------
  // Versions modal handlers
  // ---------------------------
  const openVersionsModal = async (report: Report) => {
    setSelectedReportVersions(null);
    setVersionsLoading(true);
    setVersionsOpen(true);
    setSelectedReportTitle(
      `${report.bayanihan_group.course.course_code} - ${report.bayanihan_group.course.course_title}`
    );

    try {
      const res = await api.get<VersionsResponse>(`/tos-reports/${report.id}/`);
      const versions = res.data.all_versions || [];
      setSelectedReportVersions(versions);
    } catch (err: any) {
      console.error("Failed to load versions", err);
      toast.error("Failed to load versions. Please try again.");
      setSelectedReportVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };  

  const closeVersionsModal = () => {
    setVersionsOpen(false);
    setSelectedReportVersions(null);
    setSelectedReportTitle("");
  };

  // derive school years
  const schoolYears = useMemo(() => {
    const years = Array.from(
      new Set(reports.map((r) => r.bayanihan_group.school_year))
    );
    return [...years];
  }, [reports]); 

  // ✅ Status color mapping (consistent across app)
  const statusStyles: Record<string, React.CSSProperties> = {
    "Draft": {
      backgroundColor: "#D1D5DB",
      color: "#4B5563",
      border: "1px solid #9CA3AF",
    },
    "Pending Chair Review": {
      backgroundColor: "#FEF3C7",
      color: "#D97706",
      border: "1px solid #FCD34D",
    },
    "Returned by Chair": {
      backgroundColor: "#FECACA",
      color: "#E11D48",
      border: "1px solid #F87171",
    },
    "Requires Revision": {
      backgroundColor: "#FEE2E2",
      color: "#EF4444",
      border: "1px solid #FCA5A5",
    },
    "Revisions Applied": {
      backgroundColor: "#DBEAFE",
      color: "#3B82F6",
      border: "1px solid #93C5FD",
    }, 
    "Approved by Chair": {
      backgroundColor: "#A7F3D0",
      color: "#047857",
      border: "1px solid #6EE7B7",
    },
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" /> 

      <main className="justify-center items-center">
        {/* <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-yellow-50 p-6"> */}
        <div className="min-h-screen p-3">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* ---- Header ---- */}
            <div
              className="text-center" 
            >
              <h1 className="text-4xl font-bold text-gray-200 tracking-tight">
                TOS Reports Dashboard
              </h1>
              <p className="text-gray-200 mt-2 font-semibold">
                Track TOS Submissions
              </p>
            </div>

            {/* ---- Banner ---- */}
            <Card className="bg-blue-600 text-white shadow-lg border-none hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-wide">
                  Total Active TOS Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 mb-3">
                  View and filter all TOS submissions and approval records.
                </p>
                <Badge className="bg-yellow-400 text-white text-[14px] font-bold">
                  {reports.length} Active Reports
                </Badge>
              </CardContent>
            </Card>

            {/* ---- Filter Controls ---- */}
            <Card className="border-none shadow-md p-4 bg-white/80 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-3 text-blue-500"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by course name..."
                    className="pl-10 pr-4 py-2 w-full border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter by School Year (animated chevron) */}
                <div
                  className="relative inline-block w-40"
                  onFocus={() => setOpenYear(true)}
                  onBlur={() => setOpenYear(false)}
                >
                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    onClick={() => setOpenYear(!openYear)}
                    className="pl-9 pr-8 py-2 w-full appearance-none border border-blue-200 rounded-lg bg-white text-blue-900 font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="All">School Year</option>
                    {schoolYears.map((yr) => (
                      <option key={yr}>{yr}</option>
                    ))}
                  </select>

                  <motion.div
                    initial={false}
                    animate={{ rotate: openYear ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                  >
                    <FaChevronDown />
                  </motion.div>
                </div>
                
                {/* Filter by Semester (animated chevron) */}
                <div
                  className="relative inline-block w-38"
                  onFocus={() => setOpenSem(true)}
                  onBlur={() => setOpenSem(false)}
                >
                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    onClick={() => setOpenSem(!openSem)}
                    className="pl-9 pr-8 py-2 w-full appearance-none border border-blue-200 rounded-lg bg-white text-blue-900 font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="All">Semesters</option>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>

                  <motion.div
                    initial={false}
                    animate={{ rotate: openSem ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                  >
                    <FaChevronDown />
                  </motion.div>
                </div>
                
                {/* Filter by TERM (animated chevron) */}
                <div
                  className="relative inline-block w-30"
                  onFocus={() => setOpenTerm(true)}
                  onBlur={() => setOpenTerm(false)}
                >
                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    onClick={() => setOpenTerm(!openTerm)}
                    className="pl-9 pr-8 py-2 w-full appearance-none border border-blue-200 rounded-lg bg-white text-blue-900 font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="All">Term</option>
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINALS">Finals</option> 
                  </select>

                  <motion.div
                    initial={false}
                    animate={{ rotate: openTerm ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                  >
                    <FaChevronDown />
                  </motion.div>
                </div>
                
                {/* Filter by Program (animated chevron) */}
                <div
                  className="relative inline-block w-35"
                  onFocus={() => setOpenProg(true)}
                  onBlur={() => setOpenProg(false)}
                >
                  <Filter
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                    size={18}
                  />
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    onClick={() => setOpenProg(!openProg)}
                    className="pl-9 pr-8 py-2 w-full appearance-none border border-blue-200 rounded-lg bg-white text-blue-900 font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="All">Programs</option>
                    {programs.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.program_code}</option>
                    ))}
                  </select>

                  <motion.div
                    initial={false}
                    animate={{ rotate: openProg ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                  >
                    <FaChevronDown />
                  </motion.div>
                </div>

                {/* Deadline Status Filter */}
                <div className="relative w-40">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={18} />

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-9 pr-8 py-2 w-full appearance-none border border-blue-200 
                    rounded-lg bg-white text-blue-900 font-medium focus:ring-2 
                    focus:ring-blue-400 outline-none"
                    >
                    <option value="All">All Reports</option>
                    <option value="on-time">On Time</option>
                    <option value="near">Near Deadline</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approvedOnly"
                    checked={showApprovedOnly}
                    onChange={(e) => setShowApprovedOnly(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="approvedOnly" className="text-blue-800 font-medium">
                    Show Approved Only
                  </label>
                </div>
              </div>
            </Card>

            {/* ---- Error Message ---- */}
            {error && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* ---- Reports Table ---- */}
            <Card className="shadow-2xl border-none bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row justify-between items-center">
                {/* Left: Title */}
                <CardTitle className="text-blue-900 text-lg font-bold">
                  TOS Reports
                </CardTitle>

                {/* Right: Legend */}
                <div className="flex items-center gap-4 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-300 rounded"></span> Overdue
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-300 rounded"></span> Near Deadline (≤ 5 days)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-gray-200 rounded"></span> On Time
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-blue-700" size={32} />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-center text-blue-800 py-8">
                    No matching reports found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-100 text-blue-900 text-center">
                        <TableHead className="text-center">Course</TableHead>
                        <TableHead className="text-center">Term</TableHead>
                        <TableHead className="text-center">Bayanihan Leader</TableHead> 
                        <TableHead className="text-center">Submitted to Chair</TableHead>
                        <TableHead className="text-center">Approved by Chair</TableHead>
                        <TableHead className="text-center">Deadline</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        {/* <TableHead className="text-center">Version</TableHead> */}
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((r) => {
                        const deadlineStatus = getDeadlineStatus(r, deadlines);
                        const rowClass = getRowClass(deadlineStatus);

                        // Find matching deadline 
                        const matchedDeadline = getMatchedDeadline(r, deadlines);

                        const deadlineDate = matchedDeadline
                          ? formatDate(matchedDeadline)
                          : "—";

                        return (
                          <TableRow key={r.id} className={`transition-all ${rowClass}`}>
                            <TableCell className="font-medium">
                              {r.bayanihan_group.course.course_code} - {r.bayanihan_group.course.course_title}
                            </TableCell>
                            <TableCell className="font-medium">
                              {r.tos.term}
                            </TableCell>  
                            <TableCell className="">
                              {r.bayanihan_group.bayanihan_members
                              .filter((m) => m.role === "LEADER")
                              .map((m) => (
                                <div key={m.id} className="leading-tight">
                                  {displayName(m.user)}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>
                              {formatDate(r.chair_submitted_at) || (
                                <span className="text-gray-500 font-medium">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(r.chair_approved_at) || (
                                <span className="text-gray-500 font-medium">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-blue-900">
                              {deadlineDate}
                            </TableCell>
                            <TableCell>
                              <Badge
                                style={statusStyles[r.tos.status] || statusStyles["Draft"]}
                                className="px-3 py-1 font-semibold rounded-md text-xs"
                              >
                                {r.tos.status}
                              </Badge>
                            </TableCell>
                            {/* <TableCell>{r.version}</TableCell> */}
                            <TableCell> 
                              <button
                                className="text-blue-700 hover:text-blue-500 hover:underline font-semibold"
                                onClick={() => openVersionsModal(r)}
                              >
                                See All Versions
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody> 
                  </Table>
                )} 

                {/* Pagination controls */}
                <div className="mt-6 flex justify-between items-center flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </Button>

                  <div className="flex gap-5">
                    <Button
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </Button>
                    {/* Numbered pages */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show only nearby pages to avoid too many buttons
                      if (page < currentPage - 2 || page > currentPage + 2) return null;
                      return (
                        <Button
                          key={page}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 ${
                            page === currentPage
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </Button>
                </div> 
              </CardContent>
            </Card>
          </div>
        </div>
      </main> 

      {/* -------------------------
          Versions Modal (simple)
         ------------------------- */}
      {versionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeVersionsModal}
          />
          <div className="relative w-[90%] max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-slate-700">
                Versions — <span className="font-bold">{selectedReportTitle} Reports</span>
              </h3>
              <div className="flex items-center">
                <button
                  className="text-sm text-slate-500 hover:text-slate-700"
                  onClick={closeVersionsModal}
                >
                  <X size={30} className="rounded-full hover:bg-gray-200 p-1.5"/>
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-auto">
              {versionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-blue-700" size={28} />
                </div>
              ) : !selectedReportVersions || selectedReportVersions.length === 0 ? (
                <p className="text-center text-slate-600 py-6">
                  No versions available.
                </p>
              ) : ( 
                <Table className="w-full text-left">
                  <TableHeader>
                    <TableRow className="text-sm text-slate-600"> 
                      <TableHead>Version</TableHead>
                      <TableHead>Submitted to Chair</TableHead>
                      <TableHead>Approved by Chair</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead> 
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReportVersions.map((v) => { 
                      const deadlineStatus = getDeadlineStatus(v, deadlines);
                      const rowClass = getRowClass(deadlineStatus);

                      // Find matching deadline by school_year + semester  
                      const matchedDeadline = getMatchedDeadline(v, deadlines);

                      const deadlineDate = matchedDeadline
                        ? formatDate(matchedDeadline)
                        : "—";
                        
                      return ( 
                        <TableRow key={v.id} className={`transition-all ${rowClass}`}> 
                          <TableCell>{v.version}</TableCell>
                          <TableCell>
                            {formatDate(v.chair_submitted_at) || (
                              <span className="text-gray-500 font-medium">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(v.chair_approved_at) || (
                              <span className="text-gray-500 font-medium">—</span>
                            )}
                          </TableCell> 
                          <TableCell className="font-bold text-blue-900">
                            {deadlineDate}
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={
                                statusStyles[v.tos.status] || statusStyles["Draft"]
                              }
                              className="px-2 py-1 text-xs rounded"
                            >
                              {v.tos.status}
                            </Badge>
                          </TableCell> 
                        </TableRow>
                      )}
                    )}
                  </TableBody>
                </Table> 
              )}
            </div>

            {/* <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <Button color="gray" onClick={closeVersionsModal}>
                Close
              </Button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}
