import { useEffect, useState, useRef } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  TextInput,
  Button,
  Spinner,
} from "flowbite-react";
import {
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { FaChevronLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

type Department = {
  id: number;
  department_code: string;
  department_name: string;
};

type Program = {
  id: number;
  department: Department;
  program_code: string;
  program_name: string;
  program_status: "Active" | "Inactive";
};

export default function DepartmentDetails() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();

  const [department, setDepartment] = useState<Department | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    program_code: "",
    program_name: "",
    program_status: "Active",
    department_id: departmentId || 0,
  });

  // Fetch Department and Programs
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [progRes, deptRes] = await Promise.all([
          api.get(`/academics/programs/`, {
            params: { role, all: true, department_id: departmentId },
          }),
          api.get(`/academics/departments/${departmentId}/`),
        ]);
        if (!mounted) return;
        setPrograms(progRes.data);
        setDepartment(deptRes.data);
      } catch (err) {
        console.error("Error fetching programs or department:", err);
        toast.error("Error fetching programs or department details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [departmentId]);

  // Dropdown positioning logic
  const openMenu = (id: number) => {
    const btn = buttonRefs.current[id];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = rect.left - 100;
    setMenuCoords({ top, left });
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = Object.values(buttonRefs.current).find(
        (el) => el && el.contains(target)
      );
      if (!clickedButton) setOpenMenuId(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleOpenModal = (prog?: Program) => {
    if (prog) {
      setEditMode(true);
      setSelectedProgram(prog);
      setFormData({
        program_name: prog.program_name,
        program_code: prog.program_code,
        program_status: prog.program_status,
        department_id: prog.department.id,
      });
    } else {
      setEditMode(false);
      setSelectedProgram(null);
      setFormData({
        program_name: "",
        program_code: "",
        program_status: "Active",
        department_id: departmentId || 0,
      });
    }
    setOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && selectedProgram) {
        const res = await api.put(`/academics/programs/${selectedProgram.id}/`, formData);
        setPrograms(programs.map((p) => (p.id === selectedProgram.id ? res.data : p)));
        toast.success("Program updated successfully!");
      } else {
        const res = await api.post(`/academics/programs/`, formData);
        setPrograms([...programs, res.data]);
        toast.success("Program created successfully!");
      }
      setOpenModal(false);
    } catch (err) {
      console.error("Error saving program:", err);
      toast.error("Error saving program.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this program?")) return;
    try {
      await api.delete(`/academics/programs/${id}/`);
      setPrograms(programs.filter((p) => p.id !== id));
      toast.success("Program deleted successfully!");
    } catch (err) {
      console.error("Error deleting program:", err);
      toast.error("Error deleting program.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <ToastContainer position="top-right" autoClose={4000} theme="colored" />

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(`/${activeRole}/department/`)}
        className="flex items-center gap-2 text-gray-200 hover:text-blue-900 mb-4"
      >
        <FaChevronLeft />
        Back to Departments
      </button>

      <div className="p-6 mt-5 w-full">
        <div className="shadow rounded-lg bg-white p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {department
                ? `${department.department_name}`
                : "Loading Department..."}
            </h1>
            <Button className="bg-[#007BFF]" onClick={() => handleOpenModal()}>
              + Create Program
            </Button>
          </div>

          {/* Table */}
          <div className="relative min-h-[220px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                <Spinner size="xl" />
              </div>
            )}

            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#007BFF] text-white text-sm border">
                  <th className="p-3">Program Code</th>
                  <th className="p-3">Program Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.length > 0 ? (
                  programs.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{p.program_code}</td>
                      <td className="p-3">{p.program_name}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            p.program_status === "Active"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          {p.program_status}
                        </span>
                      </td>
                      <td className="p-3 relative">
                        <button
                          ref={(el) => {
                            buttonRefs.current[p.id] = el;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenu(p.id);
                          }}
                          className="p-2 rounded hover:bg-gray-100"
                        >
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No programs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Dropdown menu */}
            {openMenuId !== null && menuCoords && (
              <div
                style={{
                  position: "fixed",
                  top: menuCoords.top,
                  left: menuCoords.left,
                  width: 160,
                }}
                className="bg-white rounded-md shadow-lg z-50 border overflow-hidden"
              >
                {(() => {
                  const prog = programs.find((x) => x.id === openMenuId);
                  if (!prog) return null;
                  return (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleOpenModal(prog);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-yellow-50 flex items-center gap-2"
                      >
                        <PencilSquareIcon className="h-5 w-5 text-yellow-600" />
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          handleDelete(prog.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-100 flex items-center gap-2"
                      >
                        <TrashIcon className="h-5 w-5 text-red-600" />
                        Delete
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`${prog.id}/peos`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <BookOpenIcon className="h-5 w-5 text-blue-600" />
                        View PEO
                      </button>

                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`${prog.id}/program-outcomes`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                        View PO
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
