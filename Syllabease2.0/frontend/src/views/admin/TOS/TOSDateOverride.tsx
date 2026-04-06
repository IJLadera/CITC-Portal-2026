import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { TOS, TOSVersions } from "@/types/tos";
import { createEmptyTOS } from "../../../utils/factories";
import { FaUndo, FaSave } from "react-icons/fa";
import api from "../../../api";
import { toast, ToastContainer } from "react-toastify";

interface TOSVersion {
  id: number;
  term: string; 
  version: number;
  status: string;
  chair_submitted_at: string | null;
  chair_returned_at: string | null;
  chair_approved_at: string | null; 
}

const statusStyles: Record<string, string> = {
  Draft: "bg-gray-300 text-gray-600 border-gray-400",
  "Pending Chair Review": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Returned by Chair": "bg-red-200 text-rose-600 border-rose-400",
  "Requires Revision": "bg-red-100 text-red-500 border-red-300",
  "Revised for Chair": "bg-blue-100 text-blue-600 border-blue-300",
  "Approved by Chair": "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Returned by Dean": "bg-rose-300 text-rose-800 border-rose-500", 
}; 

export default function TOSDateOverride() {
  const { tosId } = useParams<{ tosId: string }>(); 
  const activeRole = localStorage.getItem("activeRole") || "";
  const role = activeRole.toUpperCase(); 

  const [TOSVersions, setTOSVersions] = useState<TOSVersions[]>([]);
  const [TOS, setTOS] = useState<TOS>(createEmptyTOS()); 

  const [forms, setForms] = useState<Record<number, Partial<TOSVersion>>>({});
 
  useEffect(() => {
    fetchTOS();
  }, [tosId]);

  useEffect(() => {
    fetchTOSVersions();
  }, [tosId]);

  const fetchTOS = async () => {
    if (!tosId) return;
    try {
      const res = await api.get(`/tos/${tosId}/?role=${role}`);
      setTOS(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTOSVersions = async () => {
    if (!tosId) return;
    try {
      const res = await api.get(`/tos/${tosId}/tos-versions/?role=${role}`);
      setTOSVersions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Sync forms when TOSVersions change
  useEffect(() => {
    if (TOSVersions.length > 0) {
      setForms(
        Object.fromEntries(
          TOSVersions.map((s) => [
            s.id,
            {
              ...s,
              chair_submitted_at: formatForInput(s.chair_submitted_at),
              chair_returned_at: formatForInput(s.chair_returned_at),
              chair_approved_at: formatForInput(s.chair_approved_at), 
            },
          ])
        )
      );
    }
  }, [TOSVersions]);

  const handleChange = (id: number, field: keyof TOSVersion, value: string) => {
    setForms((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleRestore = (id: number) => {
    const original = TOSVersions.find((s) => s.id === id);
    if (!original) return;

    setForms((prev) => ({
      ...prev,
      [id]: {
        ...original,
        chair_submitted_at: formatForInput(original.chair_submitted_at),
        chair_returned_at: formatForInput(original.chair_returned_at),
        chair_approved_at: formatForInput(original.chair_approved_at), 
      },
    }));
  };
  
  const toISOStringOrNull = (val: string | null) => {
    if (!val) return null;
    return new Date(val).toISOString();
  }; 

  const handleSubmit = async (id: number) => {
    try {
      const payload = {
        chair_submitted_at: toISOStringOrNull(forms[id]?.chair_submitted_at || null),
        chair_returned_at: toISOStringOrNull(forms[id]?.chair_returned_at || null),
        chair_approved_at: toISOStringOrNull(forms[id]?.chair_approved_at || null), 
      };

      await api.patch(`/tos/${id}/update-dates/`, payload);
      
      // ✅ Refresh both TOS and versions
      await fetchTOS();
      await fetchTOSVersions();
      
      toast.success("Dates updated successfully ✅");
      alert("Dates updated successfully ✅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update dates ❌");
      alert("Failed to update dates ❌");
    }
  };

  const formatForInput = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }; 

  return (
    <div className="flex flex-1 flex-col p-4 shadow-lg bg-white border-dashed rounded">
      <h1 className="text-xl font-bold">Override Dates for:</h1>
      <h1 className="text-2xl mb-6 text-center underline">
        <span className="font-bold">{`${TOS.course.course_code} - ${TOS.course.course_title} ${TOS.term}`}</span>, {`${TOS.course.course_semester.toLowerCase()} Semester ${TOS.bayanihan_group.school_year}`}
      </h1>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOSVersions.map((TOS) => (
          <form
            key={TOS.id}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(TOS.id);
            }}
            className="p-4 rounded shadow-2xl bg-gray-50"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 justify-between">
              <h2 className="text-lg font-bold">TOS v{TOS.version}</h2>
              <h2
                className={`text-sm px-2 py-1 border-2 rounded-md ${
                  statusStyles[TOS.status] || "bg-gray-100 text-gray-600 border-gray-300"
                }`}
              >
                {TOS.status}
              </h2>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 gap-4">
              {[
                "chair_submitted_at",
                "chair_returned_at",
                "chair_approved_at", 
              ].map((field) => {
                const label = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); 
                const disabled = TOS[field as keyof TOSVersion] === null;

                return (
                  <div key={field}>
                    <label
                      className={`block mb-1 ${disabled ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {disabled ? `${label}: Null` : `${label}:`}
                    </label>
                    <input
                      type="datetime-local"
                      name={field}
                      value={forms[TOS.id]?.[field as keyof TOSVersion] || ""}
                      disabled={disabled}
                      onChange={(e) =>
                        handleChange(TOS.id, field as keyof TOSVersion, e.target.value)
                      }
                      className="override-input w-full border border-gray-300 rounded px-3 py-2
                                focus:outline-none focus:ring-2 focus:ring-blue-400
                                disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300
                                disabled:cursor-not-allowed"
                    />
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleRestore(TOS.id)}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                <FaUndo /> Restore Default Values
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                <FaSave /> Update Dates
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
