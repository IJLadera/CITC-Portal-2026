import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import {
  Button,
  Modal, 
  ModalBody, 
  TextInput, 
  Select,
  Spinner,
  ModalHeader,
} from "flowbite-react";  
import { toast, ToastContainer } from "react-toastify";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]); 
  const [groups, setGroups] = useState<BayanihanGroup[]>([]);
  const [loading, setLoading] = useState(true);  
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPastModal, setShowPastModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate(); 

  const [creationMode, setCreationMode] = useState<"NEW" | "DUPLICATE">("NEW");
  const [pastSyllabi, setPastSyllabi] = useState<Syllabus[]>([]);
  const [selectedPastId, setSelectedPastId] = useState<number | null>(null);
  const [loadingPast, setLoadingPast] = useState(false);
  
  // Filters
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
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
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (selectedYear !== "All") params.school_year = selectedYear;
        if (selectedStatus !== "All") params.status = selectedStatus;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const [syllabiRes, groupRes] = await Promise.all([
          api.get(`/syllabi/`, { params }),
          api.get(`/bayanihan/groups/without-syllabus/?role=${role}`),
        ]);

        if (!mounted) return;

        const data = syllabiRes.data;
        setSyllabi(data.results);
        setTotalPages(data.total_pages || 1); 
        setGroups(groupRes.data); 

      } catch (err: any) {
        console.error("Failed to load syllabi or groups", err); 
  
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
          toast.error("Error fetching Syllabi or Group. Please try again later.");
        }
        
      } finally {
        if (mounted) setLoading(false);
      }
    }; 
    loadData();
    return () => { mounted = false; };
  }, [role, currentPage, selectedYearLevel, selectedSemester, selectedYear, selectedStatus, searchTerm]);

  const handleSelectGroup = async (group: BayanihanGroup) => {
    setSelectedGroupId(group.id);
    setCreationMode("NEW"); // reset mode
    setSelectedPastId(null);
    setPastSyllabi([]);
    setLoadingPast(true);

    try {
      const res = await api.get(
        `/syllabi/past-syllabi/${group.id}/?role=${role}`
      );
      setPastSyllabi(res.data || []);
    } catch (err: any) {
      console.error("Failed to load past syllabi", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to create syllabus.");
      }

    } finally {
      setLoadingPast(false);
    }
 
    setShowPastModal(true);
  };
  
  const handleSubmit = async () => { 
    if (!selectedGroupId) {
      toast.error("Please select a Bayanihan Group");
      return;
    }

    try { 
      if (creationMode === "NEW") {
        // CREATE NEW SYLLABUS
        await api.post("/syllabi/", { bayanihan_group_id: selectedGroupId });
        toast.success("New syllabus created.");
      }  
      else if (creationMode === "DUPLICATE") {

        if (!selectedPastId) {
          toast.error("Please select a syllabus to duplicate.");
          return;
        }

        await api.post(
          `/syllabi/${selectedPastId}/duplicate-syllabus/?role=${role}`,
          { bayanihan_group: selectedGroupId }
        );

        toast.success("Syllabus duplicated successfully.");
      }

      // Refresh Syllabi List
      const params: Record<string, any> = {
        role,
        page: currentPage,
        page_size: 5,
      };
      const res = await api.get(`/syllabi/`, { params });
      setSyllabi(res.data.results); 
      
    } catch (err: any) {
      console.error("Failed to create syllabus", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to create syllabus.");
      }

    } finally {
      setShowModal(false);
      setShowPastModal(false);
      setShowConfirm(false);
    }
  };

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

  return (
    <div className="flex-1 flex flex-col"> 
      <ToastContainer position="top-right" autoClose={5000} theme="colored" /> 
      
      <main className="p-4 mt-5 flex justify-center">
        <div className="p-6 shadow bg-white rounded-lg border border-gray-200 w-full max-w-6xl flex flex-col">
          <h1 className="font-bold text-4xl text-[#201B50] mb-4 text-left">
            List of Syllabi
          </h1>

          <div className="flex gap-4 mb-4">
            <Button className="rounded-sm bg-[#007BFF]" onClick={() => setShowModal(true)}>
              Create Syllabus
            </Button>
          </div>

          {/* Modal 1: Create Syllabus - Bayanihan Group Selection */}
          <Modal show={showModal} dismissible onClose={() => setShowModal(false)} size="lg">
            <ModalHeader>Select Bayanihan Group</ModalHeader>
            <ModalBody>
              <div className="divide-y">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition"
                      onClick={() => handleSelectGroup(group)}
                    >
                      <p className="font-semibold dark:text-white">
                        {group.course.course_code} - {group.course.course_title}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        SY {group.school_year} | {group.course.course_semester.toLowerCase()} Semester
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 p-3">No Bayanihan Groups available.</p>
                )}
              </div>
            </ModalBody>
          </Modal> 

          {/* Modal 2: Pick Create New Syllabus or Dupliate from a Past Syllabus */}
          <Modal show={showPastModal} size="lg" onClose={() => setShowPastModal(false)}>
            <ModalHeader>Create Syllabus</ModalHeader>
            <ModalBody>
              <div className="space-y-4">

                {/* 1️⃣ Creation Mode Selection */}
                <label className="font-semibold text-gray-700">Choose Creation Method</label>
                <Select
                  value={creationMode}
                  onChange={(e) => setCreationMode(e.target.value as "NEW" | "DUPLICATE")}
                >
                  <option value="NEW">Create New Syllabus</option>
                  {pastSyllabi.length > 0 && (
                    <option value="DUPLICATE">Duplicate From Previous Syllabus</option>
                  )}
                </Select>

                {/* 2️⃣ If duplicate, show list of past syllabi */}
                {creationMode === "DUPLICATE" && (
                  <div className="mt-3">
                    <label className="font-semibold text-gray-700">
                      Select Syllabus to Duplicate
                    </label>

                    {loadingPast ? (
                      <div className="flex items-center gap-2 p-2">
                        <Spinner size="sm" /> Loading...
                      </div>
                    ) : pastSyllabi.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No past syllabi available for this course.
                      </p>
                    ) : (
                      <Select
                        value={selectedPastId ?? ""}
                        onChange={(e) => setSelectedPastId(Number(e.target.value))}
                      >
                        <option value="">-- Select a Syllabus --</option>
                        {pastSyllabi.map((syll) => (
                          <option key={syll.id} value={syll.id}>
                            {syll.bayanihan_group.course.course_code} - {syll.bayanihan_group.course.course_title}, {" "}
                            SY {syll.bayanihan_group.school_year} | {syll.bayanihan_group.course.course_semester.toLowerCase()} Semester
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                )}

                {/* 3️⃣ Confirm */}
                <div className="flex justify-end gap-2 mt-5">
                  <Button color="gray" onClick={() => setShowPastModal(false)}>
                    Cancel
                  </Button>
                  <Button color="blue" onClick={() => setShowConfirm(true)}>
                    Continue
                  </Button>
                </div>
              </div>
            </ModalBody>
          </Modal>
          
          <ConfirmDialog
            isOpen={showConfirm}
            title="Create Syllabus?"
            message="Once create, you might not be able to delete it anymore."
            confirmText="Yes, Create"
            doubleConfirm={false}
            onConfirm={handleSubmit}
            onClose={() => setShowConfirm(false)}
          />

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

            {/* Syllabi Status Filter */}
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            >
              <option value="All">Status (All)</option>
              <option value="Draft">Draft</option>
              <option value="Pending Chair Review">Pending Chair Review</option>
              <option value="Returned by Chair">Returned by Chair</option>
              <option value="Requires Revision">Requires Revision</option>
              <option value="Revisions Applied">Revisions Applied</option>
              <option value="Approved by Chair">Approved by Chair</option>
              <option value="Returned by Dean">Returned by Dean</option>
              <option value="Approved by Dean">Approved by Dean</option>
            </Select>  
          </div> 
                
          {/* Syllabus Table */}
          <div className="flex-1">
            <div className="flex-1 overflow-y-auto relative">
              <table className="w-full text-left text-gray-600 shadow-lg mb-8"> 
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
                  
                {syllabi.length > 0 ? (
                  syllabi.map((syllabus, idx) => (
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
                          className="hover:underline py-1 px-3 text-blue-500"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )) 
                ) : (
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
                  
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </Button>
          </div> 
        </div>
      </main>
    </div>
  );
}
