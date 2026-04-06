import { useContext, useEffect, useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  TextInput,
  Select,
  Button,
} from "flowbite-react";
import { ToastContainer, toast } from "react-toastify";
import api from "../../api";
import { AuthContext } from "@/context/AuthContext";

//Types
type College = {
  id: number;
  college_code: string;
  college_description: string;
};

type Deadline = {
  id: number;
  school_year: string;
  semester: string;
  syll_deadline: string;
  tos_midterm_deadline: string;
  tos_final_deadline: string;
  syll_status: string;
  tos_midterm_status: string;
  tos_final_status: string;
  college: College;
};

export default function DeadlinePage() {
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const user = useContext(AuthContext)?.user;

  // Dean's College ID
  const deanCollegeId = user?.user_roles?.find(
    (ur: any) =>
      ur.role.name.toUpperCase() === "DEAN" &&
      ur.entity_type === "College"
  )?.entity_id;

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); 

  const [formData, setFormData] = useState({
    school_year: "",
    semester: "",
    syll_deadline: "",
    tos_midterm_deadline: "",
    tos_final_deadline: "",
    syll_status: "Active",
    tos_midterm_status: "Active",
    tos_final_status: "Active",
    college_id: deanCollegeId || 0,
  });

  // Fetch data
  useEffect(() => { 
    const fetchDeadlines = async () => {
      try {
        const res = await api.get(`/deadlines/?role=${role}`);
        setDeadlines(res.data);
      } catch (err) {
        console.error("Error fetching deadlines", err);
      }
    }; 

    fetchDeadlines(); 
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const syllDl = formData.syll_deadline ? new Date(formData.syll_deadline) : null;
    const tosMidDl = formData.tos_midterm_deadline ? new Date(formData.tos_midterm_deadline) : null;
    const tosFinDL = formData.tos_final_deadline ? new Date(formData.tos_final_deadline) : null;

    if (!formData.college_id) errors.college_id = "College is required.";
    if (!formData.school_year.trim()) errors.school_year = "School year is required.";
    if (!formData.semester.trim()) errors.semester = "Semester is required.";   
    if (!syllDl) errors.syll_deadline = "Syllabus deadline is required."; 
    if (!tosMidDl) errors.tos_midterm_deadline = "TOS midterm deadline is required.";
    if (!tosFinDL) errors.tos_final_deadline = "TOS finals deadline is required.";

    // Only run comparison checks if dates exist
    if (syllDl && tosMidDl) {
      if (tosMidDl < syllDl) {
        errors.tos_midterm_deadline = "TOS Midterm cannot be earlier than Syllabus deadline.";
      }
    }
    if (syllDl && tosFinDL) {
      if (tosFinDL < syllDl) {
        errors.tos_final_deadline = "TOS Final cannot be earlier than Syllabus deadline.";
      }
    }

    if (tosMidDl && tosFinDL) {
      if (tosFinDL < tosMidDl) {
        errors.tos_final_deadline = "TOS Final cannot be earlier than TOS Midterm.";
      }
    }
    
    // Syllabus can't be later than midterm or finals
    if (syllDl && tosMidDl && syllDl > tosMidDl) {
      errors.syll_deadline = "Syllabus deadline cannot be later than TOS Midterm.";
    }
    if (syllDl && tosFinDL && syllDl > tosFinDL) {
      errors.syll_deadline = "Syllabus deadline cannot be later than TOS Final.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modal open
  const handleOpenModal = (deadline?: Deadline) => {
    setFormErrors({});
    if (deadline) {
      setEditMode(true);
      setSelectedDeadline(deadline);
      setFormData({
        school_year: deadline.school_year,
        semester: deadline.semester,
        syll_deadline: formatDateTimeLocal(deadline.syll_deadline),
        tos_midterm_deadline: formatDateTimeLocal(deadline.tos_midterm_deadline),
        tos_final_deadline: formatDateTimeLocal(deadline.tos_final_deadline),
        syll_status: deadline.syll_status || "ACTIVE",
        tos_midterm_status: deadline.tos_midterm_status || "ACTIVE",
        tos_final_status: deadline.tos_final_status || "ACTIVE",
        college_id: deadline.college.id || deanCollegeId || 0,
      });
    } else {
      setEditMode(false);
      setSelectedDeadline(null);
      setFormData({
        school_year: "",
        semester: "",
        syll_deadline: "",
        tos_midterm_deadline: "",
        tos_final_deadline: "",
        syll_status: "ACTIVE",
        tos_midterm_status: "ACTIVE",
        tos_final_status: "ACTIVE",
        college_id: deanCollegeId || 0,
      });
    }
    setOpenModal(true);
  };

  // Save / Update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; // stop if there are validation errors

    setSaving(true);
    
    try {
      if (editMode && selectedDeadline) {
        const res = await api.put(`/deadlines/${selectedDeadline.id}/`, formData);
        setDeadlines(
          deadlines.map((d) => (d.id === selectedDeadline.id ? res.data : d))
        );
        toast.success("Deadline updated successfully!");
      } else {
        const res = await api.post("/deadlines/", formData);
        setDeadlines([...deadlines, res.data]);
        toast.success("Deadline created successfully!");
      }
      setOpenModal(false);

    } catch (err: any) {
      console.error("Error saving deadline:", err);
 
      if (err.response && err.response.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          // ✅ Handle DRF validation errors cleanly
          for (const [field, messages] of Object.entries(data)) {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
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
        toast.error("Failed to save deadline. Please check your network.");
      }
    } finally {
      setSaving(false); // ← stop loading
    }
  };
 
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this deadline?")) return;
    try {
      await api.delete(`/deadlines/${id}/`);
      setDeadlines(deadlines.filter((d) => d.id !== id));
      toast.success("Deadline deleted successfully!");
    } catch (err) {
      console.error("Error deleting deadline", err);
      toast.error("Failed to delete deadline.");
    }
  };

  // Date Format Helpers
  const formatDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString();
    return localISOTime.slice(0, 16);
  };

  const formatDateTimeDisplay = (dateString: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleStatusChange = async (
      id: number,
      field: "syll_status" | "tos_midterm_status" | "tos_final_status",
      value: "ACTIVE" | "INACTIVE"
    ) => {
      try {
        const res = await api.patch(`/deadlines/${id}/update_status/`, { [field]: value });
        setDeadlines(deadlines.map((d) => (d.id === id ? res.data : d)));
      } catch (err) {
        console.error("Error updating status", err);
      }
    };

  return (
    <div className="flex-1 flex flex-col p-4">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />

      {/* Deadline Modal */}
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)} size="lg">
        <ModalHeader>{editMode ? "Edit Deadline" : "Create Deadline"}</ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* School Year + Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
                </Select>
                {formErrors.school_year && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.school_year}</p>
                )}
              </div>
              <div>
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  required
                >
                  <option value="">Select...</option>
                  <option value="1ST">1st Semester</option>
                  <option value="2ND">2nd Semester</option>
                  <option value="SUMMER">Summer</option>
                </Select>
                {formErrors.semester && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.semester}</p>
                )}
              </div>
            </div>

            {/* Syllabus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="syll_deadline">Syllabus Deadline *</Label>
                <TextInput
                  id="syll_deadline"
                  type="datetime-local"
                  value={formData.syll_deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, syll_deadline: e.target.value })
                  }
                  required
                />
                {formErrors.syll_deadline && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.syll_deadline}</p>
                )}
              </div>
              <div>
                <Label htmlFor="syll_status">Syllabus Status *</Label>
                <Select
                  id="syll_status"
                  value={formData.syll_status}
                  onChange={(e) =>
                    setFormData({ ...formData, syll_status: e.target.value })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            {/* TOS Midterm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tos_midterm_deadline">
                  TOS Midterm Deadline *
                </Label>
                <TextInput
                  id="tos_midterm_deadline"
                  type="datetime-local"
                  value={formData.tos_midterm_deadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tos_midterm_deadline: e.target.value,
                    })
                  } 
                />
                {formErrors.tos_midterm_deadline && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tos_midterm_deadline}</p>
                )}
              </div>
              <div>
                <Label htmlFor="tos_midterm_status">TOS Midterm Status *</Label>
                <Select
                  id="tos_midterm_status"
                  value={formData.tos_midterm_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tos_midterm_status: e.target.value,
                    })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            {/* TOS Final */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tos_final_deadline">TOS Final Deadline *</Label>
                <TextInput
                  id="tos_final_deadline"
                  type="datetime-local"
                  value={formData.tos_final_deadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tos_final_deadline: e.target.value,
                    })
                  } 
                />
                {formErrors.tos_final_deadline && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tos_final_deadline}</p>
                )}
              </div>
              <div>
                <Label htmlFor="tos_final_status">TOS Final Status *</Label>
                <Select
                  id="tos_final_status"
                  value={formData.tos_final_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tos_final_status: e.target.value,
                    })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              editMode ? "Update" : "Create"
            )}
          </Button>
          <Button color="alternative" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Deadlines Table */}
      <div className="mt-5 w-full">
        <div className="ml-auto shadow rounded-lg bg-white p-6">

          {/* Deadline Create Button */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold mb-6">Deadlines</h1>
            <Button className="mb-4 bg-[#007BFF]" onClick={() => handleOpenModal()}>
              + Set Deadline
            </Button>
          </div>

          {/* Deadline Table */}
          <div className="mt-4 overflow-x-auto rounded-lg">
            <table className="w-full border-collapse border border-gray-300 text-sm text-center">
              <thead>
                <tr className="bg-[#007BFF] text-white">
                  <th className="p-2">School Year</th>
                  <th className="p-2">Semester</th>
                  <th className="p-2">Syllabus</th>
                  <th className="p-2">TOS Midterm</th>
                  <th className="p-2">TOS Final</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id} className="border-t border-gray-300">
                    <td className="border border-gray-300 p-2">{d.school_year}</td>
                    <td className="border border-gray-300 p-2">{d.semester.toLowerCase()}</td>

                    {/* Syllabus */}
                    <td className="border border-gray-300 p-3">
                      <div>{formatDateTimeDisplay(d.syll_deadline)}</div>
                      <div
                        onClick={() => {
                          if (!editMode) return;
                          handleStatusChange(
                            d.id,
                            "syll_status",
                            d.syll_status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                          );
                        }}
                        className={`mt-1 px-2 py-[2px] rounded-full text-white text-[10px] font-semibold inline-block ${
                          d.syll_status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                        }`}
                        title="Click to toggle status"
                      >
                        {d.syll_status === "ACTIVE" ? "Active" : "Inactive"}
                      </div>
                    </td>

                    {/* TOS Midterm */}
                    <td className="border border-gray-300 p-3">
                      <div>{formatDateTimeDisplay(d.tos_midterm_deadline)}</div>
                      <div
                        onClick={() => {
                          if (!editMode) return;
                          handleStatusChange(
                            d.id,
                            "tos_midterm_status",
                            d.tos_midterm_status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                          );
                        }}
                        className={`mt-1 px-2 py-[2px] rounded-full text-white text-[10px] font-semibold inline-block ${
                          d.tos_midterm_status === "ACTIVE"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                        title="Click to toggle status"
                      >
                        {d.tos_midterm_status === "ACTIVE" ? "Active" : "Inactive"}
                      </div>
                    </td>

                    {/* TOS Final */}
                    <td className="border border-gray-300 p-3">
                      <div>{formatDateTimeDisplay(d.tos_final_deadline)}</div>
                      <div
                        onClick={() => {
                          if (!editMode) return;
                          handleStatusChange(
                            d.id,
                            "tos_final_status",
                            d.tos_final_status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                          );
                        }}
                        className={`mt-1 px-2 py-[2px] rounded-full text-white text-[10px] font-semibold inline-block ${
                          d.tos_final_status === "ACTIVE"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                        title="Click to toggle status"
                      >
                        {d.tos_final_status === "ACTIVE" ? "Active" : "Inactive"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="border border-gray-300 p-2 text-center align-middle">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(d)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
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
        </div>
      </div>
    </div>
  );
}
