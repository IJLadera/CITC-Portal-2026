import React, { useEffect, useState } from "react"; 
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { Spinner } from "flowbite-react";
import { createEmptyTOS } from "../../../utils/factories";
import { Undo2, CheckCircle } from "lucide-react"; 
import type { TOS } from "../../../types/tos";
import api from "../../../api";
import { FaChevronLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

export default function TOSView() {   
  const { tosId } = useParams<{ tosId: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase(); 
  const [tos, setTos] = useState<TOS>(createEmptyTOS());
  const [loading, setLoading] = useState<boolean>(true);
  const [isClicking, setIsClicking] = useState(false);

  const navigate = useNavigate(); 

  // Fetch current TOS 
  useEffect(() => {
    if (!tosId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/tos/${tosId}/?role=${role}`)
      .then((res) => {
        setTos(res.data); 
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [tosId]); 
  
  const total_tos_r_col_1 = tos.tos_rows.reduce((sum, row) => sum + (row.col1_value || 0), 0);
  const total_tos_r_col_2 = tos.tos_rows.reduce((sum, row) => sum + (row.col2_value || 0), 0);
  const total_tos_r_col_3 = tos.tos_rows.reduce((sum, row) => sum + (row.col3_value || 0), 0);
  const total_tos_r_col_4 = tos.tos_rows.reduce((sum, row) => sum + (row.col4_value || 0), 0);

  const formatted = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const handleReview = async (decision: "approve" | "reject") => {
    if (!tosId) return;  

    try {
      setIsClicking(true);
      if (decision === "approve") {
        const res = await api.patch(
          `/tos/${tosId}/review-tos/?role=${role}`,
          { decision: "approve" }
        );  
        // Update Syllabus state
        setTos(res.data); 
 
        toast.success("TOS approved successfully!");

      } else { 
        const res = await api.patch(
          `/tos/${tosId}/review-tos/?role=${role}`,
          { decision: "reject" }
        ); 
        // Update Syllabus state
        setTos(res.data); 
        
        toast.success("TOS returned!"); 
      } 

    } catch (err: any) {
      console.error("Error reviewing syllabus:", err);
      toast.error("Something went wrong while reviewing.");
    } finally { 
      setIsClicking(false);
    }
  };

  const statusStyles: Record<string, React.CSSProperties> = {
    "Pending Chair Review": {
      backgroundColor: "#FEF3C7",
      color: "#D97706",
      border: "1px solid #FCD34D",
    },
    "Revisions Applied": {
      backgroundColor: "#DBEAFE",
      color: "#3B82F6",
      border: "1px solid #93C5FD",
    },
    "Returned by Chair": {
      backgroundColor: "#FECACA",
      color: "#E11D48",
      border: "1px solid #F87171",
    }, 
    "Approved by Chair": {
      backgroundColor: "#A7F3D0",
      color: "#047857",
      border: "1px solid #6EE7B7",
    },
  };

  return ( 
    <div className="font-thin min-h-screen my-14">  
      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 
 
      {/* Loading overlay — rendered above content so underlying page remains visible but blurred */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" aria-label="Loading TOS" />
            <span className="text-white text-lg font-semibold">Loading TOS</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/chairperson/tos/")}
        aria-label="Back to syllabus list"
        className="absolute top-22 left-15 z-30 p-2 rounded-full text-white bg-transparent hover:bg-white/10 transition"
      >
        <FaChevronLeft size={22} color="white" />
      </button>


      {/* Status-specific content */}
      {(() => {
        switch (tos.status) {
          case "Pending Chair Review":
            if (tos.chair_submitted_at && !tos.chair_returned_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Pending Chair Review"]}
                  > 
                    <strong>Notice:</strong> This TOS has been submitted to the
                    Chairman for review. You may review the tos below. 
                    
                    <div className="flex justify-center mt-4">
                      <div className="bg-red-600 py-2 px-3 text-pink-100 rounded shadow-lg hover:scale-105 transition ease-in-out mx-2">
                        <div className="flex items-center space-x-2">
                          <Undo2 size={20} className="text-pink2" />
                          <button
                            type="button"
                            onClick={() => handleReview("reject")}
                            className="btn btn-primary text-pink2"
                          >
                            Return for Revision
                          </button>
                        </div>
                      </div>

                      {/* Approve */}
                      <div className="bg-green-500 py-2 px-3 text-white rounded shadow-lg hover:scale-105 transition ease-in-out mx-2">
                        <button
                          type="button"
                          onClick={() => handleReview("approve")}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle size={20} className="text-green" />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            break;

          case "Returned by Chair":
            if (tos.chair_returned_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Returned by Chair"]}
                  > 
                    <p className="">
                      <strong>Notice:</strong> The Chairman has returned this TOS. 
                    </p> 
                  </div>
                </div>
              );
            }
            break;

          case "Revisions Applied":
            if (tos.chair_submitted_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Revisions Applied"]}
                  >
                    <p className="mb-2">
                      <strong>Notice:</strong> This TOS has been re-submitted
                      with revisions and is awaiting Chairman&apos;s re-review.
                    </p>            
                    <div className="flex justify-center mt-4">
                      <div className="bg-red-600 py-2 px-3 text-pink-100 rounded shadow-lg hover:scale-105 transition ease-in-out mx-2">
                        <div className="flex items-center space-x-2">
                          <Undo2 size={20} className="text-pink2" />
                          <button
                            type="button"
                            disabled={isClicking}
                            onClick={() => handleReview("reject")}
                            className="btn btn-primary text-pink2"
                          >
                            {isClicking ? "Returning TOS... " : "Return for Revision"}
                          </button>
                        </div>
                      </div>

                      {/* Approve */}
                      <div className="bg-green-500 py-2 px-3 text-white rounded shadow-lg hover:scale-105 transition ease-in-out mx-2">
                        <button
                          type="button"
                          disabled={isClicking}
                          onClick={() => handleReview("approve")}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle size={20} className="text-green" />
                          {isClicking ? "Approving TOS... " : "Approve TOS"}
                        </button>
                      </div>
                    </div> 
                  </div>
                </div>
              );
            }
            break;

          case "Approved by Chair":
            if (tos.chair_submitted_at && !tos.chair_returned_at && tos.chair_approved_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Approved by Chair"]}
                  >
                    <p>
                      <strong>Notice:</strong> This TOS has been approved by the
                      Chairman. 
                    </p> 
                  </div>
                </div>
              );
            }
            break; 
        }
      })()} 

      {/* TOS SECTION */}
      <div className="mt-4 mx-auto shadow-lg p-12 w-[90%] border border-white bg-white">
        {/* TOS OUTER CONTAINER */}
        <div className="mx-auto border-2 bg-white font-[Arial] text-sm p-4 relative">
          {/* TOS HEADER SECTION */}
          <div className="flex justify-center items-start">
            <div className="flex justify-between gap-5 items-start w-full max-w-5xl">
              {/* LEFT: Logo + Campus Info */}
              <div className="flex items-start space-x-4 w-[70%]">
                <div>
                  <img src="/assets/ustplogo.png" alt="USTP Logo" className="w-20 h-auto" />
                </div>
                <div>
                  <h1 className="text-md font-bold uppercase leading-tight text-center">
                    University of Science and Technology 
                  </h1>
                  <h1 className="text-md font-bold uppercase leading-tight text-center">
                    of Southern Philippines
                  </h1>
                  <p className="text-sm mt-1">
                    Alubijid | Balubal | Cagayan de Oro | Claveria | Jasaan | Oroquieta | Panaon | Villanueva
                  </p>
                </div>
              </div>
              {/* RIGHT: Document Info Table */}
              <table className="text-xs text-center border border-gray-400 ml-20">
                <thead>
                  <tr className="bg-[#001f5f] text-white">
                      <th colSpan={3} className="border border-gray-400 px-3 text-[14px] font-semibold">
                        Document Code No.
                      </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                      <td colSpan={3} className="border border-gray-400 text-base font-bold text-gray-700">
                        FM-USTP-ACAD-08
                      </td>
                  </tr>
                  <tr className="bg-[#001f5f] text-white">
                      <td className="border border-gray-400 px-2 py-1 font-bold text-nowrap text-xs">Rev. No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-nowrap text-xs">Effective Date</td>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-nowrap text-xs">Page No.</td>
                  </tr>
                  <tr>
                      <td className="border border-gray-400 px-2 py-1">{formatRevisionNo(tos.tos_template?.revision_no)}</td>
                      <td className="border border-gray-400 px-2 py-1">{formatEffectiveDate(tos.effective_date)}</td>
                      <td className="border border-gray-400 px-2 py-1">#</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* TOS INFO */} 
          <div className="mx-auto font-serif">
            <div className="flex flex-col ">
              {/* Term Examination Row */}
              <div className="flex justify-end ml-12 mr-26 pt-14 pl-6 text-[14px] items-start">
                <span className="w-[180px] text-right">Term Examination:</span> 
                {/* Boxes Section */}
                <div className="ml-4 grid grid-cols-2 gap-x-6 gap-y-2">
                  {["Prelim", "Midterm", "Semi-finals", "Finals"].map((term, idx) => (
                    <label key={idx} className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black flex items-center justify-center">
                        {tos.term.toLowerCase() === term.toLowerCase() && <span className="text-xs">✔</span>}
                      </div>
                      <span>{term}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Course Code Row */}
              <div className="flex justify-end ml-12 mr-11 pt-1 pl-6 text-[14px]">
                <span className="w-[180px] text-right">Course Code:</span>
                <span className="ml-4 border-b border-black font-semibold w-[300px]">
                  {tos.course.course_code}
                </span>
              </div>

              {/* Course Title Row */}
              <div className="flex justify-end ml-12 mr-12 pt-1 pl-6 text-[14px]">
                <span className="w-[180px] text-right">Course Title:</span>
                <span className="ml-4 border-b border-black font-semibold w-[300px]">
                  {tos.course.course_title}
                </span>
              </div>
            </div> 

            <div className="flex sticky justify-center pt-6 text-xl font-bold">
              TABLE OF SPECIFICATION
            </div>

            <div className="flex justify-center ml-12 pt-2 text-base">
              <span className="text-center">S.Y.: </span>
              <span className="ml-2 border-b-2 border-black pb-1 w-[150px] font-semibold">{tos.bayanihan_group.school_year}</span>
              <span className="text-center ml-8">Semester: </span>
              <span className="ml-2 border-b-2 border-black pb-1 w-[150px] font-semibold">{tos.course.course_semester.toLowerCase()}</span>
            </div>
            <div className="flex justify-around pt-4 text-base font-semibold">
              <div>
                <span>Curricular Program/Year/Section: </span>
                <span className="inline-block border-b-2 border-black w-[200px]">{tos.tos_cpys}</span>
              </div>
              <div>
                <span>Date Submitted: </span>
                <span className="inline-block border-b-2 border-black w-[200px]">{tos.chair_submitted_at ? formatted(tos.chair_submitted_at) : ""}</span>
              </div>
            </div> 
            
            {/* Table Section */}
            <div className="mt-10 flex justify-start gap-3">
              {/* Course Outcomes Table */} 
              <table className="border border-black w-[25%] font-serif text-sm bg-white">
                <thead>
                  <tr>
                    <th className="text-center font-semibold p-2">
                      Course Outcomes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tos.syllabus.course_outcomes.map((co, idx) => (
                    <tr key={idx}>
                      <td className="p-2 align-top">
                        <span className="font-semibold">{co.co_code}:</span>{" "}
                        {co.co_description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Main TOS Table */}
              <div className="flex flex-col w-full">
                <table className="border border-black w-full font-serif text-sm bg-white">
                  <thead>
                    <tr>
                      <th 
                        rowSpan={3} 
                        className="border border-black px-2 py-1 font-medium w-[35%]"
                      >
                        Topics
                      </th>

                      <th 
                        rowSpan={3} 
                        className="border border-black px-2 py-1 font-medium w-[8%]"
                      >
                        No. of <br /> Hours <br /> Taught
                      </th>

                      <th 
                        rowSpan={3} 
                        className="border border-black px-2 py-1 font-medium w-[6%]"
                      >
                        %
                      </th>

                      <th 
                        rowSpan={3} 
                        className="border border-black px-2 py-1 font-medium w-[8%]"
                      >
                        No. of <br /> Test <br /> Items
                      </th>

                      <th colSpan={4} className="border border-black py-2">Cognitive Level</th>
                    </tr>

                    <tr>
                      <th className="border border-black py-1 w-[10%]">Knowledge</th>
                      <th className="border border-black py-1 w-[10%]">Comprehension</th>
                      <th className="border border-black py-1 w-[10%]">Application/ <br />Analysis</th>
                      <th className="border border-black py-1 w-[10%]">Synthesis/ <br /> Evaluation</th>
                    </tr>

                    <tr>
                      <th className="border border-black py-1">{tos.col1_percentage}%</th>
                      <th className="border border-black">{tos.col2_percentage}%</th>
                      <th className="border border-black">{tos.col3_percentage}%</th>
                      <th className="border border-black">{tos.col4_percentage}%</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tos.tos_rows.length > 0 ? (
                      tos.tos_rows.map((row) => (
                        <tr key={row.id}>
                          <td className="border border-black text-left p-2 w-[35%]">{row.topic}</td>
                          <td className="border border-black text-center w-[8%]">{row.no_hours}</td>
                          <td className="border border-black text-center w-[6%]">{row.percent}</td>
                          <td className="border border-black text-center w-[8%]">{row.no_items}</td>

                          <td className="border border-black text-center w-[10%]">{row.col1_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col2_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col3_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col4_value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="border border-black text-center p-2">
                          No data available
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="border border-black text-right font-bold p-2">Total:</td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                      <td className="border border-black text-center font-bold p-2">{tos.total_items}</td>
                      <td className="border border-black text-center font-bold p-2">{total_tos_r_col_1}</td>
                      <td className="border border-black text-center font-bold p-2">{total_tos_r_col_2}</td>
                      <td className="border border-black text-center font-bold p-2">{total_tos_r_col_3}</td>
                      <td className="border border-black text-center font-bold p-2">{total_tos_r_col_4}</td>
                    </tr>
                  </tbody>
                </table> 
              </div>
            </div>

            {/* Signatories */}
            <div className="grid grid-cols-4 m-3 font-serif">
              <div className="flex justify-center items-center">
                <div className="flex justify-center">Prepared by:</div>
              </div>
              <div>
                {tos.bayanihan_group?.bayanihan_members
                  ?.filter((member) => member.role === "LEADER")
                  ?.map((bLeader, idx) => {
                    const user = bLeader.user;
 
                    const fullName = [
                      user.prefix?.toUpperCase(),
                      user.first_name?.toUpperCase(),
                      user.last_name?.toUpperCase(),
                      user.suffix?.toUpperCase(),
                    ]
                      .filter(Boolean) // removes null/undefined/empty strings
                      .join(" ");

                    return (
                      <div className="mb-5 mt-15" key={idx}>
                        <div className="flex justify-center relative">
                          {tos.chair_submitted_at && user.signature && (
                            <img
                              src={`${user.signature}`}
                              alt="Instructor Signature"
                              className="h-14 object-contain absolute inset-0 mx-auto -top-10"
                            />
                          )}
                        </div>
                        <div className="flex justify-center font-semibold underline text-center relative">
                          {fullName}
                        </div>
                        <div className="flex justify-center">Faculty & Signature</div>
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-center items-center">
                <div className="flex justify-center">Approved by:</div>
              </div>
              <div>
                <div className="flex justify-center items-center mt-10 relative">
                  {tos.chair_approved_at && tos.chair.signature && (
                    <img
                      src={`${tos.chair.signature}`}
                      alt="Chairperson Signature"
                      className="h-14 object-contain absolute inset-0 mx-auto -top-10"
                    />
                  )}
                </div>
                <div className="flex justify-center font-semibold underline text-center relative">
                  {tos.chair.name}
                </div>
                <div className="flex justify-center">Department Chair, {tos.program.department.department_code}</div>
              </div>
            </div>
            <div className="m-3 font-serf italic text-gray-600 text-center text-base">
              <p>*Percentages will depend on the course outcomes. Faculty are encouraged to place a higher percentage for higher lever cognitive skills.</p>
            </div>
          </div>  
        </div>
      </div> 
    </div> 
  );
};