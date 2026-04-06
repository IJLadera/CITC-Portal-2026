import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Select,
  Button,
  Spinner,
  TextInput,
} from "flowbite-react";
import { PencilSquareIcon, TrashIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify"; 
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { Plus } from "lucide-react";
import { FaUser, FaUsers } from "react-icons/fa";
import type { Program } from "@/types/academic";
import ConfirmDialog from "@/components/ConfirmDialog";

// Types
type Course = {
  id: number;
  course_code: string;
  course_title: string;
  course_semester: string;
};

type User = {
  id: number;
  faculty_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

type Member = {
  id: number;
  user: User;
  role: "LEADER" | "TEACHER";
};

type BayanihanGroup = {
  id: number;
  school_year: string;
  course: Course;
  bayanihan_members: Member[];

  created_at: string;
  updated_at: string;
};

type FormData = {
  school_year: string;
  course_id: number;
  leader_ids: number[];
  teacher_ids: number[];
};

export default function BayanihansList() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [groups, setGroups] = useState<BayanihanGroup[]>([]);
  const [program, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BayanihanGroup | null>(null);
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    school_year: "",
    course_id: 0,
    leader_ids: [],
    teacher_ids: [],
  }); 

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    faculty_id: "",
    username: "", 
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    prefix: "",
    suffix: "",
    phone: "",
  });
  const [teacherErrors, setTeacherErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filters
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedSemester, setSelectedSemester] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 

  // Fetch groups, courses, and teachers together and show loading overlay
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
        if (selectedYear !== "All") params.school_year = selectedYear;
        if (selectedSemester !== "All") params.semester = selectedSemester;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const [groupsRes, programRes] = await Promise.all([
          api.get("/bayanihan/groups/", { params }),
          api.get("/academics/programs/", { params: { role, all: true } }), 
        ]);

        if (!mounted) return;

        // ✅ Adapt for new paginated response
        const data = groupsRes.data;
        setGroups(data.groups || []);
        setTotalPages(data.total_pages || 1);
        setPrograms(programRes.data); 
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [currentPage, selectedYearLevel, selectedProgram, selectedSemester, searchTerm, selectedYear]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.school_year) errors.school_year = "School year is required.";
    if (!formData.course_id) errors.course_id = "Course selection is required.";
    if (formData.leader_ids.length === 0) errors.leader_ids = "At least one leader is required."; 
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegistrationForm = () => {
    const errors: Record<string, string> = {};
    if (!teacherForm.faculty_id.trim()) errors.faculty_id = "Teacher ID is required.";
    if (!teacherForm.username.trim()) errors.username = "Teacher username is required.";
    if (!teacherForm.first_name.trim()) errors.first_name = "Teacher's first name is required.";
    if (!teacherForm.last_name.trim()) errors.last_name = "Teacher's last name is required.";
    if (!teacherForm.email.trim()) errors.email = "Teacher's email is required.";
    if (!teacherForm.phone.trim()) errors.phone = "Teacher's phone number is required."; 
    if (!teacherForm.password.trim()) errors.password = "Password is required."; 
    setTeacherErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeacherForm({ ...teacherForm, [e.target.name]: e.target.value });
  };

  const displayName = (u: User) => `${u.first_name} ${u.last_name}`.trim() || u.email;

  const handleOpenModal = async (group?: BayanihanGroup) => {
    setFormErrors({});
    setModalLoading(true);

    try {
      // Fetch users (teachers) and courses
      const [coursesRes, teachersRes] = await Promise.all([
        api.get("/academics/courses/", { params: { role, all: true } }),
        api.get("/users/", { params: { all: true } }),
      ]);

      setCourses(coursesRes.data || []);
      setTeachers(teachersRes.data);

      if (group) {
        setEditMode(true);
        setSelectedGroup(group);
        setFormData({
          school_year: group.school_year,
          course_id: group.course.id,
          leader_ids: group.bayanihan_members.filter(m => m.role === "LEADER").map(m => m.user.id),
          teacher_ids: group.bayanihan_members.filter(m => m.role === "TEACHER").map(m => m.user.id),
        });
      } else {
        setEditMode(false);
        setSelectedGroup(null);
        setFormData({ school_year: "", course_id: 0, leader_ids: [], teacher_ids: [] });
      }
      setOpenModal(true); 
    } catch (err: any) {
      console.error("Error loading modal data", err);
      toast.error("Failed to load courses or users.");
    } finally {
      setModalLoading(false);
    }
  }; 
 
  const handleOpenTeacherModal = async () => {
    setTeacherErrors({});  
    setModalLoading(true);

    try {
      // Fetch courses and teachers only when opening modal
      const teachersRes = await api.get("/users/", { params: { all: true } });
 
      setTeachers(teachersRes.data);

      setTeacherForm({ 
        faculty_id: "",
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        prefix: "",
        suffix: "",
        phone: "",
      }); 
      setShowTeacherModal(true);
    } catch (err) {
      console.error("Error loading teacher modal data", err);
      toast.error("Failed to load users.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSave = async () => {
    setShowConfirm(false);
    if (!validateForm()) return;

    try {
      setCreating(true);
      const payload = { ...formData };
      if (editMode && selectedGroup) {
        await api.put(`/bayanihan/groups/${selectedGroup.id}/`, payload); 
        toast.success("Group updated successfully!");
      } else {
        await api.post("/bayanihan/groups/", payload); 
        toast.success("Group created successfully!");
      } 
 
      const res = await api.get("/bayanihan/groups/", { params: { role, page: currentPage, page_size: 5 } });  
      const data = res.data;
      setGroups(data.groups || []); 
      setTotalPages(data.total_pages || 1); 

    } catch (err: any) {
      console.error("Error saving bayanihan group", err);
 
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
        toast.error("Error saving group. Please check your input or try again.");
      }
    } finally {
      setOpenModal(false);
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await api.delete(`/bayanihan/groups/${id}/`);
      setGroups(groups.filter(g => g.id !== id));
      toast.success("Group deleted successfully!");

    } catch (err: any) {
      console.error("Error deleting Bayanihan Group", err);
 
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
        toast.error("Error deleting group. Please check your Network or try again.");
      }
    }
  }; 

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();  
    if (!validateRegistrationForm()) return;

    try {
      setSubmitting(true);
      await api.post("/register/", teacherForm);
      toast.success("Teacher registered successfully!");  

      // Refresh teachers list after creation
      const res = await api.get("/users/", { params: { all: true } });
      setTeachers(res.data);
      setShowTeacherModal(false);

    } catch (err: any) {
      console.error("Error creating Teacher", err);
 
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
        toast.error("Error creating Teacher. Please check your Network or try again.");
      }

    } finally {
      setSubmitting(false);
    }
  };
  
  // Derive available school years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(groups.map((g) => g.school_year)));
    return years.sort((a, b) => b.localeCompare(a)); // descending
  }, [groups]);

  return ( 
    <div className="flex-1 flex flex-col"> 
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar theme="colored" />

      {/* Bayanihan Group Modal */}
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)} size="lg">
        <ModalHeader>
          {editMode ? "Edit Group" : "Create Group"}
        </ModalHeader>
        <ModalBody>
          {modalLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* School Year */}
              <div className="">
                <Label htmlFor="school_year">School Year *</Label>
                <Select
                  id="school_year"
                  value={formData.school_year}
                  onChange={(e) =>
                    setFormData({ ...formData, school_year: e.target.value })
                  }
                  required
                >
                  <option value="">Select...</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                  <option value="2029-2030">2029-2030</option>
                </Select>
                {formErrors.school_year && <p className="text-red-500 text-sm mt-1">{formErrors.school_year}</p>}
              </div>

              {/* Course */}
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select
                  id="course"
                  value={formData.course_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_id: Number(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code} - {c.course_title}
                    </option>
                  ))}
                </Select>
                {formErrors.course_id && <p className="text-red-500 text-sm mt-1">{formErrors.course_id}</p>}
              </div> 
              
              <MultiSelectDropdown
                label="Leaders"
                selectedIds={formData.leader_ids}
                users={teachers}
                excludeIds={formData.teacher_ids} // 👈 Hide teachers here
                onAdd={(id) => setFormData((p) => ({ ...p, leader_ids: [...p.leader_ids, id] }))}
                onRemove={(id) =>
                  setFormData((p) => ({ ...p, leader_ids: p.leader_ids.filter((uid) => uid !== id) }))
                }
              />
              {formErrors.leader_ids && <p className="text-red-500 text-sm">{formErrors.leader_ids}</p>}

              <MultiSelectDropdown
                label="Teachers"
                selectedIds={formData.teacher_ids}
                users={teachers}
                excludeIds={formData.leader_ids} // 👈 Hide leaders here
                onAdd={(id) => setFormData((p) => ({ ...p, teacher_ids: [...p.teacher_ids, id] }))}
                onRemove={(id) =>
                  setFormData((p) => ({ ...p, teacher_ids: p.teacher_ids.filter((uid) => uid !== id) }))
                }
              />
              {formErrors.teacher_ids && <p className="text-red-500 text-sm">{formErrors.teacher_ids}</p>} 
            </div>
          )}
        </ModalBody>
        <ModalFooter> 
          <Button onClick={() => setShowConfirm(true)} disabled={creating}>
            {creating
              ? editMode
                ? "Updating..."
                : "Creating..."
              : editMode
              ? "Update"
              : "Create"}
          </Button> 
          <Button color="alternative" onClick={() => setOpenModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
                      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Create Bayanihan Group?"
        message="Once you create, you might not be able to edit or delete it anymore."
        confirmText="Yes, Create"
        doubleConfirm={false}
        onConfirm={handleSave}
        onClose={() => setShowConfirm(false)}
      />

      {/* 🔹 Add Teacher Modal */}
      <Modal dismissible show={showTeacherModal} onClose={() => setShowTeacherModal(false)} size="xl">
        <ModalHeader>Add Bayanihan Teacher</ModalHeader>
        <ModalBody> 
          {modalLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="xl" />
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleRegisterTeacher}>
              <div>
                <div>
                  <Label>Username</Label>
                  <input
                    name="username"
                    value={teacherForm.username}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  {teacherErrors.username && <p className="text-red-500 text-sm mt-1">{teacherErrors.username}</p>}
                </div>
                <div>
                  <Label>Faculty ID</Label>
                  <input
                    name="faculty_id"
                    value={teacherForm.faculty_id}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  {teacherErrors.faculty_id && <p className="text-red-500 text-sm mt-1">{teacherErrors.faculty_id}</p>} 
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <input
                    name="first_name"
                    value={teacherForm.first_name}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  {teacherErrors.first_name && <p className="text-red-500 text-sm mt-1">{teacherErrors.first_name}</p>}
                </div>
                <div>
                  <Label>Last Name</Label>
                  <input
                    name="last_name"
                    value={teacherForm.last_name}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  {teacherErrors.last_name && <p className="text-red-500 text-sm mt-1">{teacherErrors.last_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prefix</Label>
                  <input
                    name="prefix"
                    value={teacherForm.prefix}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                  />
                </div>
                <div>
                  <Label>Suffix</Label>
                  <input
                    name="suffix"
                    value={teacherForm.suffix}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <input
                  type="email"
                  name="email"
                  value={teacherForm.email}
                  onChange={handleTeacherChange}
                  className="border p-2 w-full rounded"
                  required
                />
                  {teacherErrors.email && <p className="text-red-500 text-sm mt-1">{teacherErrors.email}</p>}
              </div>

              <div>
                <Label>Phone</Label>
                <input
                  name="phone"
                  value={teacherForm.phone}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setTeacherForm({ ...teacherForm, phone: numericValue });
                  }}
                  className="border p-2 w-full rounded"
                  inputMode="numeric"
                  required
                />
                  {teacherErrors.phone && <p className="text-red-500 text-sm mt-1">{teacherErrors.phone}</p>}
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={teacherForm.password}
                    onChange={handleTeacherChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>  
                </div> 
                {teacherErrors.username && <p className="text-red-500 text-sm mt-1">{teacherErrors.username}</p>}
              </div>
            </form>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleRegisterTeacher} disabled={submitting}>
            {submitting ? "Registering..." : "Register"}
          </Button> 
          <Button color="alternative" onClick={() => setShowTeacherModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
 
      <div className="mx-auto mt-5 shadow w-[95%] rounded-lg bg-white p-6">
        {/* Header Section */}
        <div className="mb-4">
          {/* Top Row: Title (left) + Buttons (right) */}
          <div className="flex justify-between items-center w-full">
            {/* Title */}
            <h1 className="text-xl font-bold">Bayanihan Groups</h1>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Add Teacher */}
              <div className="relative group">
                <Button
                  className="bg-[#007BFF] w-15 px-2 m-0 gap-2"
                  onClick={() => handleOpenTeacherModal()}
                >
                  <Plus size={15} />
                  <FaUser size={15} />
                </Button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md z-50">
                  Add Teacher
                </span>
              </div>

              {/* Add Bayanihan Team */}
              <div className="relative group">
                <Button
                  className="bg-[#007BFF] w-15 px-2 m-0 gap-2"
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={15} />
                  <FaUsers size={20} />
                </Button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-2 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap shadow-md z-50">
                  Create Bayanihan Team
                </span>
              </div>
            </div>
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
                <option value="All">All Semesters</option>
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
                <option value="All">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg">
          <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                <Spinner size="xl" />
              </div>
            )}  
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-[#007BFF] text-white">
                  <th className="p-2">School Year</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Leaders</th>
                  <th className="p-2">Teachers</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No bayanihan groups found.
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{g.school_year}</td>
                      <td className="border border-gray-300 px-4 py-2">{g.course.course_code} - {g.course.course_title}</td>
                      <td className="border border-gray-300 p-2 align-top">
                        {g.bayanihan_members
                          .filter((m) => m.role === "LEADER")
                          .map((m) => (
                            <div key={m.id} className="leading-tight">
                              {displayName(m.user)}
                            </div>
                          ))}
                      </td>
                      <td className="border border-gray-300 p-2 align-top">
                        {g.bayanihan_members
                          .filter((m) => m.role === "TEACHER")
                          .map((m) => (
                            <div key={m.id} className="leading-tight">
                              {displayName(m.user)}
                            </div>
                          ))}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(g)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center justify-center"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(g.id)}
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
  );
}
