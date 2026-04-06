import { useState, useEffect } from "react";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters"; 
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { TrashIcon } from "@heroicons/react/24/outline";
import api from "../../../api";
import { Plus, ChevronDown, FilePlus2 } from "lucide-react";

interface TOSTemplate {
  id: number;
  title: string;
  revision_no: number;
  description: string;
  is_active: boolean;
  effective_date?: string | null;
}

export default function TOSTemplateList() {
  const activeRole = localStorage.getItem("activeRole");
  const [template, setTemplate] = useState<TOSTemplate[]>([]); 
  const navigate = useNavigate(); 

  /** ✅ Load template from API */
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get("/tos-templates/");
      setTemplate(res.data);
    } catch (err: any) {
      console.error("Error loading TOS Templates:", err);

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
          toast.error("Error fetching TOS Templates. Please try again later.");
      } 
    }
  };

  /** ✅ Delete a template */
  const deleteTemplate = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this TOS Template?")) return;
    try {
      await api.delete(`/tos-templates/${id}/`);
      toast.success("TOS Template deleted successfully.");
      setTemplate((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete TOS Template.");
    }
  };  

  return (
    <div className="flex-1 flex flex-col p-6">
      <ToastContainer position="top-right" autoClose={4000} theme="colored" />
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(`/${activeRole}/tos/`)}
        className="flex items-center gap-2 text-gray-200 hover:text-blue-900 mb-4"
      >
        <FaChevronLeft />
        Back to TOS List
      </button>

      <main className="p-6 flex flex-col items-center">  
        {/* 🔹 White Card Container */}
        <div className="p-6 shadow bg-white rounded-lg border border-gray-200 w-full max-w-6xl flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#201B50] tracking-tight">
              TOS Templates
            </h1>
            
            {/* 🔽 Dropdown Button */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => {
                  const dropdown = document.getElementById("tosTemplateDropdown");
                  dropdown?.classList.toggle("hidden");
                }}
                className="flex items-center gap-2 bg-[#007BFF] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
              >
                <Plus size={16} />
                Set New TOS Template
                <ChevronDown size={16} className="opacity-80" />
              </button>

              {/* Dropdown Menu */}
              <div
                id="tosTemplateDropdown"
                className="hidden absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2"
              >
                <div className="py-1 text-sm">

                  {/* Option 1: Create New */}
                  <button
                    onClick={() => {
                      navigate(`/${activeRole}/tos/tos-template/create`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Plus size={16} className="text-blue-600" />
                    Create New (Blank)
                  </button>

                  {/* Option 2: Create From Active */}
                  <button
                    onClick={() => {
                      const active = template.find(st => st.is_active);
                      if (active) {
                        navigate(`/${activeRole}/tos/tos-template/${active.id}/create`);
                      } else {
                        toast.error("No active template available.");
                      }
                    }}
                    disabled={!template.some(r => r.is_active)}
                    className={`flex items-center gap-2 w-full px-4 py-2 text-left transition ${
                      template.some(r => r.is_active)
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-400 bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <FilePlus2
                      size={16}
                      className={`${
                        template.some(r => r.is_active)
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                    Create From Current Active
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700 rounded-lg">
              <thead className="bg-[#6697e5] text-white uppercase text-sm">
                <tr>
                  <th className="px-6 py-3 border-b rounded-tl-sm">Revision No</th>
                  <th className="px-6 py-3 border-b">Effective Date</th>
                  <th className="px-6 py-3 border-b">Description</th>
                  <th className="px-6 py-3 border-b">Active</th>
                  <th className="px-6 py-3 border-b text-center rounded-tr-sm">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {template.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-gray-500 py-6 italic"
                    >
                      No TOS template yet.
                    </td>
                  </tr>
                ) : (
                  template.map((form) => (
                    <tr
                      key={form.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 border-b">{formatRevisionNo(form.revision_no)}</td>
                      <td className="px-6 py-4 border">{formatEffectiveDate(form.effective_date)}</td>
                      <td className="px-6 py-4 border-b">
                        {form.description || "—"}
                      </td>
                      <td className="px-6 py-4 border-b">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            form.is_active
                              ? "bg-green-200 text-green-800 border-green-400"
                              : "bg-yellow-100 text-yellow-700 border-yellow-300"
                          }`}
                        >
                          {form.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 border-b text-center">
                        <div className="flex justify-center gap-3">
                          {/* <button
                            onClick={() => navigate(`${form.id}/view`)}
                            className="text-black px-2 py-1 rounded hover:bg-gray-200 flex items-center justify-center"
                            title="View"
                          >
                            <FaChevronLeft size={16} className="rotate-180" />
                          </button> */}

                          <button
                            onClick={() => deleteTemplate(form.id)}
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
        </div>
      </main>

    </div>
  );
}
