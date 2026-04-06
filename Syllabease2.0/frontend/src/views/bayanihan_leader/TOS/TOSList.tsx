import React, { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom"; 
import { FaSearch } from "react-icons/fa";
import api from "../../../api";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Select, Spinner, TextInput } from "flowbite-react";
import { toast, ToastContainer } from "react-toastify";
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

interface SyllabusCourseOutlines {
  id: number;
  row_no: number;
  syllabus_term: string; 
  allotted_hour: number;
  allotted_time: string; 
  topics: string; 
};

interface Program {
  id: number;
  program_name: string;
  program_code: string; 
} 

interface Syllabus {
  id: number; 
  bayanihan_group: BayanihanGroup;
  course_outlines: SyllabusCourseOutlines;
  program: Program;
  
  chair_submitted_at: string;
  dean_approved_at: string;
  version: number;
  status: string;
}

export default function TOSList() {  
  const activeRole = localStorage.getItem("activeRole");  
  const role = activeRole?.toUpperCase(); 
  const [TOS, setTOS] = useState<TOS[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSyllabiModal, setShowSyllabiModal] = useState(false);
  const [showTOSFormModal, setShowTOSFormModal] = useState(false);
  // Overlay shown while TOS is being generated
  const [generatingTOS, setGeneratingTOS] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tosForm, setTosForm] = useState({
    term: "",
    total_items: 0,
    tos_cpys: "",
    col1_percentage: 0,
    col2_percentage: 0,
    col3_percentage: 0,
    col4_percentage: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();
  
  // Filters
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
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
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (selectedYear !== "All") params.school_year = selectedYear;
        if (selectedStatus !== "All") params.status = selectedStatus;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const [TOSRes, syllabiRes] = await Promise.all([
          api.get(`/tos/`, { params }),
          api.get(`/syllabi/approved-syllabi/?role=${role}`),
        ]); 

        if (!mounted) return;

        const data = TOSRes.data;
        setTOS(data.results || []); // ✅ paginated items
        setTotalPages(data.total_pages || 1); 
        setTotalResults(data.total_results || 0); 
        setSyllabi(syllabiRes.data); 

      } catch (err: any) {
        console.error("Failed to load TOS or approved syllabi", err); 
  
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
          toast.error("Error fetching TOS or approved Syllabi. Please try again later.");
        }
        
      } finally {
        if (mounted) setLoading(false);
      }
    }; 
    loadData();
    return () => { mounted = false; };
  }, [role, currentPage, selectedYearLevel, selectedSemester, selectedYear, selectedStatus, searchTerm]);

  const handleOpenSyllabiModal = () => {
    setShowSyllabiModal(true);
  };

  const handleSelectSyllabus = (syllabus: Syllabus) => {
    setSelectedSyllabus(syllabus);
    setShowSyllabiModal(false);
    setShowTOSFormModal(true);

    const getOrdinal = (num: number) => {
      switch (num) {
        case 1: return "ST";
        case 2: return "ND";
        case 3: return "RD";
        default: return "TH";
      }
    };
    // ✅ Auto-fill tos_cpys
    const programCode = syllabus.program.program_code || "";
    const yearLevelNum = Number(syllabus.bayanihan_group.course.course_year_level) || 1;
    const yearLevelOrdinal = `${yearLevelNum}${getOrdinal(yearLevelNum)}`;

    setTosForm((prev) => ({
      ...prev,
      tos_cpys: `${programCode}/${yearLevelOrdinal}/`,
    }));
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let newValue = value;

    // ⛔ Prevent negative values for number inputs
    if (type === "number") {
      const numeric = Number(value);
      if (numeric < 0) newValue = "0";
    } 

    setTosForm((prev) => ({ ...prev, [name]: newValue }));

    // Auto-check topics when term changes
    if (name === "term" && selectedSyllabus) {
      const outlines = Array.isArray(selectedSyllabus.course_outlines)
        ? selectedSyllabus.course_outlines.filter((co) => co.syllabus_term === newValue)
        : selectedSyllabus.course_outlines.syllabus_term === newValue
          ? [selectedSyllabus.course_outlines]
          : [];

      // ✅ auto-check all topics
      setSelectedTopics(outlines.map((co) => co.topics));
    }
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };
  
  const handleCreateTOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSyllabus) return;

    const col1 = Number(tosForm.col1_percentage || 0);
    const col2 = Number(tosForm.col2_percentage || 0);
    const col3 = Number(tosForm.col3_percentage || 0);
    const col4 = Number(tosForm.col4_percentage || 0);
    const total = col1 + col2 + col3 + col4;
 
    if (tosForm.total_items < 1) {
      setFormError("Please select a valid total item number.");
      return;
    }
    if (col1 > 50) {
      setFormError("Knowledge cannot exceed 50%.");
      return;
    }
    if (total !== 100) {
      setFormError("Total cognitive levels must equal 100%.");
      return;
    }
    if (selectedTopics.length === 0) {
      setFormError("Please select at least one topic.");
      return;
    }

    try {
      setFormError(null);
      setGeneratingTOS(true);

      await api.post("/tos/", {
        syllabus_id: selectedSyllabus.id,
        ...tosForm,
        selected_topics: selectedTopics,
      });

      toast.success("TOS created successfully");
      
      const params: Record<string, any> = {
        role,
        page: currentPage,
        page_size: perPage,
      };
      const res = await api.get(`/tos/`, { params });
      setTOS(res.data.results);
      
    } catch (err: any) { 
      console.error("Failed to create TOS", err);
 
      if (err.response && err.response.data) {
        const data = err.response.data;

        // If Django returned field-specific errors
        if (typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([field, messages]) => {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${field}: ${msg}`));
            } else {
              toast.error(`${field}: ${messages}`);
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
        toast.error("Error saving TOS. Please check your input or try again.");
      } 

    } finally {
      setGeneratingTOS(false); 
      setShowTOSFormModal(false);
    }
  }; 

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
      <ToastContainer position="top-right" autoClose={4000} theme="colored" /> 

      {/* Generating overlay — matches SyllabusView style */}
      {generatingTOS && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" />
            <span className="text-white text-lg font-semibold">Generating TOS</span>
          </div>
        </div>
      )}
      
      <main className="p-4 mt-5  flex justify-center">
        <div className="p-6 shadow bg-white rounded-lg border border-gray-200 w-full max-w-6xl">
          <h1 className="font-bold text-4xl text-[#201B50] mb-4 text-left">List of TOS</h1> 

          <div className="flex gap-4 mb-4">
            <Button className="rounded-sm bg-[#007BFF]" onClick={handleOpenSyllabiModal}>
              Generate TOS
            </Button>
          </div>

          {/* ========== First Modal: Approved Syllabi Selection ========== */}
          <Modal show={showSyllabiModal} dismissible onClose={() => setShowSyllabiModal(false)} size="lg">
            <ModalHeader>Select Approved Syllabus</ModalHeader>
            <ModalBody>
              <div className="divide-y">
                {syllabi.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 dark:hover:bg-gray-600 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleSelectSyllabus(s)}
                  >
                    <p className="font-semibold dark:text-white">
                      {s.bayanihan_group.course.course_code} - {s.bayanihan_group.course.course_title}
                    </p>
                    <p className="text-sm dark:text-white">
                      Version {s.version} | SY {s.bayanihan_group.school_year} | {s.bayanihan_group.course.course_semester.toLowerCase()} Semester
                    </p>
                  </div>
                ))}
                {syllabi.length === 0 && <p className="text-gray-500">No approved syllabi available.</p>}
              </div>
            </ModalBody>
          </Modal>
          
          {/* ========== Second Modal: TOS Form ========== */}
          <Modal show={showTOSFormModal} onClose={() => setShowTOSFormModal(false)} size="3xl">
            <ModalHeader className="text-xl font-semibold">
              Create Table of Specifications (TOS)
            </ModalHeader>

            <ModalBody className="space-y-6">

              {/* Course Information — Read Only */}
              {selectedSyllabus && (
                <div className="rounded-lg border-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-lg">
                    Course Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Course Code</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSyllabus.bayanihan_group.course.course_code}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Course Title</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSyllabus.bayanihan_group.course.course_title}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">School Year</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSyllabus.bayanihan_group.school_year}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-300">Semester</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSyllabus.bayanihan_group.course.course_semester}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TOS Details Inputs */}
              <div className="rounded-lg border-2 p-4 bg-white dark:bg-gray-900 dark:border-gray-700 space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg text-center">
                  TOS Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Select Term
                    </label>
                    <select
                      name="term"
                      value={tosForm.term}
                      onChange={handleFormChange}
                      className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      required
                    >
                      <option value="">Select Term</option>
                      <option value="MIDTERM">Midterm</option>
                      <option value="FINALS">Finals</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Total Test Items
                    </label>
                    <input
                      type="number"
                      name="total_items"
                      placeholder="Total No. of Test Items"
                      min="0"
                      value={tosForm.total_items}
                      onChange={handleFormChange}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>

                  <div className="flex flex-col col-span-2">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Curricular Program / Year level / Section
                    </label>
                    <input
                      type="text"
                      name="tos_cpys"
                      placeholder="Curricular Program / Year / Section"
                      value={tosForm.tos_cpys}
                      onChange={handleFormChange}
                      className="col-span-2 border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>

                {/* Topic Selection */}
                {tosForm.term && selectedSyllabus?.course_outlines && (
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700 dark:text-gray-200">
                      Select Topics ({tosForm.term})
                    </label>

                    <div className="border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-3 max-h-48 overflow-y-auto space-y-2">
                      {Array.isArray(selectedSyllabus.course_outlines)
                        ? (() => {
                            const outlines = selectedSyllabus.course_outlines.filter(
                              (co) => co.syllabus_term === tosForm.term
                            );

                            if (outlines.length === 0)
                              return <p className="text-gray-500">No course outlines available.</p>;

                            return outlines.map((co) => (
                              <label key={co.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedTopics.includes(co.topics)}
                                  onChange={() => handleTopicToggle(co.topics)}
                                />
                                <span>{co.topics}</span>
                              </label>
                            ));
                          })()
                        : <p className="text-gray-500">No course outlines available.</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Cognitive Levels */}
              <div className="rounded-lg border-2 p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg text-center">
                  Cognitive Levels (in %)
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-3">  
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Knowledge (Max 50%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="col1_percentage"
                        placeholder="Knowledge (Max 50%)"
                        min="0"
                        value={tosForm.col1_percentage}
                        onChange={handleFormChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Comprehension
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="col2_percentage"
                        placeholder="Comprehension"
                        min="0"
                        value={tosForm.col2_percentage}
                        onChange={handleFormChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Application / Analysis
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="col3_percentage"
                        placeholder="Application"
                        min="0"
                        value={tosForm.col3_percentage}
                        onChange={handleFormChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Synthesis / Evaluation
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="col4_percentage"
                        placeholder="Synthesis / Evaluation"
                        min="0"
                        value={tosForm.col4_percentage}
                        onChange={handleFormChange}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div> 
                </div>

                {/* Validation */}
                {Number(tosForm.col1_percentage) > 50 && (
                  <p className="text-red-500 mt-2">Knowledge cannot exceed 50%.</p>
                )}
                {(() => {
                  const total =
                    Number(tosForm.col1_percentage) +
                    Number(tosForm.col2_percentage) +
                    Number(tosForm.col3_percentage) +
                    Number(tosForm.col4_percentage);

                  if (total > 100)
                    return <p className="text-red-500 mt-2">Total cannot exceed 100%. (Current: {total}%)</p>;

                  if (total < 100)
                    return <p className="text-red-500 mt-2">Total must equal 100%. (Current: {total}%)</p>;

                  return null;
                })()}

                {formError && <p className="text-red-600 mt-2">{formError}</p>}
              </div>

            </ModalBody>

            <ModalFooter>
              <Button onClick={(e) => handleCreateTOS(e)} disabled={generatingTOS}>{generatingTOS ? "Creating TOS..." : "Create TOS" }</Button>
              <Button color="gray" onClick={() => setShowTOSFormModal(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal> 

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
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-gray-600 shadow-lg mb-8">
                <thead className="text-xs uppercase bg-[#6697e5] text-white text-left">
                  <tr>
                    <th className="pl-2 rounded-tl-sm">Course</th>
                    <th className="pl-2">School Year</th>
                    <th className="pl-2">Semester</th>
                    <th className="pl-2">Term</th>
                    <th className="pl-2">Submitted At</th>
                    <th className="pl-2">Approved At</th>
                    <th className="pl-2">Version</th>
                    <th className="text-center">Status</th>
                    <th className="px-6 py-3 rounded-tr-sm text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="w-full text-left divide-y divide-gray-200 text-[14px] font-semibold">
                  {TOS.map((tos) => (
                    <tr
                      key={tos.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="font-bold pl-2 py-4">{`${tos.bayanihan_group.course.course_code} - ${tos.bayanihan_group.course.course_title}`}</td>
                      <td className="pl-2">{tos.bayanihan_group.school_year}</td>
                      <td className="pl-2">{tos.bayanihan_group.course.course_semester.toLowerCase()}</td>
                      <td className="pl-2">{tos.term}</td>
                      <td className="pl-2">
                        {tos.chair_submitted_at ? formatListDate(tos.chair_submitted_at) : "—"} 
                      </td>
                      <td className="pl-2">
                        {tos.chair_approved_at ? formatListDate(tos.chair_approved_at) : "—"} 
                      </td>
                      <td className="pl-2">Version {tos.version}</td>
                      <td className="pl-2 text-center">
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
                      <td className="text-center">
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
                {currentPage} / {totalPages || 1}
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