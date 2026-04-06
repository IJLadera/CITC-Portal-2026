import React, { useEffect, useState } from "react";
import { Button, Label, Checkbox } from "flowbite-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";
import { toast, ToastContainer } from "react-toastify";

type CourseOutcome = {
  id: number;
  co_code: string;
  co_description: string;
};

type CourseOutline = {
  id?: number;
  row_no?: number;
  syllabus_term: string;

  allotted_hour: number;
  allotted_time?: string;
  intended_learning?: string;
  topics: string;
  suggested_readings?: string;
  learning_activities?: string;
  assessment_tools?: string;
  grading_criteria?: string;
  remarks?: string;

  cotcos: { course_outcome: number }[];
};

export default function COTCreate() {
  const { syllabusId, term } = useParams<{ syllabusId: string; term: string }>();
  const navigate = useNavigate();

  const [outlines, setOutlines] = useState<CourseOutline[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch COs
  useEffect(() => {
    if (!syllabusId) return;
    api
      .get("/course-outcomes/", { params: { syllabus_id: syllabusId } })
      .then((res) => setCourseOutcomes(res.data));
  }, [syllabusId]);

  // Fetch Outlines
  useEffect(() => {
    if (!syllabusId || !term) return;
    api
      .get("/course-outlines/", {
        params: { syllabus_id: syllabusId, syllabus_term: term },
      })
      .then((res) => {
        const normalized = res.data.map((outline: any) => ({
          ...outline,
          cotcos: (outline.course_outcomes || []).map((co: any) => ({
            course_outcome: co.course_outcome_id,
          })),
        }));
        setOutlines(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [syllabusId, term]);

  useEffect(() => {
    if (loading) return;
    setTimeout(() => {
      document.querySelectorAll("textarea.auto-expand").forEach((el) => {
        const textarea = el as HTMLTextAreaElement;
        textarea.style.height = "60px";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      });
    }, 0);
  }, [loading, outlines]);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "60px"; 
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleAddRow = () => {
    const newRowNo =
      outlines.length > 0
        ? Math.max(...outlines.map((o) => o.row_no || 0)) + 1
        : 1;

    setOutlines([
      ...outlines,
      {
        syllabus_term: term!,
        allotted_hour: 0,
        topics: "",
        row_no: newRowNo,
        cotcos: [],
      },
    ]);
  };

  const handleChange = (
    index: number,
    field: keyof CourseOutline,
    value: string | number
  ) => {
    const newOutlines = [...outlines];

    if (field === "allotted_hour") {
      // Calculate current total excluding the row being edited
      const otherTotal = newOutlines.reduce((sum, o, i) => {
        if (i !== index) return sum + (o.allotted_hour || 0);
        return sum;
      }, 0);

      const newTotal = otherTotal + Number(value);

      if (newTotal > 40) {
        toast.error(
          `Total allotted hours for ${term} cannot exceed 40. Currently at ${otherTotal}.`
        );
        return;
      }
    }

    (newOutlines[index][field] as any) = value;
    setOutlines(newOutlines);
  };

  const handleDeleteRow = async (index: number) => {
    const outline = outlines[index];
    if (outline.id) {
      await api.delete(`/course-outlines/${outline.id}/`);
    }
    setOutlines(outlines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      for (const outline of outlines) {
        const payload = {
          ...outline,
          syllabus_id: Number(syllabusId),
          course_outcomes: outline.cotcos.map((c) => ({
            course_outcome_id: c.course_outcome,
          })),
        };

        if (outline.id) {
          await api.put(`/course-outlines/${outline.id}/`, payload);
        } else {
          await api.post("/course-outlines/", payload);
        }
      }

      alert("Course Outlines saved!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Error saving course outlines.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="my-14 py-2 shadow-lg bg-linear-to-r from-white to-purple-200 rounded-lg min-w-full">
      <ToastContainer autoClose={3000} closeOnClick />
      <div className="flex items-center justify-center space-x-4 my-4">
        <img
          className="w-86 text-center"
          src={
            term === "MIDTERM"
              ? "/assets/Midterm Course Outline.png"
              : "/assets/Final Course Outline.png"
          }
          alt={`Create ${term} Course Outline`}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {outlines.map((outline, index) => (
            <div
              key={index}
              className="border border-gray-300 p-2 rounded-lg bg-[#f5f8fa] shadow mb-4"
            >
              {/* Labels Row */}
              <div className="grid grid-cols-10 gap-0 mb-1">
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100 rounded-tl-lg">
                  Allotted Hour<span className="text-red-500">*</span>
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Allotted Time
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Course Outcomes (CO)
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Intended Learning Outcome (ILO)
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Topics<span className="text-red-500">*</span>
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Suggested Readings
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Teaching-Learning Activities
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Assessment Task/Tools
                </div>
                <div className="text-xs font-bold text-gray-700 text-center border-r border-gray-300 py-2 bg-gray-100">
                  Grading Criteria
                </div>
                <div className="text-xs font-bold text-gray-700 text-center py-2 bg-gray-100 rounded-tr-lg">
                  Remarks
                </div>
              </div>

              {/* Inputs Row */}
              <div className="grid grid-cols-10 gap-0 items-start min-w-0 w-full">

                {/* ALLOTTED HOUR */}
                <input
                  type="number"
                  value={outline.allotted_hour}
                  onChange={(e) =>
                    handleChange(index, "allotted_hour", Number(e.target.value))
                  }
                  className="w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 rounded-bl-lg h-12 text-xs text-center focus:outline-blue-400"
                  required
                />

                {/* ALLOTTED TIME (Week ranges) */}
                <textarea
                  value={outline.allotted_time || ""}
                  onChange={(e) => {
                    handleChange(index, "allotted_time", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-center focus:outline-blue-400"
                  placeholder="Week 1, Week 2, ..."
                />

                {/* COURSE OUTCOMES SELECTOR */}
                <div className="w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs flex items-center px-2 overflow-x-auto">
                  <div className="flex space-x-2">
                    {courseOutcomes.map((co) => {
                      const isSelected = outline.cotcos.some(
                        (c) => c.course_outcome === co.id
                      );
                      return (
                        <Label
                          key={co.id}
                          className={`flex items-center px-3 py-1 rounded-md border cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? "bg-blue-500 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updated = checked
                                ? [...outline.cotcos, { course_outcome: co.id }]
                                : outline.cotcos.filter(
                                    (c) => c.course_outcome !== co.id
                                  );
                              setOutlines(
                                outlines.map((o, i) =>
                                  i === index ? { ...o, cotcos: updated } : o
                                )
                              );
                            }}
                            className="hidden"
                          />
                          <span className="font-semibold">{co.co_code}</span>
                        </Label>
                      );
                    })}
                  </div>
                </div>

                {/* ILO */}
                <textarea
                  value={outline.intended_learning || ""}
                  onChange={(e) => {
                    handleChange(index, "intended_learning", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

                {/* TOPICS */}
                <textarea
                  value={outline.topics}
                  onChange={(e) => {
                    handleChange(index, "topics", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                  required
                />

                {/* SUGGESTED READINGS */}
                <textarea
                  value={outline.suggested_readings || ""}
                  onChange={(e) => {
                    handleChange(index, "suggested_readings", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

                {/* TEACHING-LEARNING ACTIVITIES */}
                <textarea
                  value={outline.learning_activities || ""}
                  onChange={(e) => {
                    handleChange(index, "learning_activities", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

                {/* ASSESSMENT TOOLS */}
                <textarea
                  value={outline.assessment_tools || ""}
                  onChange={(e) => {
                    handleChange(index, "assessment_tools", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

                {/* GRADING CRITERIA */}
                <textarea
                  value={outline.grading_criteria || ""}
                  onChange={(e) => {
                    handleChange(index, "grading_criteria", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-r border-b border-gray-300 text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

                {/* REMARKS */}
                <textarea
                  value={outline.remarks || ""}
                  onChange={(e) => {
                    handleChange(index, "remarks", e.target.value);
                    autoGrow(e.target);
                  }}
                  className="auto-expand w-full min-w-0 bg-gray-100 border-b border-gray-300 rounded-br-lg text-xs text-left px-2 py-1 focus:outline-blue-400"
                />

              </div>

              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  color="red"
                  size="sm"
                  onClick={() => handleDeleteRow(index)}
                >
                  Delete Row
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between mt-4">
            <Button type="button" color="blue" onClick={handleAddRow}>
              + Add Row
            </Button>
            <Button type="submit" disabled={isSaving} color="blue">
              {isSaving ? "Saving Outlines..." : "Save Outlines"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
