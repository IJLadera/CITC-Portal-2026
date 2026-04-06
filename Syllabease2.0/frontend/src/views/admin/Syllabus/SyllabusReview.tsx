import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { FaClipboardCheck, FaTimes} from "react-icons/fa"; 
import { toast, ToastContainer } from "react-toastify";
import type { Syllabus } from "../../../types/syllabus"; 
import { createEmptySyllabus } from "../../../utils/factories";
import api from "../../../api";
  
type YesNo = "yes" | "no";

interface ReviewItem {
  id: number;
  type: "part" | "indicator";
  text: string;
  response: YesNo | null;
  remarks: string;
  order: number;
}  

interface ReviewField {
  id: number;
  label: string;
  field_type: "text" | "textarea" | "date"; 
  value: string;
  is_required: boolean;
  position: string;
}  

export default function SyllabusReview() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const navigate = useNavigate();
  
  const [syllabus, setSyllabus] = useState<Syllabus>(createEmptySyllabus());
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({}); 
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({}); 
  const [open, setOpen] = useState(true); 
 
  useEffect(() => {
    if (!syllabusId) return;

    api
      .get(`/syllabi/${syllabusId}/?role=${role}`)
      .then((res) => setSyllabus(res.data))
      .catch((err) => console.error(err));
 
    api
      .get("/review-templates/latest-active/")
      .then((res) => {
        const form = res.data;
        setTemplateId(form.id);

        // Group indicators under their preceding "part" 
        const structured: ReviewItem[] = form.items.map((item: any) => ({
          id: item.id,
          text: item.text,
          type: item.type,
          response: null,
          remarks: "",
          order: item.order,
        }));
        setItems(structured);

        const reviewFields: ReviewField[] = form.fields
          .filter((item: any) => item.prefill_source === "none")
          .map((item: any) => ({
            id: item.id,
            label: item.label,
            field_type: item.field_type,
            is_required: item.is_required, 
            position: item.position,
            value: "", 
          }));  
        setFields(reviewFields);
      })
      .catch((err) => {
        console.error("Failed to load review form template:", err)
        toast.error("Failed to load review form template:", err)
      });
  }, [syllabusId]);

  /** 🟢 Handle marking all indicators as YES */
  const handleCheckAllYes = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.type === "indicator" ? { ...item, response: "yes", remarks: "" } : item
      )
    );
  };

  /** 🟢 Handle individual checkbox or remarks changes */
  const handleItemChange = (id: number, field: "response" | "remarks", value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.type !== "indicator") return item;

        if (field === "response") {
          if (value === "yes") return { ...item, response: "yes", remarks: "" };
          if (value === "no") return { ...item, response: "no" };
        }
        return { ...item, [field]: value };
      })
    );
  }; 

  /** 🟢 Handle field value changes */
  const handleFieldChange = (id: number, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  /** 🟢 Handle Approve/Reject submission */
  const handleSyllabusReview = async (decision: "approve" | "reject") => {
    if (!syllabusId || !templateId) return;

    const newErrors: Record<number, string> = {};
    const fieldErrors: Record<number, string> = {};

    // Validation
    if (decision === "approve") {
      items.forEach((item) => {
        if (item.type === "indicator" && item.response !== "yes") {
          newErrors[item.id] = "All must be marked YES to approve.";
        }
      });
    } else if (decision === "reject") {
      const allYes = items
        .filter((item) => item.type === "indicator")
        .every((item) => item.response === "yes");

      if (allYes) {
        toast.warn("Cannot reject when all responses are YES.");
        return
      } else {
        items.forEach((item) => {
          if (item.type === "indicator" && item.response === null) {
            newErrors[item.id] = "Response required.";
          } else if (item.response === "no" && !item.remarks.trim()) {
            newErrors[item.id] = "Remarks required for NO responses.";
          }
        });
      }
    } 

    // ✅ Field validation
    fields.forEach((field) => {
      const value = field.value?.toString().trim() ?? "";
      if (field.is_required && !value) {
        fieldErrors[field.id] = `${field.label} is required.`;
      }
    });

    // ✅ Apply errors
    if (Object.keys(newErrors).length || Object.keys(fieldErrors).length) {
      setErrors(newErrors);
      setFieldErrors(fieldErrors);
      toast.warn("Please fix validation errors before submitting.");
      return;
    }

    setErrors({});
    setFieldErrors({});

    // Build payload
    const payload = {
      syllabus_id: syllabusId,
      action: decision === "approve" ? 1 : 0, // 1=approve, 0=reject
      checklist: items
        .filter((item) => item.type === "indicator")
        .map((item) => ({
          item: item.id,
          response: item.response,
          remarks: item.remarks,
        })),
      fields: fields.map((f) => ({
        field: f.id,
        value: f.value,
      })),
    };

    try {
      await api.post(`/syllabi/${syllabusId}/review/?role=${role}`, payload);
      toast.success(`Syllabus ${decision}ed successfully!`);
      setOpen(false);
      navigate(-1);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(err.response?.data?.detail || "Something went wrong.");
    }
  };

  /** 🟢 Render grouped parts + indicators */
  const grouped = items.reduce((acc, item) => {
    if (item.type === "part") {
      acc[item.text] = [];
    } else if (item.type === "indicator") {
      const lastPart = Object.keys(acc).at(-1) || "General";
      if (!acc[lastPart]) acc[lastPart] = [];
      acc[lastPart].push(item);
    }
    return acc;
  }, {} as Record<string, ReviewItem[]>);
  
  // Derived states
  const indicatorItems = items.filter((i) => i.type === "indicator");

  // Check if all have been answered (no null responses)
  const allAnswered = indicatorItems.every((i) => i.response !== null);

  // Check if all are YES
  const allYes = indicatorItems.every((i) => i.response === "yes");

  // Dynamic button properties
  const action = allYes ? "approve" : "reject";
  const buttonLabel = allYes ? "Approve Syllabus" : "Reject Syllabus";
  const buttonColor = allYes
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-600 hover:bg-red-700";

  if (!syllabus) return <p>Loading...</p>;

  return (
    <div className="font-thin min-h-screen my-14"> 
      <ToastContainer position="top-right" autoClose={2000} theme="colored"/> 

      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-16 right-0 z-50 h-12 px-4 rounded-l-lg shadow-md flex items-center justify-center text-white transition-colors duration-300 bg-blue-600 hover:bg-blue-700"
        >
          <FaClipboardCheck size={20} />
        </button>
      )}

      {/* Slide-in Review Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[60%] md:w-[45%] bg-white shadow-xl border-l transform transition-transform duration-300 z-[60] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-[100%] flex flex-col mb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Syllabus Review</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCheckAllYes}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Check all YES
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Review Fields Section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-blue-700 mb-3">Review Information</h3> 

            {/* Sort: header first, then footer */}
            {(() => {
              const sortedFields = [...fields].sort((a, b) => {
                if (a.position === "header" && b.position === "footer") return -1;
                if (a.position === "footer" && b.position === "header") return 1;
                return 0;
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedFields.map((field) => (
                    <div key={field.id} className="flex flex-col">
                      <label className="font-medium text-sm mb-1">
                        {field.label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.field_type === "text" && (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`border rounded px-2 py-1 ${
                            fieldErrors[field.id] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      )}

                      {field.field_type === "textarea" && (
                        <textarea
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`border rounded px-2 py-1 ${
                            fieldErrors[field.id] ? "border-red-500" : "border-gray-300"
                          }`}
                          rows={3}
                        />
                      )}

                      {field.field_type === "date" && (
                        <input
                          type="date"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`border rounded px-2 py-1 ${
                            fieldErrors[field.id] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      )}

                      {fieldErrors[field.id] && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Checklist Table */}
          <div className="flex-1 overflow-auto">
            {Object.entries(grouped).map(([part, partItems]) => (
              <div key={part} className="mb-6">
                <h3 className="font-semibold text-blue-700 mb-2">{part}</h3>
                <table className="w-full border border-gray-300 text-sm mb-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="w-[400px] border px-3 py-2 font-semibold text-left">
                        INDICATORS
                      </th>
                      <th className="w-[60px] border px-3 py-2 font-semibold text-center">
                        YES
                      </th>
                      <th className="w-[60px] border px-3 py-2 font-semibold text-center">
                        NO
                      </th>
                      <th className="w-[200px] border px-3 py-2 font-semibold text-left">
                        REMARKS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partItems.map((item) => (
                      <tr key={item.id}>
                        <td className="border px-3 py-2">{item.text}</td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="radio"
                            name={`response-${item.id}`}
                            value="yes"
                            checked={item.response === "yes"}
                            onChange={() =>
                              handleItemChange(item.id, "response", "yes")
                            }
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="radio"
                            name={`response-${item.id}`}
                            value="no"
                            checked={item.response === "no"}
                            onChange={() =>
                              handleItemChange(item.id, "response", "no")
                            }
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            className={`w-full border rounded px-2 py-1 text-sm ${
                              errors[item.id]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            value={item.remarks}
                            onChange={(e) =>
                              handleItemChange(item.id, "remarks", e.target.value)
                            }
                            placeholder={
                              item.response === "no" ? "Enter remarks" : ""
                            }
                            disabled={item.response === "yes"}
                          />
                          {errors[item.id] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[item.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => handleSyllabusReview(action)}
              disabled={!allAnswered}
              className={`px-4 py-2 rounded-md text-white ${
                allAnswered ? buttonColor : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Optional overlay div for better visual effect & click blocking */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 transition-opacity opacity-50 duration-300 z-[50]"
          onClick={() => setOpen(false)} // optional: clicking outside closes the panel
        ></div>
      )}

      {/* SYLLABUS SECTION */}
      <div className="mx-auto mt-6 w-11/12 border-[3px] border-black bg-white font-serif text-sm p-4 relative ">
        {/* SYLLABUS HEADER SECTION */}
        <div className="flex justify-center items-start mb-4">
            <div className="flex justify-between items-start w-full max-w-5xl">
              {/* LEFT: Logo + Campus Info */}
              <div className="flex items-start space-x-4 w-[70%]">
                  <div>
                  <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-20 h-auto" />
                  </div>
                  <div>
                  <h1 className="text-md font-bold uppercase leading-tight ml-11 p-2">
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
                  <tr className="bg-[#5A6E99] text-white">
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
                  <tr className="bg-[#5A6E99] text-white">
                      <td className="border border-gray-400 px-2 py-1 font-medium">Rev. No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-medium">Effective Date</td>
                      <td className="border border-gray-400 px-2 py-1 font-medium">Page No.</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">{formatRevisionNo(syllabus.syllabus_template?.revision_no)}</td>
                    <td className="border border-gray-400 px-2 py-1">{formatEffectiveDate(syllabus.syllabus_template?.effective_date)}</td>
                    <td className="border border-gray-400 px-2 py-1">#</td>
                  </tr>
                  </tbody>
              </table>
            </div>
        </div>

        {/* SYLLABUS TABLE */}
        <table className="mt-2 mx-auto border-2 border-solid border-black w-10/12 text-sm bg-white font-[Times-New-Roman]">
            <tbody>
            {/* 1st Header */}
            <tr>
                <th colSpan={2} className="font-medium border-2 border-solid px-4 relative border-black">
                  <span className="font-bold">{syllabus.college.college_description}</span>
                  <br />
                  {syllabus.program.department.department_name}
                </th>
                <th className="font-medium border-2 border-solid border-black text-left px-4 w-2/6 relative">
                  <span className="font-bold underline underline-offset-4">Syllabus<br /></span>
                  Course Title: <span className="font-bold">{syllabus.course.course_title}<br /></span>
                  Course Code: {syllabus.course.course_code}<br />
                  Credits: {syllabus.course.course_credit_unit} units ({syllabus.course.course_hrs_lec} hours lecture, {syllabus.course.course_hrs_lab} hrs Laboratory)<br />
                </th>
            </tr>
            {/* 2nd Header */}
            <tr>
                <td className="border-2 border-solid font-medium text-sm border-black text-left px-4  align-top relative">
                {/* VISION */}
                <div className="mt-2 mb-8 border-black">
                    <span className="font-bold">USTP Vision<br /><br /></span>
                    <p>The University is a nationally recognized Science and Technology University providing the vital link between education and the economy.</p>
                </div>
                {/* MISSION */}
                <div className="mb-8 relative">
                    <span className="font-bold">USTP Mission<br /><br /></span>
                    <ul className="list-disc ml-8">
                    <li>Bring the world of work (industry) into the actual higher education and training of students;</li>
                    <li>Offer entrepreneurs the opportunity to maximize their business potentials through a gamut of services from product conceptualization to commercialization;</li>
                    <li>Contribute significantly to the National Development Goals of food security an energy sufficiency through technological solutions.</li>
                    </ul>
                </div>
                {/* PEO */}
                <div className="mb-8 relative border-black">
                    <span className="font-bold">Program Educational Objectives<br /><br /></span>
                    {syllabus.peos.map((peo) => (
                    <div className="mb-2" key={peo.id}>
                        <p><span className="font-semibold">{peo.peo_code}: </span>{peo.peo_description}</p>
                    </div>
                    ))}
                </div>
                {/* Program Outcomes */}
                <div className="mb-8 border-black">
                    <span className="font-bold">Program Outcomes<br /><br /></span>
                    {syllabus.program_outcomes.map((po) => (
                    <div className="mb-5" key={po.id}>
                        <p><span className="font-semibold leading-relaxed">{po.po_letter}: </span>{po.po_description}</p>
                    </div>
                    ))}
                </div>
                <table className="table-auto border-2 mb-5 border-black">
                    <thead className="border-2">
                    <tr>
                        <th className="border-2 text-center py-1 border-black">Code</th>
                        <th className="border-2 text-center border-black ">Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className="border-2 text-center py-2 border-black">I</td>
                        <td className="border-2 text-center border-black">Introductory Course</td>
                    </tr>
                    <tr>
                        <td className="border-2 text-center py-2 border-black">E</td>
                        <td className="border-2 text-center border-black">Enabling Course</td>
                    </tr>
                    <tr>
                        <td className="border-2 text-center py-2 border-black">D</td>
                        <td className="border-2 text-center border-black">Demonstrative Course</td>
                    </tr>
                    <tr className="font-semibold ">
                        <td className="border-2 text-center py-1 border-black">Code</td>
                        <td className="border-2 text-center border-black">Definition</td>
                    </tr>
                    <tr>
                        <td className="border-2 text-center py-5 border-black">I</td>
                        <td className="border-2 text-center border-black">An introductory course to an outcome</td>
                    </tr>
                    <tr>
                        <td className="border-2 text-center py-5 border-black">E</td>
                        <td className="border-2 text-center border-black">A course strengthens an outcome</td>
                    </tr>
                    <tr>
                        <td className="border-2 text-center py-5 border-black">D</td>
                        <td className="border-2 text-center border-black">A Course demonstrating an outcome</td>
                    </tr>
                    </tbody>
                </table>
                </td>

                <td colSpan={2} className="w-[10/12] align-top border-black">
                  <table className="my-4 mx-2">
                    <tbody>
                      <tr>
                          <td className="border-2 border-solid border-black font-medium text-left px-4 w-1/2 relative">
                            Semester/Year: {syllabus.course.course_semester.toLowerCase()} Semester -  SY {syllabus.bayanihan_group.school_year}
                            <br />
                            <span className="whitespace-pre-line">
                              Class Schedule: {syllabus.class_schedules}
                            </span>
                            <br /> 
                            <span className="whitespace-pre-line">
                              Bldg./Rm. No.: {syllabus.building_room}
                            </span>
                          </td>
                          <td className="border-2 border-solid font-medium text-start text-top px-4 relative border-black">
                            Pre-requisite(s): {syllabus.course.course_pre_req} <br />
                            Co-requisite(s): {syllabus.course.course_co_req}
                          </td>
                      </tr>
                      <tr>
                          <td className="items-start border-2 border-solid font-medium text-left px-4 relative border-black">
                            Instructor:{" "}
                            {syllabus.instructors.map((inst, idx) => (
                                <span className="font-bold" key={idx}>
                                {idx > 0 && idx === syllabus.instructors.length - 1
                                    ? " and "
                                    : idx > 0
                                    ? ", "
                                    : ""}
                                {inst.user.first_name} {inst.user.last_name}
                                </span>
                            ))}
                            <br />
                            Email:{" "}
                            {syllabus.instructors.map((inst, idx) => (
                                <span key={idx}>{inst.user.email}{idx < syllabus.instructors.length - 1 ? ", " : ""}</span>
                            ))}
                            <br /> 
                            <span className="whitespace-pre-line">  
                              Mobile No.: {syllabus.class_contact} 
                            </span>  
                          </td>
                          <td className="border-2 border-solid font-medium text-left px-4 relative border-black"> 
                            <span className="whitespace-pre-line"> 
                              Consultation Schedule: {syllabus.consultation_hours}
                            </span>
                            <br />
                            <span className="whitespace-pre-line"> 
                              Bldg rm no: {syllabus.consultation_room}
                            </span>
                            <br />
                            <span className="whitespace-pre-line"> 
                              Office Phone No./Local: {syllabus.consultation_contact}
                            </span>
                          </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="items-start border-2 border-solid font-medium text-left px-4 relative border-black">
                          <span className="text-left font-bold">I. Course Description:</span>
                          <br /> 
                          <span className="whitespace-pre-line">  
                            {syllabus.course_description}
                          </span>
                        </td>
                      </tr>
                      {/* Course Outcomes Table */}
                      <tr>
                          <td colSpan={2} className="border-2 border-solid font-medium px-4 relative border-black">
                            <span className="text-left font-bold">II. Course Outcome:</span> 
                            <table className="m-10 mx-auto border-2 border-solid w-full">
                              <thead>
                                <tr className="border-2 border-solid border-black"> 
                                  <th className="border-2 border-solid border-black align-middle" rowSpan={2}>
                                    Course Outcomes (CO)
                                  </th>
                                  <th
                                    className="border-2 border-solid border-black text-center"
                                    colSpan={syllabus.program_outcomes.length}
                                  >
                                    Program Outcomes (PO)
                                  </th>
                                </tr>

                                <tr className="border-2 border-solid border-black">
                                  {syllabus.program_outcomes.map((po, idx) => (
                                    <th
                                      key={po.id}
                                      className="border-2 border-solid border-black text-center w-10"
                                    > 
                                      {po.po_letter}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {syllabus.course_outcomes.map((co) => (
                                    <tr key={co.id} className="border-2 border-solid border-black">
                                      <td className="w-64 text-left font-medium px-2">
                                        <span className="font-bold">{co.co_code} : </span>
                                        {co.co_description}
                                      </td>
                                      {syllabus.program_outcomes.map((po) => (
                                        <td className="border-2 border-solid font-medium text-center py-1 border-black" key={po.id}>
                                        {syllabus.syllcopos.filter((copo) =>
                                                copo.program_outcome.id === po.id &&
                                                copo.course_outcome.id === co.id
                                            )
                                            .map((copo) => copo.syllabus_co_po_code)
                                            .join(", ")}
                                        </td>
                                      ))}
                                    </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                      </tr>
                      {/* Course Outline Table */}
                      <tr>
                        <td colSpan={2} className="border-2 border-solid font-medium px-4 border-black">
                          <span className="text-left font-bold">III. Course Outline:</span>
                          <br />
                          <table className="m-5 mx-auto border-2 border-solid w-full border-black">
                              <thead>
                                <tr className="border-2 border-solid border-black">
                                  <th className="border-2 border-solid border-black">Allotted Time</th>
                                  <th className="border-2 border-solid border-black">Course Outcomes (C)</th>
                                  <th className="border-2 border-solid border-black">Intended Learning Outcome (ILO)</th>
                                  <th className="border-2 border-solid border-black">Topics</th>
                                  <th className="border-2 border-solid border-black">Suggested Readings</th>
                                  <th className="border-2 border-solid border-black">Teaching Learning Activities</th>
                                  <th className="border-2 border-solid border-black">Assessment Tasks/Tools</th>
                                  <th className="border-2 border-solid border-black">Grading Criteria</th>
                                  <th className="border-2 border-solid border-black">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {syllabus.course_outlines
                                  .filter(cot => cot.syllabus_term === "MIDTERM")
                                  .sort((a, b) => a.row_no - b.row_no) // ✅ sort by row_no ascending
                                  .map((cot, idx) => (
                                    <tr key={cot.id} className="border-2 border-solid hover:bg-blue-100">
                                      <td className="border-2 border-solid p-2 border-black">{cot.allotted_time}, {cot.allotted_hour}</td>
                                      <td className="border-2 border-solid p-2 border-black">
                                          {cot.cotcos.map((co, i) => (
                                          <span key={i}>
                                              {co.course_outcome.co_code}
                                              {i < cot.cotcos.length - 1 ? ", " : ""}
                                          </span>
                                          ))}
                                      </td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.intended_learning}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.topics}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.suggested_readings}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.learning_activities}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.assessment_tools}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.grading_criteria}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.remarks}</td>
                                    </tr>
                                ))}
                                <tr className="border-2 border-solid p-2">
                                  <th colSpan={10} className="border-2 border-solid font-medium px-4 border-black">
                                    MIDTERM EXAMINATION
                                  </th>
                                </tr>
                                {syllabus.course_outlines
                                  .filter(cot => cot.syllabus_term === "FINALS")
                                  .sort((a, b) => a.row_no - b.row_no) // ✅ sort by row_no ascending
                                  .map((cot, idx) => (
                                    <tr key={cot.id} className="border-2 border-solid hover:bg-blue-100">
                                      <td className="border-2 border-solid p-2 border-black">{cot.allotted_time}, {cot.allotted_hour}</td>
                                      <td className="border-2 border-solid p-2 border-black">
                                          {cot.cotcos.map((co, i) => (
                                          <span key={i}>
                                              {co.course_outcome.co_code}
                                              {i < cot.cotcos.length - 1 ? ", " : ""}
                                          </span>
                                          ))}
                                      </td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.intended_learning}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.topics}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.suggested_readings}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.learning_activities}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.assessment_tools}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.grading_criteria}</td>
                                      <td className="border-2 border-solid p-2 border-black">{cot.remarks}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <th colSpan={10} className="border-2 border-solid font-medium px-4 border-black">
                                      FINAL EXAMINATION
                                    </th>
                                </tr>
                              </tbody>
                          </table>
                        </td>
                      </tr>
                      {/* Course Requirements */}
                      <tr className="crq border-2">
                        <td colSpan={2} className="border-2 border-solid font-medium relative border-blackp px-1">
                          <span className="text-left font-bold">IV. Course Requirements:</span>
                          <br />
                          <div
                            className="crq prose max-w-none" 
                            dangerouslySetInnerHTML={{ __html: syllabus.course_requirements || "" }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 m-3">
                    {/* Prepared By */}
                    <div>
                      <div className="flex justify-center">Prepared By:</div>
                      {syllabus.bayanihan_group.bayanihan_members
                        .filter(bm => bm.role === "LEADER")
                        .map((instructor, idx) => (
                          <div className="mt-15 relative" key={idx}>
                            <div className="flex justify-center font-semibold underline mt-2 text-center">
                              {[
                                instructor?.user?.prefix,
                                instructor?.user?.first_name,
                                instructor?.user?.last_name,
                                instructor?.user?.suffix,
                              ]
                                .filter(Boolean) 
                                .map((part) => part!.toUpperCase())
                                .join(" ")}
                            </div>
                            {/* Overlayed Signature */}
                            {syllabus.chair_submitted_at && instructor?.user?.signature && (
                              <img
                                src={instructor.user.signature}
                                alt="Instructor Signature"
                                className="h-14 object-contain absolute inset-0 mx-auto -top-10"
                              />
                            )}
                            <div className="flex justify-center">Instructor</div>
                          </div>
                      ))}
                    </div>

                    {/* Chair */}
                    <div>
                      <div className="font-medium">Checked and Recommended for Approval:</div>
                      <div className="mt-10 relative">
                        <div className="font-semibold underline text-center relative">
                          {syllabus?.chair?.name?.toUpperCase() || ""}
                        </div>
                        {syllabus.dean_submitted_at && syllabus?.chair?.signature && (
                          <img
                            src={syllabus.chair.signature}
                            alt="Chair Signature"
                            className="h-14 object-contain absolute inset-0 mx-auto -top-10"
                          />
                        )}
                        <div className="">
                          Department Chair, {syllabus?.program?.department?.department_code || ""}
                        </div>
                      </div>
                    </div>

                    {/* Dean */}
                    <div>
                      <div className="font-medium">Approved by:</div>
                      <div className="mt-10 relative">
                        <div className="font-semibold underline text-center relative">
                          {syllabus?.dean?.name?.toUpperCase() || ""}
                        </div>
                        {syllabus.dean_approved_at && syllabus?.dean?.signature && (
                          <img
                            src={syllabus.dean.signature}
                            alt="Dean Signature"
                            className="h-14 object-contain absolute inset-0 mx-auto -top-10"
                          />
                        )}
                        <div className="">
                          Dean, {syllabus?.college?.college_code || ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
        </table> 
      </div> 
    </div>
  );
}
