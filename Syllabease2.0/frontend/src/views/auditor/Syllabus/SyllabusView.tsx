import { useState, useEffect } from "react"; 
import { useNavigate, useParams } from "react-router-dom";   
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { X } from "lucide-react";
import { Spinner } from "flowbite-react";
import type { Syllabus } from "../../../types/syllabus"; 
import { createEmptySyllabus } from "../../../utils/factories";
import api from "../../../api";
import { FaChevronLeft, FaChevronUp } from "react-icons/fa";
import type { User } from "@/types/bayanihan";

export default function SyllabusView() { 
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  
  const [syllabus, setSyllabus] = useState<Syllabus>(createEmptySyllabus());  
  const [loading, setLoading] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState(false); 

  const [feedbackModal, setFeedbackModal] = useState(false);

  const navigate = useNavigate(); 
  
  useEffect(() => {
    let mounted = true;
    if (!syllabusId && !role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get(`/syllabi/${syllabusId}/?role=${role}`)
      .then((res) => {
        if (!mounted) return;
        setSyllabus(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [syllabusId]); 

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) { // show button after scrolling 300px
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const displayName = (u: User) => {
    const parts = [
      u.prefix,         // e.g., "Dr."
      u.first_name,
      u.last_name,
      u.suffix          // e.g., "PhD"
    ].filter(Boolean);  // removes empty values

    const fullName = parts.join(" ").trim();

    return fullName || u.email;
  };

  const statusStyles: Record<string, React.CSSProperties> = {  
    "Returned by Chair": {
      backgroundColor: "#FECACA",
      color: "#E11D48",
      border: "1px solid #F87171",
    }, 
    "Approved by Chair": {
      backgroundColor: "#D1FAE5",
      color: "#059669",
      border: "1px solid #6EE7B7",
    },
    "Returned by Dean": {
      backgroundColor: "#FDA4AF",
      color: "#BE123C",
      border: "1px solid #FB7185",
    },
    "Approved by Dean": {
      backgroundColor: "#A7F3D0",
      color: "#047857",
      border: "1px solid #6EE7B7",
    },
  };

  // keep a fallback for when there's no syllabus but show overlay while loading

  return (
    <div className="font-thin min-h-screen my-14"> 
      {/* Full-page loading overlay (matches bayanihan leader view) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" aria-label="Loading syllabus..." />
            <span className="text-white text-lg font-semibold">Loading syllabus...</span>
          </div>
        </div>
      )}

    <button
            type="button"
            onClick={() => navigate("/auditor/syllabus/")}
            aria-label="Back to syllabus list"
            className="absolute top-22 left-15 z-30 p-2 rounded-full text-white bg-transparent hover:bg-white/10 transition"
          >
            <FaChevronLeft size={22} color="white" />
          </button>

      <div className="flex flex-row justify-center items-center font-normal">
        {(() => {
          switch (syllabus.status) {
            case "Returned by Chair":
              if (syllabus.chair_rejected_at) {
                return (
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Returned by Chair"]}
                  > 
                    <p className="mb-2">
                      <strong>Notice:</strong> The Chairman has returned this syllabus.
                      Check the review form for the revisions.
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`review-form`)} 
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Returned by Chair"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#991B1B") // darker red
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Returned by Chair"].color || "")
                        }
                      >
                        View Review Form
                      </button>
                    </div>
                  </div>
                );
              }
              break;
  
            case "Returned by Dean":
              if (syllabus.dean_rejected_at) {
                return (
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Returned by Dean"]}
                  >
                    <p className="mb-2">
                      <strong>Notice:</strong> The Dean has returned this syllabus.
                      Please check Dean feedback and revise accordingly.
                    </p>  
 
                    <div className="flex justify-center gap-1"> 
                      <button
                        onClick={() => navigate(`review-form`)} 
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Approved by Chair"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#065F46") 
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Approved by Chair"].color || "")
                        }
                      >
                        View Review Form
                      </button>  
                      <button
                        onClick={() => setFeedbackModal(true)} 
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Returned by Dean"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#730a24") 
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Returned by Dean"].color || "")
                        }
                      >
                        View Dean Feedback
                      </button>
                    </div>

                    {/* Feedback Modal */}
                    {feedbackModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50">
                        <div className="bg-white w-[90%] max-w-xl rounded-xl shadow-2xl relative p-6 animate-fadeIn">
                          {/* Header */}
                          <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                              <span className="inline-block w-2 h-6 bg-blue-600 rounded-sm"></span>
                              Dean Feedback
                            </h2>
                            <button
                              onClick={() => setFeedbackModal(false)}
                              className="hover:bg-gray-100 p-2 rounded-full transition"
                            >
                              <X size={22} className="text-gray-600" />
                            </button>
                          </div>

                          {/* Feedback Content */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">
                              Remarks from Dean
                            </label>
                            <textarea
                              className="resize-none border border-gray-300 bg-gray-50 focus:outline-none w-full rounded-lg p-3 text-gray-700 text-sm leading-relaxed"
                              value={syllabus.dean_feedback?.feedback_text || "No feedback provided."}
                              rows={8}
                              disabled
                            />
                          </div>

                          {/* Footer */}
                          <div className="flex justify-end mt-6">
                            <button
                              onClick={() => setFeedbackModal(false)}
                              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              break;

            case "Approved by Dean":
              if (syllabus.dean_approved_at) {
                return (
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Approved by Dean"]}
                  >
                    <strong>Notice:</strong> This syllabus has been fully approved
                    by the Dean.
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => navigate(`review-form`)} 
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Approved by Chair"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#065F46") 
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Approved by Chair"].color || "")
                        }
                      >
                        View Review Form
                      </button> 
                    </div>
                  </div>
                );
              }
              break;
        }
        })()}
      </div>

      {/* SYLLABUS SECTION */}
      <div className="mx-auto mt-6 w-11/12 max-w-[1500px] border-[3px] border-black bg-white font-serif text-sm p-4 px-24 relative">
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
        <table className="mt-2 mx-auto border-2 border-solid w-full max-w-full font-serif text-sm bg-white">
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
                  Course Code: <span className="font-bold">{syllabus.course.course_code}<br /></span> 
                  Credits: <span className="font-bold">{syllabus.course.course_credit_unit} units ({syllabus.course.course_hrs_lec} hours lecture, {syllabus.course.course_hrs_lab} hrs Laboratory)<br /></span> 
                </th>
            </tr>
            {/* 2nd Header */}
            <tr>
                <td className="w-[20%] border-2 border-solid font-medium text-sm border-black text-left px-4  align-top relative">
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

                <td colSpan={2} className="w-[80%] align-top border-2 border-solid border-black">
                  <table className="my-4 mx-2">
                    <tbody>
                      <tr>
                        <td className="border-2 border-solid border-black font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative">
                          Semester/Year: {syllabus.course.course_semester.toLowerCase()} Semester -  SY{syllabus.bayanihan_group.school_year}
                          <br />
                          <span className="wrap-break-word whitespace-pre-line">
                            Class Schedule: {syllabus.class_schedules}
                          </span>
                          <br /> 
                          <span className="wrap-break-word whitespace-pre-line">
                            Bldg./Rm. No.: {syllabus.building_room}
                          </span>
                        </td>
                        <td className="border-2 border-solid font-medium text-start max-w-[250px] wrap-break-word whitespace-pre-line text-top px-4 relative border-black">
                          Pre-requisite(s): {syllabus.course.course_pre_req} 
                          <br />
                          Co-requisite(s): {syllabus.course.course_co_req}
                        </td>
                      </tr>
                      <tr>
                          <td className="items-start border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative border-black">
                            Instructor:{" "}
                            {syllabus.instructors.map((inst, idx) => (
                                <span className="font-bold" key={idx}>
                                {idx > 0 && idx === syllabus.instructors.length - 1
                                    ? " and "
                                    : idx > 0
                                    ? ", "
                                    : ""}
                                {displayName(inst.user)}
                                </span>
                            ))}
                            <br />
                            Email:{" "}
                            {syllabus.instructors.map((inst, idx) => (
                                <span key={idx}>{inst.user.email}{idx < syllabus.instructors.length - 1 ? ", " : ""}</span>
                            ))}
                            <br /> 
                            <span className="whitespace-pre-line wrap-break-word">  
                              Mobile No.: {syllabus.class_contact} 
                            </span> 
                          </td>
                          <td className="border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative border-black">
                            <span className="wrap-break-word whitespace-pre-line"> 
                              Consultation Schedule: {syllabus.consultation_hours}
                            </span>
                            <br />
                            <span className="wrap-break-word whitespace-pre-line"> 
                              Bldg rm no: {syllabus.consultation_room}
                            </span>
                            <br />
                            <span className="wrap-break-word whitespace-pre-line"> 
                              Office Phone No./Local: {syllabus.consultation_contact}
                            </span>
                          </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="items-start border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative border-black">
                          <span className="text-left font-bold">I. Course Description:</span>
                          <br /> 
                          <span className="wrap-break-word whitespace-pre-line">  
                            {syllabus.course_description}
                          </span>
                        </td>
                      </tr>
                      {/* Course Outcomes Table */}
                      <tr>
                          <td colSpan={2} className="border-2 border-solid font-medium px-4 relative max-w-[250px] wrap-break-word whitespace-pre-line border-black">
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
                                      <td className="w-64 text-left font-medium px-2 max-w-[250px] wrap-break-word whitespace-pre-line">
                                        <span className="font-bold wrap-break-word whitespace-pre-line">{co.co_code} : </span>
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
                                <th className="border-2 border-solid border-black">Course Outcomes (CO)</th>
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
                                .map((cot) => (
                                  <tr key={cot.id} className="border-2 border-solid hover:bg-blue-100">
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[100px]">{cot.allotted_hour} hours, {cot.allotted_time}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[100px]">
                                        {cot.cotcos.map((co, i) => (
                                        <span key={i}>
                                            {co.course_outcome.co_code}
                                            {i < cot.cotcos.length - 1 ? ", " : ""}
                                        </span>
                                        ))}
                                    </td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.intended_learning}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.topics}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.suggested_readings}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.learning_activities}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.assessment_tools}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.grading_criteria}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.remarks}</td>
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
                                .map((cot) => (
                                  <tr key={cot.id} className="border-2 border-solid hover:bg-blue-100">
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[100px]">{cot.allotted_hour} hours, {cot.allotted_time}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[100px]">
                                        {cot.cotcos.map((co, i) => (
                                        <span key={i}>
                                            {co.course_outcome.co_code}
                                            {i < cot.cotcos.length - 1 ? ", " : ""}
                                        </span>
                                        ))}
                                    </td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.intended_learning}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.topics}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.suggested_readings}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[180px]">{cot.learning_activities}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.assessment_tools}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.grading_criteria}</td>
                                    <td className="border-2 border-solid p-2 border-black whitespace-pre-line wrap-break-word max-w-[120px]">{cot.remarks}</td>
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
                        <td colSpan={2} className="border-2 border-solid font-medium border-black max-w-full px-2 relative">
                          <span className="text-left font-bold">IV. Course Requirements:</span>
                          <br />
                          <div className="crq prose prose-sm sm:prose lg:prose-lg max-w-fit px-4">
                            <div className="max-w-fit" dangerouslySetInnerHTML={{ __html: syllabus.course_requirements || "" }} />
                          </div> 
                        </td>
                      </tr>
                    </tbody>
                  </table>
 
                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-6 m-3 text-center">
                    {/* Prepared By */}
                    <div>
                      <div className="font-medium">Prepared By:</div>
                      {syllabus?.bayanihan_group?.bayanihan_members
                        ?.filter((bm) => bm.role === "LEADER")
                        .map((instructor, idx) => (
                          <div className="mt-15 relative" key={idx}>
                            {/* Name (signature line) */}
                            <div className="font-semibold underline text-center relative">
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
                            <div className="">Instructor</div>
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
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1"
          aria-label="Scroll back to top"
        >
          <FaChevronUp className="w-4 h-4" />
          <span className="font-medium text-base">Back to Top</span>
        </button>
      )}
    </div>
  );
}; 
