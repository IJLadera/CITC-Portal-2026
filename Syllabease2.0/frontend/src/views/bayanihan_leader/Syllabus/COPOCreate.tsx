import React, { useEffect, useState, useRef } from "react";
import api from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "flowbite-react";

type CourseOutcome = {
  id?: number;
  co_code: string;
  co_description: string;
};

type ProgramOutcome = {
  id: number;
  po_letter: string;
  po_description: string;
};

type SyllCoPo = {
  id?: number;
  course_outcome: CourseOutcome;
  program_outcome: ProgramOutcome;
  syllabus_co_po_code?: string;
};

export default function COPOCreate() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const navigate = useNavigate();
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [pos, setPos] = useState<ProgramOutcome[]>([]);
  const [mappings, setMappings] = useState<Record<string, SyllCoPo>>({});
  const [saving, setSaving] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  const coRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    api.get(`/course-outcomes/?syllabus_id=${syllabusId}`).then((res) => {
      setCos(res.data.length ? res.data : [{ co_code: "", co_description: "" }]);
    });
    api.get(`/syllabi/${syllabusId}`).then((res) => {
      setPos(res.data.program_outcomes || []);
    });
    api.get(`/syllcopos/?syllabus_id=${syllabusId}`).then((res) => {
      const map: Record<string, SyllCoPo> = {};
      res.data.forEach((m: SyllCoPo) => {
        map[`${m.course_outcome.id}-${m.program_outcome.id}`] = m;
      });
      setMappings(map);
    });
  }, [syllabusId]);

  // Auto-resize textarea
  useEffect(() => {
    const timeout = setTimeout(() => {
      coRefs.current.forEach((ta) => {
        if (ta) {
          ta.style.height = "40px";
          ta.style.height = `${ta.scrollHeight}px`;
        }
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [cos]);

  const handleAddRow = () => {
    setCos([...cos, { co_code: "", co_description: "" }]);
  };

  const handleDeleteRow = async (index: number) => {
    const co = cos[index];
    if (co.id) await api.delete(`/course-outcomes/${co.id}/`);
    setCos(cos.filter((_, i) => i !== index));  
    // Remove all mappings related to this CO
    setMappings((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`${co.id ?? `new-${index}`}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const handleCOChange = (index: number, field: "co_code" | "co_description", value: string) => {
    const updated = [...cos];
    updated[index][field] = value;
    setCos(updated);
  };

  const handleMappingChange = (coIndex: number, poId: number, value: string) => {
    const co = cos[coIndex];
    const key = `${co.id ?? `new-${coIndex}`}-${poId}`;
    const existing = mappings[key] || {
      course_outcome: co,
      program_outcome: pos.find((p) => p.id === poId)!,
    };
    setMappings({ ...mappings, [key]: { ...existing, syllabus_co_po_code: value } });
  };

  const handleSave = async () => {
    // Validate all CO rows
    for (let i = 0; i < cos.length; i++) {
      const co = cos[i];
      if (!co.co_code.trim() || !co.co_description.trim()) {
        alert(`Please fill in all Course Outcome rows. Row ${i + 1} is incomplete.`);
        return;
      }
    }
    
    setSaving(true);
    try {
      // Save COs first
      for (let co of cos) {
        if (co.id) {
          await api.put(`/course-outcomes/${co.id}/`, { ...co, syllabus_id: Number(syllabusId) });
        } else {
          const res = await api.post(`/course-outcomes/`, { ...co, syllabus_id: Number(syllabusId) });
          co.id = res.data.id;
        }
      }

      // Save CO ↔ PO mappings, even if syllabus_co_po_code is empty
      for (const key in mappings) {
        const mapping = mappings[key];
        if (!mapping.course_outcome.id || !mapping.program_outcome.id) continue;

        const payload = {
          syllabus_id: syllabusId,
          course_outcome_id: mapping.course_outcome.id,
          program_outcome_id: mapping.program_outcome.id,
          syllabus_co_po_code: mapping.syllabus_co_po_code || null, // allow empty
        };

        if (mapping.id) {
          await api.put(`/syllcopos/${mapping.id}/`, payload);
        } else {
          await api.post(`/syllcopos/`, payload);
        }
      }

      alert("Course Outcomes & Mappings saved!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Error saving data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 my-14">
      <div className="shadow-lg bg-linear-to-r p-6 from-white to-blue-200 rounded-lg overflow-x-auto"> 
        <div className="flex justify-end items-center">
          <Button
            type="button"
            color="blue"
            onClick={() => setShowPoModal(true)}
            className="mb-4 px-5"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mr-2">
              <circle cx="12" cy="12" r="1" stroke="#fff" strokeWidth="2" />
              <path
                d="M18.2265 11.3805C18.3552 11.634 18.4195 11.7607 18.4195 12C18.4195 12.2393 18.3552 12.366 18.2265 12.6195C17.6001 13.8533 15.812 16.5 12 16.5C8.18799 16.5 6.39992 13.8533 5.77348 12.6195C5.64481 12.366 5.58048 12.2393 5.58048 12C5.58048 11.7607 5.64481 11.634 5.77348 11.3805C6.39992 10.1467 8.18799 7.5 12 7.5C15.812 7.5 17.6001 10.1467 18.2265 11.3805Z"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
            Program Outcomes
          </Button>
        </div>
        <table className="border-collapse border border-gray-300 w-full">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border px-4 py-2 text-left">Course Outcomes</th>
              {pos.map((po) => (
                <th key={po.id} className="border px-2 py-2">{po.po_letter}</th>
              ))}
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cos.map((co, index) => (
              <tr key={co.id ?? `new-${index}`}>
                <td className="border px-2 py-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="CO1"
                      value={co.co_code}
                      onChange={(e) => handleCOChange(index, "co_code", e.target.value)}
                      className="w-20 border-2 border-gray-400 text-center rounded"
                      required
                    />
                    <textarea
                      placeholder="Enter course outcome..."
                      value={co.co_description}
                      onChange={(e) => handleCOChange(index, "co_description", e.target.value)}
                      ref={(el) => { coRefs.current[index] = el; }}
                      className="border-2 border-gray-400 rounded px-2 py-1 resize-none overflow-hidden flex-1"
                      required
                    />
                  </div>
                </td>
                {pos.map((po) => {
                  const key = `${co.id ?? `new-${index}`}-${po.id}`;
                  const mapping = mappings[key];
                  return (
                    <td key={po.id} className="border px-2 py-2 text-center">
                      <input
                        type="text"
                        maxLength={1}
                        value={mapping?.syllabus_co_po_code || ""}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1);
                          if (!["I", "E", "D", ""].includes(value)) return;
                          handleMappingChange(index, po.id, value);
                        }}
                        className="w-12 h-8 text-center border-2 border-gray-300 rounded uppercase"
                        placeholder="I/E/D"
                      />
                    </td>
                  );
                })}
                <td className="border px-2 py-2 text-center">
                  <Button type="button" color="red" size="sm" onClick={() => handleDeleteRow(index)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <Button type="button" color="blue" onClick={handleAddRow}>+ Add Row</Button>
          <Button color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>

        {/* Program Outcomes Modal */}
        <Modal show={showPoModal} onClose={() => setShowPoModal(false)} size="4xl">
          <div className="flex items-center justify-between bg-blue-600 text-white px-5 py-3 rounded-t-md">
            <h3 className="text-lg font-medium">Program Outcomes</h3>
            <button onClick={() => setShowPoModal(false)} aria-label="Close" className="p-1 rounded hover:bg-blue-500">✕</button>
          </div>
          <div className="po-auto-expand bg-white text-black p-5 max-h-[80vh] overflow-y-auto">
            {pos.map((po) => (
              <p key={po.id} className="font-medium text-justify mb-2">{po.po_letter}: <span className="font-normal">{po.po_description}</span></p>
            ))}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 bg-white rounded-b-md">
            <Button color="gray" onClick={() => setShowPoModal(false)}>Close</Button>
          </div>
        </Modal>
      
        {/* Legend Modal */}
        <Modal show={showLegendModal} onClose={() => setShowLegendModal(false)}>
          <div className="flex items-center justify-between bg-blue-600 text-white px-5 py-3 rounded-t-md">
            <h3 className="text-lg font-medium">Legend</h3>
            <button onClick={() => setShowLegendModal(false)} aria-label="Close" className="p-1 rounded hover:bg-blue-500">✕</button>
          </div>
          <div className="bg-white text-black p-5 overflow-x-auto">
            <table className="mx-auto border-collapse border border-gray-300 text-sm text-center">
              <thead>
                <tr>
                  <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Code</th>
                  <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Description</th>
                  <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border px-4 py-2 font-bold">I</td><td className="border px-4 py-2">Introductory Course</td><td className="border px-4 py-2">An Introductory course to an outcome</td></tr>
                <tr><td className="border px-4 py-2 font-bold">E</td><td className="border px-4 py-2">Enabling Course</td><td className="border px-4 py-2">A course that strengthens the outcome</td></tr>
                <tr><td className="border px-4 py-2 font-bold">D</td><td className="border px-4 py-2">Demonstrating Course</td><td className="border px-4 py-2">A course demonstrating an outcome</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 bg-white rounded-b-md">
            <Button color="gray" onClick={() => setShowLegendModal(false)}>Close</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
