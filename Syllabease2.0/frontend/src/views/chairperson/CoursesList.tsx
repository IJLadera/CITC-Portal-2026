import { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  TextInput,
  Select,
  Button,
  Spinner,
} from "flowbite-react";
import api from "../../api";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import type { Program } from "@/types/academic";

// Types
type Department = {
  id: number;
  department_code: string;
  department_name: string;
};

type Curriculum = {
  id: number;
  curr_code: string;
  effectivity: string;
  department: Department;
};

type Course = {
  id: number;
  course_title: string;
  course_code: string;
  course_unit_lec: number;
  course_unit_lab: number;
  course_credit_unit: number;
  course_hrs_lec: number;
  course_hrs_lab: number;
  course_pre_req: string;
  course_co_req: string;
  course_year_level: string;
  course_semester: string;
  curriculum: Curriculum;
};

export default function CoursePage() { 
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();  

  const [courses, setCourses] = useState<Course[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    curriculum_id: 0,
    course_title: "",
    course_code: "",
    course_unit_lec: 0,
    course_unit_lab: 0,
    course_credit_unit: 0,
    course_hrs_lec: 0,
    course_hrs_lab: 0,
    course_pre_req: "",
    course_co_req: "",
    course_year_level: "1",
    course_semester: "1ST",
  }); 

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All"); 

  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch courses and curricula together and show loading overlay
  useEffect(() => {
    let mounted = true;
    const load = async () => {
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
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const [coursesRes, programRes, curriculaRes] = await Promise.all([
          api.get("/academics/courses/", { params }),
          api.get("/academics/programs/", { params: { role, all: true } }),
          api.get("/academics/curricula/", { params: { role: role } }),
        ]);

        if (!mounted) return;

        // ✅ Adapt for new paginated response
        const data = coursesRes.data;
        setCourses(data.items || []);
        setTotalPages(data.total_pages || 1);  
        setPrograms(programRes.data);
        setCurricula(curriculaRes.data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentPage, selectedYearLevel, selectedProgram, selectedSemester, searchTerm]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.curriculum_id) errors.curriculum_id = "Curriculum is required.";
    if (!formData.course_title.trim()) errors.course_title = "Course title is required.";
    if (!formData.course_code.trim()) errors.course_code = "Course code is required.";
    if (formData.course_unit_lec === 0 && formData.course_unit_lab === 0)
      errors.course_unit_lec = "At least one unit (lecture or lab) is required.";
    if (formData.course_credit_unit === 0)
      errors.course_credit_unit = "Credit units are required.";
    if (formData.course_hrs_lec === 0 && formData.course_hrs_lab === 0)
      errors.course_hrs_lec = "At least one hour (lecture or lab) is required.";
    if (!formData.course_year_level) errors.course_year_level = "Course year level is required.";
    if (!formData.course_semester) errors.course_semester = "Course semester is required."; 

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (course?: Course) => {
    setFormErrors({});
    if (course) {
      // Edit mode
      setEditMode(true);
      setSelectedCourse(course);
      setFormData({
        curriculum_id: course.curriculum.id,
        course_title: course.course_title,
        course_code: course.course_code,
        course_unit_lec: course.course_unit_lec,
        course_unit_lab: course.course_unit_lab,
        course_credit_unit: course.course_credit_unit,
        course_hrs_lec: course.course_hrs_lec,
        course_hrs_lab: course.course_hrs_lab,
        course_pre_req: course.course_pre_req || "None",
        course_co_req: course.course_co_req || "None",
        course_year_level: course.course_year_level,
        course_semester: course.course_semester,
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedCourse(null);
      setFormData({
        curriculum_id: 0,
        course_title: "",
        course_code: "",
        course_unit_lec: 0,
        course_unit_lab: 0,
        course_credit_unit: 0,
        course_hrs_lec: 0,
        course_hrs_lab: 0,
        course_pre_req: "",
        course_co_req: "",
        course_year_level: "1",
        course_semester: "1ST",
      });
    }
    setOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; // stop if there are validation errors

    try {
      const normalizedData = {
        ...formData,
        course_pre_req: formData.course_pre_req.trim() || "None",
        course_co_req: formData.course_co_req.trim() || "None",
      };
      if (editMode && selectedCourse) {
        await api.put(
          `/academics/courses/${selectedCourse.id}/`,
          normalizedData
        ); 
        toast.success("Course updated successfully!");
      } else {
        await api.post("/academics/courses/", normalizedData); 
        toast.success("Course created successfully!");
      }
 
      const res = await api.get("/academics/courses/", { params: { role, page: currentPage, page_size: 5 } });  
      const data = res.data;
      setCourses(data.items || []); 
      setTotalPages(data.total_pages || 1); 
      setOpenModal(false);

    } catch (err: any) {
      console.error("Error saving course:", err);
 
      if (err.response && err.response.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          // DRF validation errors (field: [message])
          for (const [field, messages] of Object.entries(data)) {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${field}: ${msg}`));
            } else if (typeof messages === "string") {
              toast.error(`${field}: ${messages}`);
            }
          }
        } else if (typeof data === "string") {
          // Simple string message
          toast.error(data);
        } else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Failed to save course. Please check your network.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/academics/courses/${id}/`);
      setCourses(courses.filter((c) => c.id !== id));
      toast.success("Course deleted successfully!");
    } catch (err) {
      console.error("Error deleting course", err);
      toast.error("Failed to delete course.");
    }
  };

  const yearMap: Record<string, string> = {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
    "4": "4th",
    "5": "5th",
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />

      {/* Modal */}
      <Modal
        dismissible
        show={openModal}
        onClose={() => setOpenModal(false)}
      >
        <ModalHeader>
          {editMode ? "Edit Course" : "Create Course"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Curriculum */}
            <div>
              <Label htmlFor="curriculum">Curriculum</Label>
              <Select
                id="curriculum"
                value={formData.curriculum_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    curriculum_id: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>Select Curriculum</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.curr_code} - {c.effectivity}
                  </option>
                ))}
              </Select>
              {formErrors.curriculum_id && (
                <p className="text-red-500 text-sm mt-1">{formErrors.curriculum_id}</p>
              )}
            </div>

            {/* Course Info */}
            <div>
              <Label htmlFor="course_code">Course Code</Label>
              <TextInput
                id="course_code"
                value={formData.course_code}
                onChange={(e) =>
                  setFormData({ ...formData, course_code: e.target.value })
                }
                required
              />
              {formErrors.course_code && (
                <p className="text-red-500 text-sm mt-1">{formErrors.course_code}</p>
              )}
            </div>
            <div>
              <Label htmlFor="course_title">Course Title</Label>
              <TextInput
                id="course_title"
                value={formData.course_title}
                onChange={(e) =>
                  setFormData({ ...formData, course_title: e.target.value })
                } 
              />
              {formErrors.course_title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.course_title}</p>
              )}
            </div>

            {/* Units & Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course_unit_lec">Lecture Units</Label>
                <TextInput
                  type="number"
                  id="course_unit_lec"
                  value={formData.course_unit_lec}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_unit_lec: Number(e.target.value),
                    })
                  }
                />
                {formErrors.course_unit_lec && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_unit_lec}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course_unit_lab">Lab Units</Label>
                <TextInput
                  type="number"
                  id="course_unit_lab"
                  value={formData.course_unit_lab}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_unit_lab: Number(e.target.value),
                    })
                  }
                />
                {formErrors.course_unit_lec && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_unit_lec}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course_credit_unit">Credit Units</Label>
                <TextInput
                  type="number"
                  id="course_credit_unit"
                  value={formData.course_credit_unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_credit_unit: Number(e.target.value),
                    })
                  }
                />
                {formErrors.course_credit_unit && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_credit_unit}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course_hrs_lec">Lecture Hours</Label>
                <TextInput
                  type="number"
                  id="course_hrs_lec"
                  value={formData.course_hrs_lec}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_hrs_lec: Number(e.target.value),
                    })
                  }
                />
                {formErrors.course_hrs_lec && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_hrs_lec}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course_hrs_lab">Lab Hours</Label>
                <TextInput
                  type="number"
                  id="course_hrs_lab"
                  value={formData.course_hrs_lab}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_hrs_lab: Number(e.target.value),
                    })
                  }
                />
                {formErrors.course_hrs_lec && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_hrs_lec}</p>
                )}
              </div>
            </div>

            {/* Pre-req and Co-req */}
            <div>
              <Label htmlFor="course_pre_req">Pre-requisite</Label>
              <TextInput
                id="course_pre_req"
                value={formData.course_pre_req}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    course_pre_req: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="course_co_req">Co-requisite</Label>
              <TextInput
                id="course_co_req"
                value={formData.course_co_req}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    course_co_req: e.target.value,
                  })
                }
              />
            </div>

            {/* Year Level & Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course_year_level">Year Level</Label>
                <Select
                  id="course_year_level"
                  value={formData.course_year_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_year_level: e.target.value,
                    })
                  }
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </Select>
                {formErrors.course_year_level && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_year_level}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course_semester">Semester</Label>
                <Select
                  id="course_semester"
                  value={formData.course_semester}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_semester: e.target.value,
                    })
                  }
                >
                  <option value="1ST">1st Semester</option>
                  <option value="2ND">2nd Semester</option>
                  <option value="SUMMER">Summer</option>
                </Select>
                {formErrors.course_semester && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.course_semester}</p>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSave}>
            {editMode ? "Update" : "Create"}
          </Button>
          <Button color="alternative" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6"> 

          {/* Course Create Button */}
          <div className="mb-4"> 
            <div className="flex justify-between items-center w-full">
              <h1 className="text-xl font-bold">Courses</h1>
              <Button className="bg-[#007BFF]" onClick={() => handleOpenModal()}>
                + Create Course
              </Button>
            </div> 

            {/* Bottom Row: Filters */}
            <div className="flex flex-nowrap gap-2 items-center mt-4 justify-between overflow-x-auto px-2 scrollbar-hide"> 
              {/* Search */}
              <TextInput
                type="text"
                placeholder="Search course..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-70"
              />

              <div className="flex gap-3 items-center"> 
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
                  {programs.map((pr) => (
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
                  <option value="All">All Semesters</option>
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </Select> 
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-lg"> 
            <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                  <Spinner size="xl" />
                </div>
              )} 
              <table className="w-full">
                <thead>
                  <tr className="bg-[#007BFF] text-white text-sm w-full border border-radius-sm">
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Year & Sem</th> 
                    <th className="p-2 text-left">Units (Lec/Lab)</th>
                    <th className="p-2 text-left">Credit</th>
                    <th className="p-2 text-left">Hours (Lec/Lab)</th>
                    <th className="p-2 text-left">Curriculum</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody> 
                  {courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-6 text-gray-500 italic"
                      >
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="border border-gray-300 p-2">{c.course_code}</td>
                        <td className="border border-gray-300 p-2">{c.course_title}</td>
                        <td className="border border-gray-300 p-2">{yearMap[c.course_year_level] || ""} Year - {c.course_semester.toLowerCase()} Semester</td>
                        <td className="border border-gray-300 p-2">
                          {c.course_unit_lec}/{c.course_unit_lab}
                        </td>
                        <td className="border border-gray-300 p-2">{c.course_credit_unit}</td>
                        <td className="border border-gray-300 p-2">
                          {c.course_hrs_lec}/{c.course_hrs_lab}
                        </td> 
                        <td className="border border-gray-300 p-2">
                          {c.curriculum.curr_code} - {c.curriculum.effectivity}
                        </td>
                        <td className="border border-gray-300 p-2 flex gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(c)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center justify-center"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center justify-center"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4 gap-4">
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
