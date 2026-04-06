import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Program } from "@/types/academic";
import api from "../../../api"; 
import { Dropdown, Button , Select, Spinner, TextInput} from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
import { formatListDate } from "@/utils/formatters";

// Types
interface Course {
  id: number;
  course_code: string;
  course_title: string;
  course_year_level: string;
  course_semester: string;
};

interface Syllabus {
  id: number;
  course: Course; 
  bayanihan_group: BayanihanGroup;
  chair_submitted_at: string;
  dean_approved_at: string;
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

export default function SyllabiList() {
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]); 
  const [program, setPrograms] = useState<Program[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  const navigate = useNavigate();  
  
  // Filters
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All"); 
  const [searchTerm, setSearchTerm] = useState<string>(""); 
 
  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);  

  useEffect(() => {
    let mounted = true; 
    const loadData = async () => {
      try {
        setLoading(true);

        const params: Record<string, any> = {
          role,
          page: currentPage,
          page_size: 5,
        }; 

        if (selectedYearLevel !== "All") params.year_level = selectedYearLevel;
        if (selectedProgram !== "All") params.program = selectedProgram;
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (selectedYear !== "All") params.school_year = selectedYear; 
        if (searchTerm.trim()) params.search = searchTerm.trim();
 
        const [syllabiRes, programRes] = await Promise.all([ 
          api.get(`/syllabi/`, { params }),
          api.get(`/academics/programs/`, { params: { role: role, all: true } })
        ]);

        if (!mounted) return;

        const data = syllabiRes.data;
        setSyllabi(data.results);
        setTotalPages(data.total_pages || 1);  
        setPrograms(programRes.data);

      } catch (err: any) {
        console.error("Failed to load syllabi or programs", err);
        toast.error("Failed to load syllabi or programs");
      } finally {
        if (mounted) setLoading(false);
      }
    }; 
    loadData();
    return () => { mounted = false; };
  }, [role, selectedYearLevel, selectedProgram, selectedSemester, selectedYear, searchTerm, currentPage]);

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
      backgroundColor: "#D1FAE5",
      color: "#059669",
      border: "1px solid #6EE7B7",
    },
    "Returned by Dean": {
      backgroundColor: "#FDA4AF",
      color: "#BE123C",
      border: "1px solid #FB7185",
    },
    "Approved by Dean": {
      backgroundColor: "#A7F3D0",
      color: "#047857",
      border: "1px solid #6EE7B7",
    },
  }; 
  
  // Derive available school years from fetched groups in Syllabi
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(syllabi.map((s) => s.bayanihan_group.school_year)));
    return years.sort((a, b) => b.localeCompare(a)); // descending
  }, [syllabi]); 
 
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="flex-1 flex flex-col">
      <ToastContainer position="top-right" autoClose={4000} theme="colored" /> 

      <main className="p-4 mt-5  flex justify-center">
        <div className="p-6 shadow bg-white rounded-lg border border-gray-200 w-full max-w-6xl flex flex-col">
          <h1 className="font-bold text-4xl text-[#201B50] mb-4 text-left">
            List of Syllabi
          </h1>  


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
              className="w-90 flex-shrink-0"
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
          </div> 

          {/* Syllabus Table */}
          <div className="flex-1 overflow-y-auto relative">
            <table className="w-full text-left text-gray-600 shadow-lg mb-8">
              {/* Centered Loading Spinner */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Spinner size="xl" />
                </div>
              )}
              <thead className="text-xs text-white uppercase bg-[#6697e5]">
                <tr>
                  <th className="pl-2 rounded-tl-sm">Course Code</th>
                  <th className="pl-2">Course Title</th>
                  <th className="pl-2">School Year</th>
                  <th className="pl-2">Semester</th>
                  <th className="pl-2">Submitted At</th>
                  <th className="pl-2">Approved At</th>
                  <th className="pl-2">Version</th>
                  <th className="text-center">Status</th>
                  <th className="px-6 py-3 rounded-tr-sm text-center">Action</th>
                </tr>
              </thead>
              <tbody className="w-full text-left divide-y divide-gray-200 text-[14px] font-semibold">
                {syllabi.map((syllabus, idx) => (
                  <tr
                    key={syllabus.id}
                    className={`${idx % 2 === 0 ? "bg-gray-200 hover:bg-white" : "bg-white hover:bg-gray-200"}`}
                  >
                    <td className="font-bold pl-2 py-4">{syllabus.bayanihan_group.course.course_code}</td>
                    <td className="pl-2">{syllabus.bayanihan_group.course.course_title}</td>
                    <td className="pl-2">{syllabus.bayanihan_group.school_year}</td>
                    <td className="pl-2">{syllabus.bayanihan_group.course.course_semester.toLowerCase()}</td>
                    <td className="pl-2"> 
                      {syllabus.chair_submitted_at ? formatListDate(syllabus.chair_submitted_at) : "—"}
                    </td>
                    <td className="pl-2">
                      {syllabus.dean_approved_at ? formatListDate(syllabus.dean_approved_at) : "—"}
                    </td> 
                    <td className="pl-2">Version {syllabus.version}</td>
                    <td className="pl-2 text-center">
                      <span
                        style={{
                          ...statusStyles[syllabus.status],
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {syllabus.status}
                      </span>
                    </td>
                    <td className="pl-2 text-center">
                      <button
                        onClick={() => navigate(`${syllabus.id}/view`)}
                        className=" hover:underline py-1 px-3 text-blue-500 "
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {syllabi.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div> 

          {/* Pagination controls */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <Button
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="self-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div> 
        </div>  
      </main>
    </div>
  );
}
