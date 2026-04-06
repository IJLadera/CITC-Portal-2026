import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
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
import { ChevronDown, GraduationCap, Target } from "lucide-react";  
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import { FaGraduationCap } from "react-icons/fa";

type College = {
  id: number; 
  college_code: string;
  college_description: string;
  college_status: "Active" | "Inactive";
};

type Department = {
  id: number; 
  department_code: string;
  department_name: string; 
  department_status: "Active" | "Inactive";
  college: College; 
  showMenu?: boolean; // new
};

type Chairperson = {
  id: number;
  user: {
    id: number;
    prefix: string
    first_name: string;
    last_name: string;
    suffix: string;
    email: string;
  };
  entity_id: number;
  entity_name: string;
  start_validity: string;
  end_validity: string;
};

type User = {
  id: number;
  user_roles: {
    id: number;
    start_validity: string;
    end_validity: string;
    role: { 
      name: string; 
    }
  };
  prefix: string
  first_name: string;
  last_name: string;
  suffix: string;
  email: string;
  phone: string;
};

export default function DepartmentsPage() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [chairpersons, setChairpersons] = useState<Chairperson[]>([]); 
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openChairModal, setOpenChairModal] = useState(false);

  const [editMode, setEditMode] = useState(false); 
  const [editChairMode, setEditChairMode] = useState(false); 
  
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedChair, setSelectedChair] = useState<Chairperson | null>(null);
  
  const [departmentFormErrors, setDepartmentFormErrors] = useState<Record<string, string>>({});
  const [chairFormErrors, setChairFormErrors] = useState<Record<string, string>>({});

  // Dropdown actions
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [savingChair, setSavingChair] = useState(false);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    department_code: "",
    department_name: "", 
    department_status: "Active" as "Active" | "Inactive",
    college_id: 0,
  });

  const [chairForm, setChairForm] = useState({
    user_id: 0,
    entity_id: 0,
    start_validity: "",
    end_validity: "",
  });
   
  // --- Department pagination state ---
  const [currentDeptPage, setCurrentDeptPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Chairpersons pagination
  const [chairPage, setChairPage] = useState(1);
  const chairsPerPage = 5;
  const totalChairPages = Math.ceil(chairpersons.length / chairsPerPage);
  const paginatedChairs = chairpersons.slice(
    (chairPage - 1) * chairsPerPage,
    chairPage * chairsPerPage
  );

  // Fetch curricula and departments together and show loading overlay
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try { 
        setLoading(true);
        const res = await api.get("/academics/departments/", { params: { role, page: currentDeptPage, page_size: 5 } });

        if (!mounted) return;

        // ✅ Adapt for new paginated response
        const data = res.data;
        setDepartments(data.items || []); 
        setTotalPages(data.total_pages || 1); 
      } catch (err) {
        console.error(err); 
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [currentDeptPage]);  

  // Fetch colleges for dropdown
  useEffect(() => {
    api.get(`/academics/colleges/?all=true`)
      .then(res => setColleges(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch current Chairpersons
  useEffect(() => {
    api.get(`/user-roles/assigned-roles/?role=CHAIRPERSON`)
    .then(res => setChairpersons(res.data))
    .catch(err => console.error(err));
  }, []);

  // Fetch All USERS
  useEffect(() => {
    api.get(`/users/`, { params: { all: true } })
    .then(res => setUsers(res.data))
    .catch(err => console.error(err));
  }, []);

  const validateDeptForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.college_id) errors.college_id = "College is required.";
    if (!formData.department_code.trim()) errors.department_code = "Department code is required.";
    if (!formData.department_name.trim()) errors.department_name = "Department name is required.";   

    setDepartmentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateChairForm = () => {
    const errors: Record<string, string> = {};

    if (!chairForm.user_id) errors.user_id = "User assignment is required.";
    if (!chairForm.entity_id) errors.entity_id = "Department assignment is required."; 

    setChairFormErrors(errors);
    return Object.keys(errors).length === 0;
  }; 

  const handleOpenDeptModal = (dept?: Department) => { 
    setDepartmentFormErrors({});
    if (dept) {
      setEditMode(true);
      setSelectedDepartment(dept);
      setFormData({
        department_code: dept.department_code,
        department_name: dept.department_name, 
        department_status: dept.department_status,
        college_id: dept.college.id,
      });
    } else {
      setEditMode(false);
      setSelectedDepartment(null);
      setFormData({
        department_code: "",
        department_name: "", 
        department_status: "Active",
        college_id: 0,
      });
    }
    setOpenModal(true);
  };

  const handleOpenChairModal = async (chair?: Chairperson) => { 
    setChairFormErrors({});  
    
    try {
      const res = await api.get("/academics/departments/", { params: { role, all: true } });
      const departmentsData = res.data.items || res.data; // handles paginated/non-paginated
      setAllDepartments(departmentsData);
 
      if (chair) {
        setEditChairMode(true);
        setSelectedChair(chair);
        setChairForm({
          user_id: chair.user.id,
          entity_id: allDepartments.find((d) => d.id === chair.entity_id)?.id || 0,
          start_validity: chair.start_validity || "",
          end_validity: chair.end_validity || "",
        });
      } else {
        setEditChairMode(false);
        setSelectedChair(null);
        setChairForm({ user_id: 0, entity_id: 0, start_validity: "", end_validity: "" });
      }

    } catch (err) {
      console.error("Error fetching all departments:", err);
      toast.error("Failed to load departments for Chairperson assignment.");
    }
    setOpenChairModal(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDeptForm()) return;
    
    try {
      if (editMode && selectedDepartment) {
        await api.put(`/academics/departments/${selectedDepartment.id}/`, formData, {
            params: { role: role }
          }
        ); 
        toast.success("Department updated successfully!");
      } else {
        await api.post("/academics/departments/", formData, {
            params: { role: role }
          }
        ); 
        toast.success("Department created successfully!");
      }
 
      const res = await api.get("/academics/departments/", { params: { role, page: currentDeptPage, page_size: 5 } });  
      const data = res.data;
      setDepartments(data.items || []); 
      setTotalPages(data.total_pages || 1); 
      setOpenModal(false); 

    } catch (err: any) {
      console.error("Error saving Department", err);
 
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
        toast.error("Failed to save department. Please check your network.");
      }
    }
  };
 
  const handleSaveChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateChairForm()) return;

    setSavingChair(true);

    try {
      const payload = {
        user_id: chairForm.user_id,
        role_name: "CHAIRPERSON",
        entity_id: chairForm.entity_id,
        start_validity: chairForm.start_validity || null,
        end_validity: chairForm.end_validity || null,
      };

      if (editChairMode && selectedChair) { 
        await api.put(`/user-roles/${selectedChair.id}/`, payload);
        toast.success("Chairperson assignment updated successfully!");
      } else { 
        await api.post("/user-roles/assign-role/", payload);
        toast.success("Chairperson assignment added successfully!");
      }

      const res = await api.get(`/user-roles/assigned-roles/?role=CHAIRPERSON`)
      setChairpersons(res.data);

      // reset form
      setOpenChairModal(false);
      setChairForm({ user_id: 0, entity_id: 0, start_validity: "", end_validity: "" });
      setSelectedChair(null);
      setEditChairMode(false);

    } catch (err: any) {
      console.error("Error saving Chairperson assignment", err);
 
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
        toast.error("Failed to save Chairperson assignment. Please check your network.");
      }
    } finally {
      setSavingChair(false); // stop spinner
    }
  };

  const handleDeptDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/academics/departments/${id}/`, {
      params: { role: role }
    });
      setDepartments(departments.filter((d) => d.id !== id));
      toast.success("Department deleted successfully!");
    } catch (err) {
      console.error("Error deleting Department", err);
      toast.error("Failed to delete Department.");
    }
  }; 

  const handleChairDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Chairperson assignment?")) return;
    try {
      await api.delete(`/user-roles/${id}/`);
      setChairpersons(chairpersons.filter((c) => c.id !== id));
      toast.success("Chairperson assignment deleted successfully!");
    } catch (err) {
      console.error("Error deleting Chairperson assignment", err);
      toast.error("Failed to delete Chairperson assignment.");
    }
  }; 

  // --- Dropdown Actions ---
  const openMenu = (id: number) => {
    const btn = buttonRefs.current[id];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = rect.right - 160;
    setMenuCoords({ top, left });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const clickedInside = Object.values(buttonRefs.current).some(
        (el) => el && el.contains(target)
      );
      if (!clickedInside) setOpenMenuId(null);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4">  
      <ToastContainer position="top-right" autoClose={5000} theme="colored" /> 

      {/* Department Modal */}
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
        <ModalHeader>{editMode ? "Edit Department" : "Create Department"}</ModalHeader> 

        <ModalBody>  
          <div className="space-y-4">
            <div>
              <Label htmlFor="department_code">Department Code</Label>
              <TextInput
                id="department_code"
                value={formData.department_code}
                onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                required
              />
              {departmentFormErrors.department_code && (
                <p className="text-red-500 text-sm mt-1">{departmentFormErrors.department_code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department_name">Department Name</Label>
              <TextInput
                id="department_name"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                required
              />
              {departmentFormErrors.department_name && (
                <p className="text-red-500 text-sm mt-1">{departmentFormErrors.department_name}</p>
              )}
            </div> 

            <div>
              <Label htmlFor="department_status">Status</Label>
              <Select
                id="department_status"
                value={formData.department_status}
                onChange={(e) =>
                  setFormData({ ...formData, department_status: e.target.value as "Active" | "Inactive" })
                }
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="college">College</Label>
              <Select
                id="college"
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: Number(e.target.value) })}
                required
              >
                <option value={0}>Select College</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.college_code} - {c.college_description}
                  </option>
                ))}
              </Select>
              {departmentFormErrors.college_id && (
                <p className="text-red-500 text-sm mt-1">{departmentFormErrors.college_id}</p>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleSaveDept}>{editMode ? "Update" : "Create"}</Button>
          <Button color="alternative" onClick={() => setOpenModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Departments Banner */}
      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Departments</h1>
            {/* Create button */}
            <Button className="mb-4 bg-[#007BFF]" onClick={() => handleOpenDeptModal()}>
              + Create Department
            </Button>
          </div>
        
          {/* Departments Table */}
          <div className="mt-4 overflow-x-hidden rounded-lg"> 
            <div className="mt-4 overflow-x-hidden rounded-lg relative min-h-[220px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                  <Spinner size="xl" />
                </div>
              )}  
              <table className="w-full max-h-64 overflow-y-auto">
                <thead>
                  <tr className="bg-[#007BFF] text-white text-sm">
                    <th className="p-2">Department Code</th>
                    <th className="p-2">Department Name</th> 
                    <th className="p-2">College</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border border-gray-300">
                      <td className="p-2 border border-gray-300">{dept.department_code}</td>
                      <td className="p-2 border border-gray-300">{dept.department_name}</td> 
                      <td className="p-2 border border-gray-300">{dept.college.college_description}</td>
                      <td className="p-2 border border-gray-300">{dept.department_status}</td>
                      <td className="p-2 flex justify-center items-center relative">
                        {/* Dropdown button */}
                        <div className="relative">
                          <button
                            ref={(el) => {
                              buttonRefs.current[dept.id] = el;
                            }}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              openMenu(dept.id);
                            }}
                            className="p-2 rounded hover:bg-gray-100"
                          >
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table> 

              {/* Dropdown Actions */}
              {openMenuId !== null && menuCoords && (
                <div
                  style={{
                    position: "fixed",
                    top: menuCoords.top,
                    left: menuCoords.left,
                    width: 180,
                  }}
                  className="bg-white rounded-md shadow-lg z-50 border overflow-hidden"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleOpenDeptModal(departments.find((x) => x.id === openMenuId)!)}
                      className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-yellow-100 flex items-center gap-2"
                    >
                      <PencilSquareIcon className="h-5 w-5 text-yellow-600" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeptDelete(openMenuId)}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 flex items-center gap-2"
                    >
                      <TrashIcon className="h-5 w-5 text-red-600" />
                      Delete
                    </button> 

                    <button
                      onClick={() => { 
                        navigate(`${openMenuId}/programs`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-100 flex items-center gap-2"
                    >
                      <FaGraduationCap className="h-5 w-5 text-blue-400" />
                      View Programs
                    </button>
                  </div>
                </div>
              )} 
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-4 gap-4">
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentDeptPage === 1}
                onClick={() => setCurrentDeptPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentDeptPage} of {totalPages || 1}
              </span>
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentDeptPage === totalPages}
                onClick={() => setCurrentDeptPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div> 

      {/* Chairperson Modal */}
      <Modal dismissible show={openChairModal} onClose={() => setOpenChairModal(false)}> 
        <ModalHeader>{editMode ? "Edit Chairperson Assignment" : "Assign Chairperson"}</ModalHeader> 
        <ModalBody>  
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select
                value={chairForm.user_id}
                onChange={(e) => setChairForm({ ...chairForm, user_id: Number(e.target.value) })}
              >
                <option value={0}>Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </Select>
              {chairFormErrors.user_id && (
                <p className="text-red-500 text-sm mt-1">{chairFormErrors.user_id}</p>
              )}
            </div>

            <div>
              <Label>Department</Label>
              <Select
                value={chairForm.entity_id}
                onChange={(e) => setChairForm({ ...chairForm, entity_id: Number(e.target.value) })}
              >
                <option value={0}>Select Department</option>
                {allDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </Select>
              {chairFormErrors.entity_id && (
                <p className="text-red-500 text-sm mt-1">{chairFormErrors.entity_id}</p>
              )}
            </div>

            <div>
              <Label>Start Validity</Label>
              <TextInput
                type="date"
                value={chairForm.start_validity}
                onChange={(e) => setChairForm({ ...chairForm, start_validity: e.target.value })}
              />
            </div>

            <div>
              <Label>End Validity</Label>
              <TextInput
                type="date"
                value={chairForm.end_validity}
                onChange={(e) => setChairForm({ ...chairForm, end_validity: e.target.value })}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
           <Button onClick={handleSaveChair} disabled={savingChair}>
              {savingChair ? (
                <Spinner size="sm" className="mr-2" />
              ) : null}
              {savingChair ? "Saving..." : "Save"}
            </Button>
          <Button color="alternative" onClick={() => setOpenChairModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
      
      {/* Chairpersons Banner */}
      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Department Chairpersons</h1>  
            <Button className="mb-4 bg-[#007BFF]" onClick={() => handleOpenChairModal()}>
              + Assign Chairperson
            </Button>
          </div>

          {/* Chairpersons Table */}
          <div className="mt-4 overflow-hidden rounded-lg"> 
            <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                  <Spinner size="xl" />
                </div>
              )}  
              <table className="w-full">
                <thead>
                  <tr className="bg-[#007BFF] text-white text-sm">
                    <th className="p2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Validity</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChairs.map((chair) => (
                    <tr key={chair.id} className="border border-gray-300">
                      <td className="p-2">
                        {chair.user.first_name} {chair.user.last_name}
                      </td>
                      <td className="p-2 border border-gray-300">{chair.user.email}</td>
                      <td className="p-2 border border-gray-300">{chair.entity_name}</td>
                      <td className="p-2 border border-gray-300">
                        {chair.start_validity || "—"} → {chair.end_validity || "—"}
                      </td>
                      <td className=" border-gray-300 p-2 flex gap-1 justify-center">
                        <Button
                          size="xs"
                          className="bg-yellow-500 text-white flex items-center justify-center"
                          onClick={() => handleOpenChairModal(chair)}
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          className="text-white flex items-center justify-center"
                          onClick={() => handleChairDelete(chair.id)}
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chairpersons Pagination */}
          <div className="flex justify-center items-center mt-4 gap-4">
            <Button
              className="bg-[#007BFF]"
              size="xs"
              disabled={chairPage === 1}
              onClick={() => setChairPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {chairPage} of {totalChairPages || 1}
            </span>
            <Button
              className="bg-[#007BFF]"
              size="xs"
              disabled={chairPage === totalChairPages}
              onClick={() => setChairPage((p) => Math.min(totalChairPages, p + 1))}
            >
              Next
            </Button>
          </div> 
        </div>
      </div>
    </div>
  );
}
