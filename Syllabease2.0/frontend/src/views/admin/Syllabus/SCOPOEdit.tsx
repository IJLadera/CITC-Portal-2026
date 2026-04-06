import React, { useEffect, useState } from "react";
import api from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "flowbite-react";

type CourseOutcome = {
  id: number;
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

export default function SCOPOEdit() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [pos, setPos] = useState<ProgramOutcome[]>([]);
  const [mappings, setMappings] = useState<Record<string, SyllCoPo>>({});
  const [saving, setSaving] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const navigate = useNavigate();

  // Fetch COs
  useEffect(() => {
    api.get(`/course-outcomes/?syllabus_id=${syllabusId}`).then((res) => {
      setCos(res.data);
    });
  }, [syllabusId]);

  // Fetch POs
  useEffect(() => {
    api.get(`/syllabi/${syllabusId}/?role=${role}`).then((res) => {
      setPos(res.data.program_outcomes);
    });
  }, [syllabusId]);

  // Fetch mappings
  useEffect(() => {
    api.get(`/syllcopos/?syllabus_id=${syllabusId}`).then((res) => {
      const map: Record<string, SyllCoPo> = {};
      res.data.forEach((m: SyllCoPo) => {
        map[`${m.course_outcome.id}-${m.program_outcome.id}`] = m;
      });
      setMappings(map);
    });
  }, [syllabusId]);

  const handleChange = (coId: number, poId: number, value: string) => {
    const key = `${coId}-${poId}`;
    const existing = mappings[key] || {
      course_outcome: cos.find((c) => c.id === coId)!,
      program_outcome: pos.find((p) => p.id === poId)!,
    };

    setMappings({
      ...mappings,
      [key]: { ...existing, syllabus_co_po_code: value },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key in mappings) {
        const mapping = mappings[key];
        if (mapping.id) {
          await api.put(`/syllcopos/${mapping.id}/`, {
            syllabus_id: syllabusId,
            course_outcome_id: mapping.course_outcome.id,
            program_outcome_id: mapping.program_outcome.id,
            syllabus_co_po_code: mapping.syllabus_co_po_code,
          });
        } else if (
          mapping.syllabus_co_po_code &&
          mapping.syllabus_co_po_code.trim() !== ""
        ) {
          await api.post(`/syllcopos/`, {
            syllabus_id: syllabusId,
            course_outcome_id: mapping.course_outcome.id,
            program_outcome_id: mapping.program_outcome.id,
            syllabus_co_po_code: mapping.syllabus_co_po_code,
          });
        }
      }
      alert("CO ↔ PO Mapping saved successfully!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Error saving mappings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5  min-h-screen p-6">

      {/* Legend / Program Outcomes button */}
      <div className="flex justify-center items-start mb-6">
        <div
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md flex items-center cursor-pointer"
          role="button"
          onClick={() => setShowPoModal(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mr-2">
            <circle cx="12" cy="12" r="1" stroke="#fff" strokeWidth="2" />
            <path
              d="M18.2265 11.3805C18.3552 11.634 18.4195 11.7607 18.4195 12C18.4195 12.2393 18.3552 12.366 18.2265 12.6195C17.6001 13.8533 15.812 16.5 12 16.5C8.18799 16.5 6.39992 13.8533 5.77348 12.6195C5.64481 12.366 5.58048 12.2393 5.58048 12C5.58048 11.7607 5.64481 11.634 5.77348 11.3805C6.39992 10.1467 8.18799 7.5 12 7.5C15.812 7.5 17.6001 10.1467 18.2265 11.3805Z"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
          <span className="text-sm font-medium">Program Outcomes</span>
        </div>
      </div>

      {/* Legend Table */}
      <div className="overflow-x-auto mb-8">
        <table className="mx-auto border-collapse border border-gray-300 text-sm text-center">
          <thead>
            <tr>
              <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Code</th>
              <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Description</th>
              <th className="bg-[#2563EB] border border-black px-4 py-2 text-white">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2 font-bold">I</td>
              <td className="border px-4 py-2">Introductory Course</td>
              <td className="border px-4 py-2">An Introductory course to an outcome</td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-bold">E</td>
              <td className="border px-4 py-2">Enabling Course</td>
              <td className="border px-4 py-2">A course that strengthens the outcome</td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-bold">D</td>
              <td className="border px-4 py-2">Demonstrating Course</td>
              <td className="border px-4 py-2">A course demonstrating an outcome</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Editable Matrix */}
      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="bg-[#2563EB] border border-black px-4 py-2 text-left text-white">
                Course Outcomes (CO)
              </th>
              {pos.map((po) => (
                <th
                  key={po.id}
                  className="bg-[#2563EB] border border-black px-4 py-2 text-white"
                >
                  {po.po_letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cos.map((co) => (
              <tr key={co.id}>
                <td className="border px-4 py-2 text-sm w-64 text-left">
                  <div className="font-bold">{co.co_code} - <span className="font-normal">{co.co_description}</span></div> 
                </td>
                {pos.map((po) => {
                  const key = `${co.id}-${po.id}`;
                  const mapping = mappings[key];
                  return (
                    <td key={po.id} className="border px-2 py-2 text-center">
                      <input
                        type="text"
                        maxLength={1}
                        value={mapping?.syllabus_co_po_code || ""}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1);
                          if (!["I", "E", "D", ""].includes(value)) return; // ✅ ignore invalid characters
                          handleChange(co.id, po.id, value);
                        }}
                        className="w-12 h-8 text-center border-0 bg-transparent outline-none uppercase"
                        placeholder="I/E/D"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save button centered */}
      <div className="flex justify-center mt-6">
        <Button
          color="blue"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#2563EB]"
        >
          {saving ? "Saving..." : "Save Mapping"}
        </Button>
      </div>

      {/* Program Outcomes Modal */}
      <Modal show={showPoModal} onClose={() => setShowPoModal(false)}>
        <div className="flex items-center justify-between bg-blue-600 text-white px-5 py-3 rounded-t-md">
          <h3 className="text-lg font-medium">Program Outcomes</h3>
          <button
            onClick={() => setShowPoModal(false)}
            aria-label="Close"
            className="p-1 rounded hover:bg-blue-500"
          >
            ✕
          </button>
        </div>
        <div className="bg-white text-black p-5 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            {pos.map((po) => (
              <div key={po.id}>
                <p className="font-medium">
                  {po.po_letter}: {po.po_description}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-white rounded-b-md">
          <Button color="gray" onClick={() => setShowPoModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}