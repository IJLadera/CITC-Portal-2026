import React, { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom"; 
import { FaSearch } from "react-icons/fa";
import api from "../../../api"; 
import { Select, Spinner, TextInput } from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import type { Program } from "@/types/academic";
import { formatListDate } from "@/utils/formatters";

// Types/Interfaces
interface Course {
  id: number;
  course_code: string;
  course_title: string;
  course_year_level: string;
  course_semester: string;
};

interface TOS {
  id: number;
  term: string;
  bayanihan_group: BayanihanGroup; 
  chair_submitted_at: string;
  chair_approved_at: string;
  version: number;
  status: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
};

interface Member {
  id: number;
  user: User;
  role: "LEADER" | "TEACHER";
};

interface BayanihanGroup {
  id: number;
  school_year: string;
  course: Course;
  bayanihan_members: Member[];
}  

export default function TOSList() { 
  const activeRole = localStorage.getItem("activeRole");   
  const role = activeRole?.toUpperCase();
  const [TOS, setTOS] = useState<TOS[]>([]); 
  const [program, setPrograms] = useState<Program[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  const navigate = useNavigate();
    
  // Filters
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>(""); 
  
  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 
  const [totalResults, setTotalResults] = useState(0);
  const perPage = 5; // ✅ match your backend default
  
  useEffect(() => {
    let mounted = true; 
    const loadData = async () => {
      try {
        setLoading(true);

        const params: Record<string, any> = {
          role,
          page: currentPage,
          page_size: perPage,
        };

        if (selectedYearLevel !== "All") params.year_level = selectedYearLevel;
        if (selectedProgram !== "All") params.program = selectedProgram;
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (selectedYear !== "All") params.school_year = selectedYear;
        if (selectedStatus !== "All") params.status = selectedStatus;
        if (searchTerm.trim()) params.search = searchTerm.trim(); 
 
        const [tosRes, programRes] = await Promise.all([ 
          api.get(`/tos/`, { params }),
          api.get(`/academics/programs/`, { params: { role: role, all: true } })
        ]); 

        if (!mounted) return;

        const data = tosRes.data;
        setTOS(data.results || []); // ✅ paginated items
        setTotalPages(data.total_pages || 1); 
        setTotalResults(data.total_results || 0);  
        setPrograms(programRes.data);

      } catch (err: any) {
        console.error("Failed to load TOS or programs", err); 
  
        if (err.response && err.response.data) {
          const data = err.response.data;

          // If Django returned field-specific errors
          if (typeof data === "object" && !Array.isArray(data)) {
            Object.entries(data).forEach(([field, messages]) => {
              if (field === "non_field_errors" && Array.isArray(messages)) {
                // 🔹 Only show the messages directly
                messages.forEach((msg) => toast.error(msg));
              } else if (Array.isArray(messages)) {
                messages.forEach((msg) => toast.error(`${msg}`));
              } else {
                toast.error(`${messages}`);
              }
            });
          } 
          // Generic string or array message (like PermissionDenied)
          else if (typeof data === "string" || Array.isArray(data)) {
            toast.error(Array.isArray(data) ? data.join(", ") : data);
          } 
          else {
            toast.error("An unexpected error occurred.");
          }
        } else {
          toast.error("Error fetching TOS or Programs. Please try again later.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }; 
    loadData();
    return () => { mounted = false; };
  }, [role, currentPage, selectedYearLevel, selectedProgram, selectedSemester, selectedYear, selectedStatus, searchTerm]); 

  const statusStylesMap: Record<string, { bg: string; color: string; border: string }> = {
    Draft: { bg: "#D1D5DB", color: "#4B5563", border: "#9CA3AF" },
    "Pending Chair Review": { bg: "#FEF3C7", color: "#D97706", border: "#FCD34D" },
    "Returned by Chair": { bg: "#FECACA", color: "#E11D48", border: "#F87171" },
    "Requires Revision": { bg: "#FEE2E2", color: "#EF4444", border: "#FCA5A5" },
    "Revisions Applied": { bg: "#DBEAFE", color: "#3B82F6", border: "#93C5FD" },
    "Approved by Chair": { bg: "#D1FAE5", color: "#059669", border: "#6EE7B7" },
  }; 

  if (error) return <p className="p-4 text-red-500">{error}</p>;
  
  // Derive available school years from fetched groups in TOS
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(TOS.map((s) => s.bayanihan_group.school_year)));
    return years.sort((a, b) => b.localeCompare(a)); // descending
  }, [TOS]); 

  return (
    <div className="flex-1 flex flex-col">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" /> 

      <main className="p-4 mt-5  flex justify-center">
        <div className="p-6 shadow bg-white rounded-lg border border-gray-200 w-full max-w-6xl">
          <h1 className="font-bold text-4xl text-[#201B50] mb-4 text-left">List of TOS</h1>  
          
          {/* Filter Section */}
          <div className="flex flex-nowrap gap-2 items-center justify-between overflow-x-auto mb-6 px-2 scrollbar-hide">
            {/* Search */}
            <TextInput
              type="text"
              placeholder="Search course..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-70 flex-shrink-0"
            /> 

            {/* Year Level Filter */}
            <Select
              value={selectedYearLevel}
              onChange={(e) => {
                setSelectedYearLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="All">Year Level (All)</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </Select> 
             
            {/* Program Filter */}
            <Select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40" 
            >
              <option value="All">Programs (All)</option>
              {program.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.program_code}
                </option>
              ))}
            </Select>

            {/* Semester Filter */}
            <Select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="All">Semesters (All)</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="Summer">Summer</option>
            </Select> 
            
            {/* School Year Filter */}
            <Select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="All">School Years (All)</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>

            {/* TOS Status Filter */}
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="All">Status (All)</option> 
              <option value="Returned by Chair">Returned by Chair</option> 
              <option value="Revisions Applied">Revisions Applied</option>
              <option value="Approved by Chair">Approved by Chair</option> 
            </Select>  
          </div> 

          {/* Table */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Centered Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                <Spinner size="xl" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
                <thead className="text-xs uppercase bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">School Year</th>
                    <th className="px-6 py-3">Semester</th>
                    <th className="px-6 py-3">Term</th>
                    <th className="px-6 py-3">Submitted At</th>
                    <th className="px-6 py-3">Approved At</th>
                    <th className="px-6 py-3">Version</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {TOS.map((tos) => (
                    <tr
                      key={tos.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="px-6 py-4 font-medium">{`${tos.bayanihan_group.course.course_code} - ${tos.bayanihan_group.course.course_title}`}</td>
                      <td className="px-6 py-4">{tos.bayanihan_group.school_year}</td>
                      <td className="px-6 py-4">{tos.bayanihan_group.course.course_semester.toLowerCase()}</td>
                      <td className="px-6 py-4">{tos.term}</td>
                      <td className="px-6 py-4">
                        {tos.chair_submitted_at ? formatListDate(tos.chair_submitted_at) : "———"} 
                      </td>
                      <td className="px-6 py-4">
                        {tos.chair_approved_at ? formatListDate(tos.chair_approved_at) : "———"} 
                      </td>
                      <td className="px-6 py-4">{tos.version}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-3 py-1 text-xs text-center font-medium rounded-lg border"
                          style={{
                            backgroundColor: statusStylesMap[tos.status]?.bg || "#F3F4F6",
                            color: statusStylesMap[tos.status]?.color || "#374151",
                            borderColor: statusStylesMap[tos.status]?.border || "#D1D5DB",
                          }}
                        >
                          {tos.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => navigate(`/${activeRole}/tos/${tos.id}/view`)}
                        >
                          View  
                        </button>
                      </td>
                    </tr>
                  ))}
                  {TOS.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing{" "}
              {totalResults === 0
                ? "0"
                : `${(currentPage - 1) * perPage + 1} - ${Math.min(
                    currentPage * perPage,
                    totalResults
                  )}`}{" "}
              of {totalResults}
            </p>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded-md disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="px-3 py-1 border rounded-md disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

  );
}; 