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

// Types 
type Program = {
  id: number;
  program_code: string;
  program_name: string;
};

type Curriculum = {
  id: number;
  curr_code: string;
  effectivity: string;
  program: Program;
};

export default function CurriculaPage() {
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();  
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]); 
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    curr_code: "",
    effectivity: "",
    program_id: 0, // auto-set
  });

  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch curricula and show loading overlay
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true); 
        const [currRes, progRes] = await Promise.all([
          api.get("/academics/curricula/", { params: { role, page: currentPage, page_size: 5 } }),
          api.get("/academics/programs/", { params: { role, all: true } }),
        ]);

        if (!mounted) return;

        // ✅ Adapt for new paginated response
        const data = currRes.data;
        setCurricula(data.items || []); 
        setTotalPages(data.total_pages || 1);
        setPrograms(progRes.data);

      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [currentPage]); 

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.program_id) errors.program_id = "Department is required.";
    if (!formData.curr_code.trim()) errors.curr_code = "Curriculum code is required.";
    if (!formData.effectivity.trim()) errors.effectivity = "Effectivity is required.";  

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  const handleOpenModal = (curriculum?: Curriculum) => {
    setFormErrors({});
    if (curriculum) {
      // Edit mode
      setEditMode(true);
      setSelectedCurriculum(curriculum);
      setFormData({
        curr_code: curriculum.curr_code,
        effectivity: curriculum.effectivity,
        program_id: curriculum.program.id,
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedCurriculum(null);
      setFormData({
        curr_code: "",
        effectivity: "",
        program_id: 0,
      });
    }
    setOpenModal(true);
  };
 
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; // stop if there are validation errors

    try {
      if (editMode && selectedCurriculum) {
        await api.put(`/academics/curricula/${selectedCurriculum.id}/`, formData); 
        toast.success("Curriculum updated successfully!");
      } else {
        await api.post("/academics/curricula/", formData); 
        toast.success("Curriculum created successfully!");
      }
 
      const res = await api.get("/academics/curricula/", { params: { role, page: currentPage, page_size: 5 } });  
      const data = res.data;
      setCurricula(data.items || []); 
      setTotalPages(data.total_pages || 1); 
      setOpenModal(false);

    } catch (err: any) {
      console.error("Error saving curriculum", err);
 
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
        } else if (typeof data === "string" || Array.isArray(data)) {
          // Generic string or array message (like PermissionDenied)
          toast.error(Array.isArray(data) ? data.join(", ") : data);
        } else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Failed to save curriculum. Please check your network.");
      }
    }
  };
 
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this curriculum?"))
      return;
    try {
      await api.delete(`/academics/curricula/${id}/`);
      setCurricula(curricula.filter((c) => c.id !== id));
      toast.success("Curriculum deleted successfully!");
    } catch (err) {
      console.error("Error deleting curriculum", err);
      toast.error("Failed to delete curriculum.");
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <ToastContainer position="top-right" autoClose={5000} theme="colored" /> 

      <main className="p-4 mt-5 justify-center">    
        <div className="w-full shadow rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Curricula</h1>

            {/* Create button */}
            <Button
              className="mb-4 bg-[#007BFF]"
              onClick={() => handleOpenModal()}
            >
              + Create Curriculum
            </Button>
          </div>

          {/* Modal */}
          <Modal
            dismissible
            show={openModal}
            onClose={() => setOpenModal(false)}
          >
            <ModalHeader>
              {editMode ? "Edit Curriculum" : "Create Curriculum"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="curr_code">Curriculum Code</Label>
                  <TextInput
                    id="curr_code"
                    value={formData.curr_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        curr_code: e.target.value,
                      })
                    }
                    required
                  />
                  {formErrors.curr_code && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.curr_code}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="effectivity">Effectivity</Label>
                  <TextInput
                    id="effectivity"
                    value={formData.effectivity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectivity: e.target.value,
                      })
                    }
                    required
                  />
                  {formErrors.effectivity && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.effectivity}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select
                    id="program"
                    value={formData.program_id}
                    onChange={(e) => setFormData({ ...formData, program_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Select Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.program_code} - {p.program_name}
                      </option>
                    ))}
                  </Select>
                  {formErrors.program_id && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.program_id}</p>
                  )}
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

          {/* Table */}
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
                    <th className="p-2 text-left">Curriculum Code</th>
                    <th className="p-2 text-left">Effectivity</th>
                    <th className="p-2 text-left">Program</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {curricula.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="border border-gray-300 p-2">{c.curr_code}</td>
                      <td className="border border-gray-300 p-2">{c.effectivity}</td> 
                      <td className="border border-gray-300 p-2">{c.program.program_code} - {c.program.program_name}</td>
                      <td className="border border-gray-300 p-2 flex gap-2 justify-center">
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
                  ))}
                </tbody>
              </table> 
            </div>  

            {/* Pagination controls */}
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
      </main>
    </div>
  );
}
