import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaClipboardCheck, FaTimes} from "react-icons/fa"; 
import type { Syllabus } from "../../../types/syllabus"; 
import { createEmptySyllabus } from "../../../utils/factories";
import api from "../../../api";
  
type YesNo = "yes" | "no";

interface ReviewItem {
  id: number;
  text: string;
  response: YesNo | null;
  remarks: string;
  isBullet?: boolean;
  part: string; // <-- added for grouping
}
 
const itemsPartI: ReviewItem[] = [
  {
    id: 1,
    text:
      "1. The syllabus follows the prescribed OBE syllabus format of the University and include the following:",
    response: null,
    remarks: "",
    part: "Part I",
  },
  {
    id: 2,
    text: "• Name of the College/Campus is indicated below the University name/brand.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 3,
    text: "• Program, Course Title, Course Code and Unit Credits are specified in the syllabus.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 4,
    text: "• Pre-requisites and co-requisites are indicated.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 5,
    text: "• Semester, Academic Year, Schedule of Course, Building and Room Number are stipulated in the syllabus.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 6,
    text: "• Contact details of the instructor such as the instructor’s name, email address OR mobile number (optional) are specified in the syllabus.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 7,
    text: "• Instructor’s consultation schedules, office or consultation venue, office phone number is indicated in the syllabus.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
  {
    id: 8,
    text: "• The University’s Vision and Mission are indicated in the syllabus.",
    response: null,
    remarks: "",
    isBullet: true,
    part: "Part I",
  },
];
 
const itemsPartII: ReviewItem[] = [
  {
    id: 9,
    text:
      "2. The course description stipulates its relevance to the curriculum in general and provides an overview of the course content.",
    response: null,
    remarks: "",
    part: "Part II",
  },
  {
    id: 10,
    text:
      "3. The Approved Program Educational Objectives (PEO) and Program Outcomes (PO) are listed with alphabets in the syllabus (which will be referred to in the mapping of the course outcomes).",
    response: null,
    remarks: "",
    part: "Part II",
  },
];
 
const itemsPartIII: ReviewItem[] = [
  {
    id: 11,
    text:
      "4. The course outcomes are measurable and aligned with the course description and program outcomes.",
    response: null,
    remarks: "",
    part: "Part III",
  },
  {
    id: 12,
    text:
      "5. The course outcomes are mapped accordingly to the program outcomes/GELOs using the markers: i - introductory, e - enabling, and d - demonstrative.",
    response: null,
    remarks: "",
    part: "Part III",
  },
];
 
const itemsPartIV: ReviewItem[] = [
  {
    id: 13,
    text: "6. The course outline indicates the number of hours.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 14,
    text: "7. Topics are assigned to intended learning outcomes (ILO).",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 15,
    text: "8. Suggested readings are provided.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 16,
    text: "9. The Teaching-Learning Activities (TLAs) are indicated in the outline.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 17,
    text: "10. Assessment tools are indicated.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 18,
    text: "11. Rubrics are attached for all outputs/requirements.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
  {
    id: 19,
    text: "12. The grading criteria are clearly stated in the syllabus.",
    response: null,
    remarks: "",
    part: "Part IV",
  },
];

const checklistItems: ReviewItem[] = [
  ...itemsPartI,
  ...itemsPartII,
  ...itemsPartIII,
  ...itemsPartIV,
];

export default function SyllabusReviewChecklist() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  
  const [syllabus, setSyllabus] = useState<Syllabus>(createEmptySyllabus());
   
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>(checklistItems);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const navigate = useNavigate();
 
  useEffect(() => {
    if (!syllabusId) return;
    api.get(`/syllabi/${syllabusId}/?role=${role}`)
      .then((res) => setSyllabus(res.data))
      .catch((err) => console.error(err));
  }, [syllabusId]); 
  
  const handleCheckAllYes = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        response: "yes",
        remarks: "", // clear remarks
      }))
    );
  };

  const handleChange = (id: number, field: "response" | "remarks", value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "response") {
          if (value === "yes") {
            return { ...item, response: "yes", remarks: "" };  
          }
          if (value === "no") {
            return { ...item, response: "no" }; 
          }
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleReview = async (decision: "approve" | "reject") => {
    if (!syllabusId) return;

    const newErrors: Record<number, string> = {};

    // ✅ Validation rules
    if (decision === "approve") {
      // Check all answered
      items.forEach((item) => {
        if (item.response === null) {
          newErrors[item.id] = "Response required";
        } else if (item.response !== "yes") {
          newErrors[item.id] = "All must be YES to approve";
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        alert("Please fix validation errors before approving.");
        return;
      }
    }

    if (decision === "reject") {
      items.forEach((item) => {
        if (item.response === null) {
          newErrors[item.id] = "Response required";
        } else if (item.response === "no" && !item.remarks.trim()) {
          newErrors[item.id] = "Remarks required for NO responses";
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        alert("Please fix validation errors before rejecting.");
        return;
      }
    }

    // ✅ Clear errors if validation passes
    setErrors({});

    try {
      if (decision === "approve") {
        const srf_no = items.map((item) => item.id);
        
        await api.post(`/syllabi/${syllabusId}/review-syllabus-chair/?role=${role}`, {
          decision: "approve",
          srf_no,
        });

      } else { 
        const srf_no = items.map((item) => item.id);
        const srf_yes_no = items.map((item) => item.response === "yes");
        const srf_remarks = items.map((item) => item.remarks);

        await api.post(`/syllabi/${syllabusId}/review-syllabus-chair/?role=${role}`, {
          decision: "reject",
          srf_no,
          srf_yes_no,
          srf_remarks,
        });
      }

      alert(`Syllabus ${decision}ed successfully!`);
      setOpen(false);
      navigate(-1);

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Something went wrong");
    }
  };

  // group items by part
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.part]) acc[item.part] = [];
    acc[item.part].push(item);
    return acc;
  }, {} as Record<string, ReviewItem[]>);

  if (!syllabus) return <p>Loading...</p>;

  return (
    <div className="font-thin min-h-screen my-14">
      {/* Folder tab button (only shows when panel is closed) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-16 right-0 z-50 h-12 px-4 rounded-l-lg shadow-md flex items-center justify-center text-white transition-colors duration-300 bg-blue-600 hover:bg-blue-700"
        >
          <FaClipboardCheck size={20} />
        </button>
      )}

      {/* Slide-in checklist panel */}
      <div
        className={`fixed mt-5  top-0 right-0 h-full w-[60%] md:w-[40%] bg-white shadow-xl border-l transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-[92%] flex flex-col mb-4">
          {/* Close button on left side inside panel */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Syllabus Review Checklist</h2>

            <div className="flex gap-2">
              <button
                onClick={handleCheckAllYes}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Check All Yes
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>

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
                        <td
                          className={`border px-3 py-2 ${
                            item.isBullet ? "pl-6" : ""
                          }`}
                        >
                          {item.text}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="radio"
                            name={`response-${item.id}`}
                            value="yes"
                            checked={item.response === "yes"}
                            onChange={() =>
                              handleChange(item.id, "response", "yes")
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
                              handleChange(item.id, "response", "no")
                            }
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            className={`w-full border rounded px-2 py-1 text-sm ${
                              errors[item.id] ? "border-red-500" : "border-gray-300"
                            }`}
                            value={item.remarks}
                            onChange={(e) => handleChange(item.id, "remarks", e.target.value)}
                            placeholder={item.response === "no" ? "Enter remarks" : ""}
                            disabled={item.response === "yes"} 
                          />
                          {errors[item.id] && (
                            <p className="text-red-500 text-xs mt-1">{errors[item.id]}</p>
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
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => handleReview("approve")}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleReview("reject")}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* SYLLABUS SECTION */}
      <div className="mx-auto mt-6 w-11/12 border-[3px] border-black bg-white font-serif text-sm p-4 relative">
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
                      <td className="border border-gray-400 px-2 py-1">{syllabus.version}</td>
                      <td className="border border-gray-400 px-2 py-1">{new Date(syllabus.effective_date).toLocaleDateString()}</td>
                      <td className="border border-gray-400 px-2 py-1">#</td>
                  </tr>
                  </tbody>
              </table>
            </div>
        </div>

        {/* SYLLABUS TABLE */}
        <table className="mt-2 mx-auto border-2 border-solid w-10/12 font-serif text-sm bg-white">
            <tbody>
            {/* 1st Header */}
            <tr>
                <th colSpan={2} className="font-medium border-1 border-solid px-4 relative border-black">
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
                            Semester/Year: {syllabus.course.course_semester.toLowerCase()} Semester -  SY{syllabus.bayanihan_group.school_year}<br />
                            Class Schedule: {syllabus.class_schedules} <br />
                            Bldg./Rm. No. {syllabus.building_room}
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
                            Phone:{" "}
                            {syllabus.instructors.map((inst, idx) => (
                                <span key={idx}>{inst.user.phone}{idx < syllabus.instructors.length - 1 ? ", " : ""}</span>
                            ))}
                            <br />
                          </td>
                          <td className="border-2 border-solid font-medium text-left px-4 relative border-black">
                            Consultation Schedule: {syllabus.consultation_hours}<br />
                            Bldg rm no: {syllabus.consultation_room}
                          </td>
                      </tr>
                      <tr>
                          <td colSpan={2} className="items-start border-2 border-solid font-medium text-left px-4 relative border-black">
                            <span className="text-left font-bold">I. Course Description:</span>
                            <br />
                            {syllabus.course_description}
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
