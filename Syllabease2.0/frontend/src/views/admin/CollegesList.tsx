import { useEffect, useState } from "react";
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
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import { useParams } from "react-router-dom";

type College = {
  id: number;
  college_code: string;
  college_description: string;
  college_status: "Active" | "Inactive";
};

type Dean = {
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

export default function CollegesPage() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [colleges, setColleges] = useState<College[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [deans, setDeans] = useState<Dean[]>([]); 
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openDeanModal, setOpenDeanModal] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editDeanMode, setEditDeanMode] = useState(false); 

  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedDean, setSelectedDean] = useState<Dean | null>(null); 
  
  const [collegeFormErrors, setCollegeFormErrors] = useState<Record<string, string>>({});
  const [deanFormErrors, setDeanFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    college_code: "",
    college_description: "",
    college_status: "Active" as "Active" | "Inactive",
  });

  const [deanForm, setDeanForm] = useState({
    user_id: 0,
    entity_id: 0,
    start_validity: "",
    end_validity: "",
  });

  // --- College pagination state ---
  const [currentCollegePage, setCurrentCollegePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- College pagination state ---
  // const [currentDeanPage, setCurrentDeanPage] = useState(1);
  // const [totalDeanPages, setTotalDeanPages] = useState(1);

  // Deans pagination
  const [deanPage, setDeanPage] = useState(1);
  const deansPerPage = 5;
  const totalDeanPages = Math.ceil(deans.length / deansPerPage);
  const paginatedDeans = deans.slice(
    (deanPage - 1) * deansPerPage,
    deanPage * deansPerPage
  );

  const [savingDean, setSavingDean] = useState(false);

  // Fetch curricula and departments together and show loading overlay
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try { 
        setLoading(true);
        const res = await api.get("/academics/colleges/", { params: { role, page: currentCollegePage, page_size: 5 } });

        if (!mounted) return;

        // ✅ Adapt for new paginated response
        const data = res.data;
        setColleges(data.items || []); 
        setTotalPages(data.total_pages || 1); 
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [currentCollegePage]); 

  // Fetch current Assigned Deans
  useEffect(() => {
    api.get(`/user-roles/assigned-roles/?role=DEAN`)
    .then(res => setDeans(res.data))
    .catch(err => console.error(err));
  }, []);

  // Fetch All USERS
  useEffect(() => {
    api.get(`/users/`, { params: { all: true } })
    .then(res => setUsers(res.data))
    .catch(err => console.error(err));
  }, []);

  const validateCollegeForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.college_code.trim()) errors.college_code = "College code is required.";
    if (!formData.college_description.trim()) errors.college_description = "College description is required."; 

    setCollegeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDeanForm = () => {
    const errors: Record<string, string> = {};

    if (!deanForm.user_id) errors.user_id = "User assignment is required.";
    if (!deanForm.entity_id) errors.entity_id = "College assignment is required."; 

    setDeanFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCollegeModal = (college?: College) => {
    setCollegeFormErrors({});
    if (college) { 
      setEditMode(true);
      setSelectedCollege(college);
      setFormData({
        college_code: college.college_code,
        college_description: college.college_description,
        college_status: college.college_status,
      });
    } else { 
      setEditMode(false);
      setSelectedCollege(null);
      setFormData({
        college_code: "",
        college_description: "",
        college_status: "Active",
      });
    }
    setOpenModal(true);
  };

  const handleOpenDeanModal = (dean?: Dean) => { 
    setDeanFormErrors({});
    if (dean) {
      setEditDeanMode(true);
      setSelectedDean(dean);
      setDeanForm({
        user_id: dean.user.id,
        entity_id: colleges.find((d) => d.id === dean.entity_id)?.id || 0,
        start_validity: dean.start_validity || "",
        end_validity: dean.end_validity || "",
      });
    } else {
      setEditDeanMode(false);
      setSelectedDean(null);
      setDeanForm({ user_id: 0, entity_id: 0, start_validity: "", end_validity: "" });
    }
    setOpenDeanModal(true);
  };
 
  const handleSaveDean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDeanForm()) return;

    setSavingDean(true);
    
    try {
      
      const payload = {
        user_id: deanForm.user_id,
        role_name: "DEAN",
        entity_id: deanForm.entity_id,
        start_validity: deanForm.start_validity || null,
        end_validity: deanForm.end_validity || null,
      };

      if (editDeanMode && selectedDean) { 
        await api.put(`/user-roles/${selectedDean.id}/`, payload);
        toast.success("Dean assignment updated successfully!");
      } else { 
        await api.post("/user-roles/assign-role/", payload);
        toast.success("Dean assignment added successfully!");
      } 

      const res = await api.get(`/user-roles/assigned-roles/?role=DEAN`)
      setDeans(res.data); 

      // Reset modal + form
      setOpenDeanModal(false);
      setDeanForm({ user_id: 0, entity_id: 0, start_validity: "", end_validity: "" });
      setSelectedDean(null);
      setEditDeanMode(false);

      } catch (err: any) {
      console.error("Error saving Dean assignment", err);

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
        toast.error("Failed to save Dean assignment. Please check your network.");
      }
    } finally {
      setSavingDean(false);
    }
  };

  const handleSaveCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCollegeForm()) return;
    
    try {
      if (editMode && selectedCollege) {
        await api.put(`/academics/colleges/${selectedCollege.id}/`, formData); 
        toast.success("College updated successfully!");
      } else {
        await api.post("/academics/colleges/", formData); 
        toast.success("College created successfully!");
      }
 
      const res = await api.get("/academics/colleges/", { params: { role, page: currentCollegePage, page_size: 5 } });  
      const data = res.data;
      setColleges(data.items || []); 
      setTotalPages(data.total_pages || 1); 
      setOpenModal(false);
      
    } catch (err: any) {
      console.error("Error saving College", err);
 
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
        toast.error("Failed to save College. Please check your network.");
      }
    }
  };

  const handleDeanDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Dean Assigment?")) return;
    try {
      await api.delete(`/user-roles/${id}/`);
      setDeans(deans.filter(d => d.id !== id));
      toast.success("Dean assignment deleted successfully!");
    } catch (err) {
      console.error("Error deleting Dean assignment", err);
      toast.error("Failed to delete Dean assignment.");
    }
  };

  const handleCollegeDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this college?")) return;
    try {
      await api.delete(`/academics/colleges/${id}/`);
      setColleges(colleges.filter(c => c.id !== id));
      toast.success("College deleted successfully!");
    } catch (err) {
      console.error("Error deleting college", err);
      toast.error("Failed to delete College.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4"> 
      <ToastContainer position="top-right" autoClose={5000} theme="colored" /> 

      {/* College Modal */}
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
        <ModalHeader>{editMode ? "Edit College" : "Create College"}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="college_code">College Code</Label>
              <TextInput
                id="college_code"
                value={formData.college_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    college_code: e.target.value,
                  })
                } 
              />
              {collegeFormErrors.college_code && (
                <p className="text-red-500 text-sm mt-1">{collegeFormErrors.college_code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="college_description">College Description</Label>
              <TextInput
                id="college_description"
                value={formData.college_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    college_description: e.target.value,
                  })
                }
                required
              />
              {collegeFormErrors.college_description && (
                <p className="text-red-500 text-sm mt-1">{collegeFormErrors.college_description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="college_status">Status</Label>
              <Select
                id="college_status"
                value={formData.college_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    college_status: e.target.value as "Active" | "Inactive",
                  })
                }
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSaveCollege}>{editMode ? "Update" : "Create"}</Button>
          <Button color="alternative" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* College Table */}
      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Colleges</h1>
            {/* Create button */}
            <Button className="bg-[#007BFF]" onClick={() => handleOpenCollegeModal()}>
              + Create College
            </Button>
          </div> 

          <div className="mt-4 overflow-hidden rounded-lg ">
            <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                  <Spinner size="xl" />
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="bg-[#007BFF] text-white text-sm w-full border border-radius-sm">
                    <th className="p-2">Code</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="border border-gray-300 p-2">{c.college_code}</td>
                      <td className="border border-gray-300 p-2">{c.college_description}</td>
                      <td className="border border-gray-300 p-2">{c.college_status}</td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenCollegeModal(c)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center justify-center"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleCollegeDelete(c.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center justify-center"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div> 

            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-4 gap-4">
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentCollegePage === 1}
                onClick={() => setCurrentCollegePage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentCollegePage} of {totalPages || 1}
              </span>
              <Button
                className="bg-[#007BFF]"
                size="xs"
                disabled={currentCollegePage === totalPages}
                onClick={() => setCurrentCollegePage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Dean Modal */}
      <Modal dismissible show={openDeanModal} onClose={() => setOpenDeanModal(false)}>
        <ModalHeader>{editMode ? "Edit Dean Assignment" : "Assign Dean"}</ModalHeader> 
        <ModalBody>  
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select
                value={deanForm.user_id}
                onChange={(e) => setDeanForm({ ...deanForm, user_id: Number(e.target.value) })}
              >
                <option value={0}>Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </Select>
              {deanFormErrors.user_id && (
                <p className="text-red-500 text-sm mt-1">{deanFormErrors.user_id}</p>
              )}
            </div>

            <div>
              <Label>College</Label>
              <Select
                value={deanForm.entity_id}
                onChange={(e) => setDeanForm({ ...deanForm, entity_id: Number(e.target.value) })}
              >
                <option value={0}>Select College</option>
                {colleges.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.college_description}
                  </option>
                ))}
              </Select>
              {deanFormErrors.entity_id && (
                <p className="text-red-500 text-sm mt-1">{deanFormErrors.entity_id}</p>
              )}
            </div>

            <div>
              <Label>Start Validity</Label>
              <TextInput
                type="date"
                value={deanForm.start_validity}
                onChange={(e) => setDeanForm({ ...deanForm, start_validity: e.target.value })}
              />
            </div>

            <div>
              <Label>End Validity</Label>
              <TextInput
                type="date"
                value={deanForm.end_validity}
                onChange={(e) => setDeanForm({ ...deanForm, end_validity: e.target.value })}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSaveDean} disabled={savingDean}>
            <div className="flex items-center gap-2">
              {savingDean && <Spinner size="sm" />}
              <span>Save</span>
            </div>
          </Button>
          <Button color="alternative" onClick={() => setOpenDeanModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>

      {/* Deans Banner */}
      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">College Deans</h1>
            {/* Assign Dean button */}
            <Button className="mb-4 bg-[#007BFF]" onClick={() => handleOpenDeanModal()}>
              + Assign Dean
            </Button>
          </div>

          {/* Deans Table */}
          <div className="mt-4 overflow-hidden rounded-lg"> 
            <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#007BFF] text-white text-sm">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">College</th>
                    <th className="p-2">Validity</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeans.map((dean) => (
                    <tr key={dean.id} className="">
                      <td className="border border-gray-300 p-2">
                        {dean.user.first_name} {dean.user.last_name}
                      </td>
                      <td className="border border-gray-300 p-2">{dean.user.email}</td>
                      <td className="border border-gray-300 p-2">{dean.entity_name}</td>
                      <td className="border border-gray-300 p-2">
                        {dean.start_validity || "—"} → {dean.end_validity || "—"}
                      </td>
                      <td className="border border-gray-300 p-2 flex gap-1 justify-center">
                        <Button
                          size="xs"
                          color={"yellow"}
                          className="bg-yellow-500 text-white"
                          onClick={() => handleOpenDeanModal(dean)}
                        >
                        <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          size="xs"
                          color={"red"}
                          className=" text-white"
                          onClick={() => handleDeanDelete(dean.id)}
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

          {/* Deans Pagination */}
          <div className="flex justify-center items-center mt-4 gap-4">
            <Button
              className="bg-[#007BFF]"
              size="xs"
              disabled={deanPage === 1}
              onClick={() => setDeanPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {deanPage} of {totalDeanPages || 1}
            </span>
            <Button
              className="bg-[#007BFF]"
              size="xs"
              disabled={deanPage === totalDeanPages}
              onClick={() => setDeanPage((p) => Math.min(totalDeanPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>  
    </div>
  );
}