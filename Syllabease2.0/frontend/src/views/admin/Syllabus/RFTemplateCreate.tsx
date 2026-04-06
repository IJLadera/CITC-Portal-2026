import React, { useEffect, useRef, useState } from "react"; 
import { useNavigate, useLocation } from "react-router-dom"; 
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify"; 
import api from "@/api";
import { v4 as uuidv4 } from "uuid";  

type RowType = "header" | "indicator";

type FieldType = "text" | "textarea" | "date";

interface ReviewFormField {
  id: number;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  position: "header" | "footer";
  row: number;
  column: number;
  span_full: boolean; 
  prefill_source: string;
} 

type EditRow = {
  id: number;
  type: RowType;
  text: string; 
  syllabus_section: string | null;
  yes?: boolean;
  no?: boolean;
  remarks?: string;
}; 

const PREFILL_OPTIONS = [
  { value: "none", label: "No Prefill" },
  { value: "course_code", label: "Course Code" },
  { value: "course_title", label: "Course Title" },
  { value: "course_year_level", label: "Course Year Level" },
  { value: "program_code", label: "Program Code" },
  { value: "program_name", label: "Program Name" },
  { value: "department_code", label: "Department Code" },
  { value: "department_name", label: "Department Name" },
  { value: "college_code", label: "College Code" },
  { value: "college_name", label: "College Name" },
  { value: "faculty", label: "Faculty" },
  { value: "semester", label: "Semester" },
  { value: "course_code_title", label: "Course Code + Course Title" },
  { value: "semester_year", label: "Semester + School Year" },
];

export default function RFTemplateCreate() { 
  const navigate = useNavigate();  
  const location = useLocation(); 

  const [title, setTitle] = useState("Syllabus Review Form");
  const [revisionNo, setRevisionNo] = useState<number | null>(null); 
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null); 
  const [rows, setRows] = useState<EditRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [addMenuFor, setAddMenuFor] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showIndicatorPopup, setShowIndicatorPopup] = useState(false);
  const [indicatorCount, setIndicatorCount] = useState(""); 
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);  
  const [description, setDescription] = useState("");   

  const [fields, setFields] = useState<ReviewFormField[]>([]);

  useEffect(() => {
    // Read query param
    const params = new URLSearchParams(location.search);
    const fromActive = params.get("fromActive");
    if (!fromActive) return;

    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/review-templates/${fromActive}/`);
        const data = res.data;

        // Fill base metadata
        setTitle(data.title || "Syllabus Review Form");
        setEffectiveDate(data.effective_date || null);
        setDescription(data.description || "");
        setRevisionNo(data.revision_no);

        // Fill PARTS + INDICATORS
        if (Array.isArray(data.items)) {
          setRows(
            data.items.map((item: any) => ({
              id: Date.now() + Math.random(),
              type: item.type === "part" ? "header" : "indicator",
              text: item.text,
              syllabus_section: item.syllabus_section || null,
              yes: false,
              no: false,
              remarks: "",
            }))
          );
        }

        // Fill header/footer fields
        if (Array.isArray(data.fields)) {
          setFields(
            data.fields.map((f: any) => ({
              id: Date.now() + Math.random(),
              label: f.label,
              field_type: f.field_type,
              is_required: f.is_required,
              prefill_source: f.prefill_source,
              position: f.position,
              row: f.row,
              column: f.column,
              span_full: f.span_full,
            }))
          );
        } 

      } catch (err) {
        console.error(err);
        toast.error("Failed to load active template.");
      }
    };

    fetchTemplate();
  }, [location.search]);

  const handleAddField = (position: "header" | "footer") => {
    const positionFields = fields.filter((f) => f.position === position);
    const lastRow = positionFields.length
      ? Math.max(...positionFields.map((f) => f.row))
      : 0;

    const fieldsInLastRow = positionFields.filter((f) => f.row === lastRow);
    const hasFull = fieldsInLastRow.some(
      (f) => f.field_type === "textarea" || f.span_full
    );

    let newRow = lastRow;
    let newColumn = 1;

    if (hasFull || fieldsInLastRow.length >= 2) {
      newRow = lastRow + 1;
      newColumn = 1;
    } else {
      newColumn = 2;
    }

    setFields((prev) =>
      reflowFields([
        ...prev,
        {
          id: Date.now(),
          label: "New Field",
          field_type: "text",
          is_required: true,
          position,
          row: newRow,
          column: newColumn,
          span_full: false,
          prefill_source: "none",   // ✅ add this
        },
      ])
    );
  };

  const handleDeleteField = (id: number) => {
    setFields((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      return reflowFields(updated);
    });
  };

  const handleUpdateField = (id: number, patch: Partial<ReviewFormField>) => {
    setFields((prev) => {
      const updated = prev.map((f) =>
        f.id === id
          ? {
              ...f,
              ...patch,
              span_full:
                patch.field_type === "textarea"
                  ? true
                  : patch.span_full ?? f.span_full,
            }
          : f
      );

      return reflowFields(updated);
    });
  };

  const reflowFields = (allFields: ReviewFormField[]): ReviewFormField[] => {
    const newLayout: ReviewFormField[] = [];

    ["header", "footer"].forEach((position) => {
      const positionFields = allFields
        .filter((f) => f.position === position)
        .sort((a, b) => a.row - b.row || a.column - b.column);

      let row = 0;
      let col = 1;

      // 🧠 Iterate sequentially as if re-laying out in reading order
      positionFields.forEach((f) => {
        const fullWidth = f.field_type === "textarea" || f.span_full;

        // ✅ Always start new row if the field wants full width  and we’re currently at column 2
        if (fullWidth && col === 2) {
          row += 1;
          col = 1;
        }

        newLayout.push({ ...f, row, column: col });

        if (fullWidth) {
          // always takes full row
          row += 1;
          col = 1;
        } else if (col === 1) {
          // move to next column
          col = 2;
        } else {
          // both columns filled, go to next row
          row += 1;
          col = 1;
        }
      });
    });

    return newLayout;
  };

  const makeRow = (type: RowType, text?: string): EditRow => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    type,
    text: text ?? (type === "header" ? "PART I. New Section" : "New indicator"),
    syllabus_section: "", 
    yes: false,
    no: false,
    remarks: "",
  });

  const insertRowBelow = (afterId: number | null, type: RowType, count: number = 1) => {
    setRows((prev) => {
      const newRows = Array.from({ length: count }, () => makeRow(type));
      if (afterId === null) return [...prev, ...newRows];
      const idx = prev.findIndex((x) => x.id === afterId);
      if (idx === -1) return [...prev, ...newRows];
      const copy = [...prev];
      copy.splice(idx + 1, 0, ...newRows);
      return copy;
    });
    setAddMenuFor(null);
  };

  const deleteRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: number, patch: Partial<EditRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRowAtEnd = (type: RowType) => insertRowBelow(null, type);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleRowClick = (rowId: number) => {
    if (selectedRow === rowId) {
      setSelectedRow(null);
      setAddMenuFor(null);
    } else {
      setSelectedRow(rowId);
      setAddMenuFor(null);
    }
  };  

  const handleNext = () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedEffectiveDate = effectiveDate?.trim();

    if (!trimmedTitle || !trimmedDescription || !trimmedEffectiveDate) {
      toast.error("Please fill in Review Form Template metadata before proceeding to next page.");
      return;
    }

    const draftData = {
      title: trimmedTitle,
      effective_date: trimmedEffectiveDate,
      description: trimmedDescription,
        items: rows.map((r, idx) => ({
          id: uuidv4(), // ✅ unique identifier
          type: r.type === "header" ? "part" : "indicator",
          text: r.text.trim(),
          order: idx + 1,
        })),
        fields: fields.map((f, idx) => ({
          label: f.label,
          field_type: f.field_type,
          is_required: f.is_required,
          prefill_source: f.prefill_source,   // ✅ include this
          position: f.position,
          row: f.row,
          column: f.column,
          span_full: f.span_full,
          display_order: idx + 1,
        })),
    };

    navigate("/admin/syllabus/review-form-template/map", { state: draftData });
  }; 

  // 🟢 Added: Render layout fields (header/footer)
  const renderFieldSection = (position: "header" | "footer") => {
    const sectionFields = fields.filter((f) => f.position === position);
    if (sectionFields.length === 0) {
      return (
        <button
          onClick={() => handleAddField(position)}
          className="text-blue-600 text-sm hover:underline"
        >
          + Add {position === "header" ? "Top" : "Bottom"} Field
        </button>
      );
    }

    const grouped = sectionFields.reduce<Record<number, ReviewFormField[]>>(
      (acc, field) => {
        acc[field.row] = acc[field.row] || [];
        acc[field.row].push(field);
        return acc;
      },
      {}
    );

    return (
      <div className="mt-2 w-full border border-gray-300 rounded p-3 bg-gray-50">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold text-sm">
            {position === "header" ? "Header Fields" : "Footer Fields"}
          </h3>
          <button
            onClick={() => handleAddField(position)}
            className="bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
          >
            <FaPlus size={10} /> Add Field
          </button>
        </div>

        {Object.keys(grouped)
          .sort((a, b) => +a - +b)
          .map((rowKey: any) => (
            <div key={rowKey} className="grid grid-cols-2 gap-4 mb-3">
              {grouped[rowKey].map((f) => (
                <div
                  key={f.id}
                  className={`col-span-${
                    f.field_type === "textarea" ? "2" : f.span_full === true ? "2" : "1"
                  } bg-white border rounded p-3 shadow-sm`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) =>
                        handleUpdateField(f.id, { label: e.target.value })
                      }
                      className="border-b border-gray-300 focus:outline-none text-sm font-semibold w-full"
                      placeholder="Field Label"
                    />
                    <button
                      onClick={() => handleDeleteField(f.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <select
                    value={f.field_type}
                    onChange={(e) =>
                      handleUpdateField(f.id, {
                        field_type: e.target.value as FieldType,
                      })
                    }
                    className="border p-1 rounded w-full text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                  </select>

                  <select
                    value={f.prefill_source}
                    onChange={(e) =>
                      handleUpdateField(f.id, { prefill_source: e.target.value })
                    }
                    className="border p-1 rounded w-full text-sm mt-2"
                  >
                    {PREFILL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 mt-2 text-xs">
                    <input
                      type="checkbox"
                      checked={f.is_required} 
                      onChange={(e) =>
                        handleUpdateField(f.id, {
                          is_required: e.target.checked,
                        })
                      }
                    />
                    Required Field
                  </label>

                  {/* Span full width toggle */}
                  {f.field_type !== "textarea" && (
                    <label className="flex items-center gap-2 mt-2 text-xs">
                      <input
                        type="checkbox"
                        checked={f.span_full}
                        onChange={(e) =>
                          handleUpdateField(f.id, { span_full: e.target.checked })
                        }
                      />
                      Span full width
                    </label>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    );
  }; 

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-100"> 
      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 

      {/* Top Buttons */}
      <div className="flex justify-between items-center px-10 py-4">
        {/* Back button */} 
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex gap-2 items-center p-2 rounded-full text-blue-700 bg-transparent hover:bg-white/10 hover:text-blue-400 transition"
        >
          <FaChevronLeft size={22} color="#1C64F2"/>
          Back to Review Form Template List
        </button>

        {/* Back button */} 
        <button
          type="button"
          onClick={handleNext}
          className="flex gap-2 items-center p-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Next → Map Indicators
          <FaChevronRight size={18} />
        </button> 
      </div>

      {/* Main Form Layout */}
      <main className="flex flex-1 justify-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="p-6"> 
            {/* Header Section */}
            <div className="flex justify-center items-start mb-4">
              <div className="flex justify-between items-start w-full max-w-5xl">
                {/* LEFT: Logo + Campus Info */}
                <div className="flex items-start space-x-4 w-[70%]">
                  <div>
                    <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-20 h-auto" />
                  </div>
                  <div>
                    <h1 className="text-md font-bold uppercase leading-tight ml-11 p-2 text-center">
                      University of Science and Technology of Southern Philippines
                    </h1>
                    <p className="text-sm mt-1 ml-11">
                      Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva
                    </p>
                  </div>
                </div>
                {/* RIGHT: Document Info Table */}
                <table className="text-xs text-center border border-gray-400 ml-20">
                  <thead>
                    <tr className="bg-[#001f5f] text-white">
                      <th colSpan={3} className="border border-gray-400 px-3 py-1 text-xs font-semibold">
                        Document Code No.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className="border border-gray-400 py-1 text-sm font-bold text-gray-700">
                        FM-USTP-ACAD-01
                      </td>
                    </tr>
                    <tr className="bg-[#001f5f] text-white">
                      <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Rev. No.</td>
                      <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Effective Date</td>
                      <td className="border border-gray-400 px-1.5 py-1 font-medium text-nowrap">Page No.</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-1">{formatRevisionNo(revisionNo)}</td>
                      <td className="border border-gray-400 px-1.5 py-1">{formatEffectiveDate(effectiveDate)}</td>
                      <td className="border border-gray-400 px-1.5 py-1">#</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-[#1A0A52]">SYLLABUS REVIEW FORM</h1>
            </div> 
          </div>

          {/* RFTemplate Metadata Form Fields */}
          <div className="px-6 my-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-sm mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Syllabus Review Form"
              />
            </div> 
            <div>
              <label className="block font-semibold text-sm mb-1">Revision No</label>
              <input
                type="number"
                value={revisionNo ?? ""}
                onChange={(e) => setRevisionNo(e.target.value ? parseInt(e.target.value) : null)}
                className="border rounded px-3 py-2 w-full"
                placeholder="0"
                min={0}
              />
            </div>
            <div>
              <label className="block font-semibold text-sm mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate || ""}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-sm mb-1">Description</label>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={handleTextareaChange}
                className="w-full border p-2 resize-none rounded-md"
                placeholder="Enter form description..."
                rows={2}
                required
              />
            </div>  
          </div>

          {/* 🟢 Added: Header Fields */}  
          <div className="mt-6 px-6">{renderFieldSection("header")}</div>

          {/* Directions */}
          <div className="px-6">
            <p className="mb-3 text-sm">
              <span className="font-semibold">Directions:</span> Check <b>YES</b> if an indicator is observed in the syllabus and <b>NO</b> if otherwise. Provide remarks to improve the content and alignment of the syllabus.
            </p>
          </div>

          {/* Editable Review Form Indicators Table */}
          <div className="px-6 relative overflow-visible">
            <div className="overflow-x-auto relative z-0">
              <table className="w-full border border-gray-300 text-sm relative z-0">
                <thead>
                  <tr className="bg-[#A1A1A1] text-center">
                    <th className="w-[60%] border px-3 py-2 font-semibold">INDICATORS</th>
                    <th className="w-[10%] border px-3 py-2 text-center font-semibold">YES</th>
                    <th className="w-[10%] border px-3 py-2 text-center font-semibold">NO</th>
                    <th className="w-[20%] border px-3 py-2 font-semibold">REMARKS</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        (No entries — use <strong>+ Add Row</strong> below)
                      </td>
                    </tr>
                  )}

                  {rows.map((r) => (
                    <React.Fragment key={r.id}>
                      <tr
                        className={`relative cursor-pointer hover:bg-blue-50 transition ${
                          selectedRow === r.id ? "bg-blue-50" : ""
                        } ${r.type === "header" ? "bg-gray-100 font-semibold" : ""}`}
                        onClick={() => handleRowClick(r.id)}
                        onMouseEnter={() => setHoveredRow(r.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="border px-3 py-3 align-top relative">
                          <input
                            value={r.text}
                            onChange={(e) => updateRow(r.id, { text: e.target.value })}
                            className="w-full bg-transparent outline-none"
                            placeholder={r.type === "header" ? "PART X. Section title..." : "Indicator text..."}
                          />
                          {hoveredRow === r.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddMenuFor((prev) => (prev === r.id ? null : r.id));
                              }}
                              className="absolute right-[2px] top-1/2 -translate-y-1/2 bg-blue-600 text-white text-center rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-700 shadow z-10"
                              title="Add row below"
                            >
                              +
                            </button>
                          )}
                        </td>

                        <td className="border px-3 py-3 text-center">
                          {r.type === "indicator" && (
                            <input
                              type="checkbox"
                              checked={!!r.yes}
                              onChange={(e) =>
                                updateRow(r.id, { yes: e.target.checked, no: e.target.checked ? false : r.no })
                              }
                            />
                          )}
                        </td>

                        <td className="border px-3 py-3 text-center">
                          {r.type === "indicator" && (
                            <input
                              type="checkbox"
                              checked={!!r.no}
                              onChange={(e) =>
                                updateRow(r.id, { no: e.target.checked, yes: e.target.checked ? false : r.yes })
                              }
                            />
                          )}
                        </td>

                        <td className="border px-3 py-3">
                          {r.type === "indicator" && (
                            <input
                              value={r.remarks || ""}
                              onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Add remarks"
                            />
                          )}
                        </td>
                      </tr>

                      {addMenuFor === r.id && (
                        <tr>
                          <td colSpan={4} className="border-none p-0 relative">
                            <div className="flex gap-2 justify-start p-2 bg-gray-50 border-t border-gray-300 relative z-50">
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                onClick={() => insertRowBelow(r.id, "header")}
                              >
                                + Header
                              </button>

                              <div className="relative">
                                <button
                                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                  onClick={() => setShowIndicatorPopup((prev) => !prev)}
                                >
                                  + Indicator
                                </button>

                                {showIndicatorPopup && (
                                  <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-[4px] shadow-lg p-2 flex gap-2 z-50">
                                    <input
                                      type="number"
                                      min="1"
                                      value={indicatorCount}
                                      onChange={(e) => setIndicatorCount(e.target.value)}
                                      className="border rounded px-2 py-1 w-24"
                                      placeholder="number of rows"
                                    />
                                    <button
                                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                      onClick={() => {
                                        const count = parseInt(indicatorCount) || 1;
                                        insertRowBelow(r.id, "indicator", count);
                                        setIndicatorCount("");
                                        setShowIndicatorPopup(false);
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>

                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                onClick={() => deleteRow(r.id)}
                              >
                                Delete Row
                              </button>

                              <button
                                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                                onClick={() => setAddMenuFor(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-gray-600 mt-2">
                {rows.filter(r => r.type === "header").length} header(s), {rows.filter(r => r.type === "indicator").length} indicator(s)
              </div>
            </div>

            {/* Add Buttons Below Table */}
            <div className="flex items-center gap-3 mt-4">
              <div className="text-sm">Add row:</div>
              <button
                onClick={() => addRowAtEnd("header")}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                + Header
              </button>
              <button
                onClick={() => addRowAtEnd("indicator")}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                + Indicator
              </button>
            </div>
 
            {/* <div className="mt-8">
              <p className="font-semibold">Please check the appropriate plan of action:</p>
              <p className="mt-2">
                <span className="font-bold">For revision</span>{" "}
                <span className="inline-block border-b border-black w-40"></span>{" "}
                <span className="text-sm italic">
                  (please see remarks column for indicator(s) marked “no”)
                </span>
              </p>
              <p className="mt-2">
                <span className="font-bold">Approved for implementation</span>{" "}
                <span className="inline-block border-b border-black w-40"></span>{" "}
                <span className="text-sm italic">(all indicators must be marked “yes”)</span>
              </p>
            </div>
 
            <div className="mt-8">
              <p className="mb-4">Reviewed by:</p>

              <div className="mb-8">
                <p className="font-bold"> </p>
                <div className="border-t border-black w-80"></div>
                <p className="italic text-sm">Program Chairman/Unit Coordinator</p>
              </div>

              <div>
                <p className="font-bold"> </p>
                <div className="border-t border-black w-80"></div>
                <p className="italic text-sm">Date of review</p>
              </div>
            </div> */}
          </div>
          
          {/* 🟢 Added: Footer Fields */}
          <div className="mt-6 px-6">{renderFieldSection("footer")}</div> 

          {/* Review Form Bottom Information */}
          <div className="mt-6 px-6 text-sm font-medium">    
            <p className="mb-2 text-gray-400 italic text-sm font-base">Reviewed by and date of review is a field of the Review Form actual record table and not from the Review Form Template table (It's a charField from SRFForm mode and not enabled to be modified inside this page of ReviewFormTemplate).</p> 
            <p className="mb-4">Reviewed by:</p> 
            <div className="mb-8">
              <p className="font-bold"></p>
              <div className="border-t border-black w-80"></div>
              <p className="italic text-sm">Program Chairman/Unit Coordinator</p>
            </div>

            <div>
              <p className="font-bold"></p>
              <div className="border-t border-black w-80"></div>
              <p className="italic text-sm">Date of review</p>
            </div> 
          </div>
        </div>
      </main>  
    </div>
  );
}