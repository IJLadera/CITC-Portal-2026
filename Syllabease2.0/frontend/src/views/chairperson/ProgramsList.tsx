import { useState, useRef, useEffect } from "react";
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
import {
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon, 
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { ChevronDown } from "lucide-react"; 

type Department = {
  id: number;
  department_code: string;
  department_name: string;
};

type Program = {
  id: number;
  program_code: string;
  program_name: string;
  program_status: "Active" | "Inactive";
  department: Department;
};

export default function ProgramsList() {
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Chairperson's department
  const chairDepartmentId = user?.user_roles?.find(
    (ur: any) =>
      ur.role.name.toUpperCase() === "CHAIRPERSON" &&
      ur.entity_type === "Department"
  )?.entity_id;

  const navigate = useNavigate();

  const [programs, setPrograms] = useState<Program[]>([]); 
  const [loading, setLoading] = useState(true);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dropdown actions
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form
  const [formData, setFormData] = useState({
    program_code: "",
    program_name: "",
    program_status: "Active" as "Active" | "Inactive",
    department_id: chairDepartmentId || 0,
  });

  // --- Fetch data ---
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/academics/programs/", { params: { role, page: currentPage, page_size: 5 } });

        if (!mounted) return;

        const progData = res.data;
        setPrograms(progData.items || []);
        setTotalPages(progData.total_pages || 1); 
      } catch (err) {
        console.error(err);
        toast.error("Failed to load programs.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentPage]);

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
    <div className="flex-1 flex flex-col relative">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />

      <main className="p-4 mt-5 justify-center">
        <div className="w-full shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Programs</h1> 
          </div>

          {/* Modal */}
          {/* <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
            <ModalHeader>{editMode ? "Edit Program" : "Create Program"}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="program_code">Program Code</Label>
                  <TextInput
                    id="program_code"
                    value={formData.program_code}
                    onChange={(e) =>
                      setFormData({ ...formData, program_code: e.target.value })
                    }
                  />
                  {formErrors.program_code && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.program_code}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="program_name">Program Name</Label>
                  <TextInput
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) =>
                      setFormData({ ...formData, program_name: e.target.value })
                    }
                  />
                  {formErrors.program_name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.program_name}</p>
                  )}
                </div> 

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formData.program_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        program_status: e.target.value as "Active" | "Inactive",
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleSave}>{editMode ? "Update" : "Create"}</Button>
              <Button color="alternative" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal> */}

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-lg relative min-h-[220px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                <Spinner size="xl" />
              </div>
            )}
            <table className="w-full border-collapse">
              <thead className="bg-[#007BFF] text-white">
                <tr>
                  <th className="p-2 text-center">Program Code</th>
                  <th className="p-2 text-center">Program Name</th>
                  <th className="p-2 text-center">Department</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 border border-gray-300">{p.program_code}</td>
                    <td className="p-2 border border-gray-300">{p.program_name}</td>
                    <td className="p-2 border border-gray-300">
                      {p.department?.department_name || "—"}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      <span
                        className={`px-3 py-1 rounded-[10px] text-white ${
                          p.program_status === "Active" ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {p.program_status}
                      </span>
                    </td>
                    <td className="p-2 text-center border border-gray-300 relative">
                      <button
                        ref={(el) => {
                          buttonRefs.current[p.id] = el;
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openMenu(p.id);
                        }}
                        className="p-2 rounded hover:bg-gray-100"
                      >
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      </button>
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
                  width: 160,
                }}
                className="bg-white rounded-md shadow-lg z-50 border overflow-hidden"
              >
                <div className="py-1">
                  {/* <button
                    onClick={() => handleOpenModal(programs.find((x) => x.id === openMenuId)!)}
                    className="w-full text-left px-4 py-2 text-yellow-600 hover:bg-yellow-100 flex items-center gap-2"
                  >
                    <PencilSquareIcon className="h-5 w-5 text-yellow-600" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(openMenuId)}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 flex items-center gap-2"
                  >
                    <TrashIcon className="h-5 w-5 text-red-600" />
                    Delete
                  </button> */}

                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      navigate(`${openMenuId}/program-outcomes`);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <BookOpenIcon className="h-5 w-5 text-gray-600" />
                    View POs
                  </button>

                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      navigate(`${openMenuId}/peos`);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
                    View PEOs
                  </button>
                </div>
              </div>
            )}
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
      </main>
    </div>
  );
}
