import React, { useEffect, useState } from "react";
import api from "../../../api";
import { useParams } from "react-router-dom";
import type { SyllabusReviewForm, EnrichedChecklist } from "../../../types/syllabus";
import { createEmptySyllabusReviewForm } from "../../../utils/factories"; 
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";

const checklistTextMap: Record<number, { text: string; isBullet?: boolean }> = {
  1: { text: "1. The syllabus follows the prescribed OBE syllabus format of the University and include the following:" },
  2: { text: "• Name of the College/Campus is indicated below the University name/brand.", isBullet: true },
  3: { text: "• Program, Course Title, Course Code and Unit Credits are specified in the syllabus.", isBullet: true },
  4: { text: "• Pre-requisites and co-requisites are indicated.", isBullet: true },
  5: { text: "• Semester, Academic Year, Schedule of Course, Building and Room Number are stipulated in the syllabus.", isBullet: true },
  6: { text: "• Contact details of the instructor such as the instructor’s name, email address OR mobile number (optional) are specified in the syllabus.", isBullet: true },
  7: { text: "• Instructor’s consultation schedules, office or consultation venue, office phone number is indicated in the syllabus.", isBullet: true },
  8: { text: "• The University’s Vision and Mission are indicated in the syllabus.", isBullet: true },
  9: { text: "2. The course description stipulates its relevance to the curriculum in general and provides an overview of the course content." },
  10: { text: "3. The Approved Program Educational Objectives (PEO) and Program Outcomes (PO) are listed with alphabets in the syllabus (which will be referred to in the mapping of the course outcomes)." },
  11: { text: "4. The course outcomes are measurable and aligned with the course description and program outcomes." },
  12: { text: "5. The course outcomes are mapped accordingly to the program outcomes/GELOs using the markers: i - introductory, e - enabling, and d - demonstrative." },
  13: { text: "6. The course outline indicates the number of hours." },
  14: { text: "7. Topics are assigned to intended learning outcomes (ILO)." },
  15: { text: "8. Suggested readings are provided." },
  16: { text: "9. The Teaching-Learning Activities (TLAs) are indicated in the outline." },
  17: { text: "10. Assessment tools are indicated." },
  18: { text: "11. Rubrics are attached for all outputs/requirements." },
  19: { text: "12. The grading criteria are clearly stated in the syllabus." },
};

export default function SyllabusReviewForm() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const role = localStorage.getItem("activeRole")?.toUpperCase();
    
  const [reviewForm, setReviewForm] = useState<SyllabusReviewForm>(createEmptySyllabusReviewForm());

  useEffect(() => {
    if (!syllabusId) return;

    api.get(`/syllabi/${syllabusId}/review-form/?role=${role}`)
      .then((res) => {
        const form: SyllabusReviewForm = res.data;

        // Enrich checklist_items with text from our map
        const enrichedChecklist: EnrichedChecklist[] = form.checklist_items.map((item) => ({
          ...item,
          text: checklistTextMap[item.number]?.text || `#${item.number}`,
          isBullet: checklistTextMap[item.number]?.isBullet || false,
        }));

        setReviewForm({ ...form, checklist_items: enrichedChecklist });
      })
      .catch((err) => console.error(err));
  }, [syllabusId]);

  const handleDownloadPdf = async () => {
    if (!reviewForm.id) return;

    try {
      const response = await api.get(`/review-form/${reviewForm.id}/export_pdf/`, {
        responseType: "blob", // important for binary data
      });
 
      // Extract only the date part (YYYY-MM-DD)
      const chairDate = reviewForm.review_date
        ? reviewForm.review_date.split("T")[0]
        : "NA";

      // Optionally sanitize course title and status
      const sanitize = (s: any) => s.replace(/[<>:"/\\|?*]/g, "_");
      const courseTitle = sanitize(reviewForm.course_title);
      const status = sanitize(reviewForm.syllabus.status);

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ReviewForm-${courseTitle} ${reviewForm.syllabus.bayanihan_group.school_year} ${status}-${chairDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download Review Form PDF", error);
    }
  }; 

  return (  
    <div className="mt-24 flex justify-center flex-col border border-gray-300 bg-white bg-opacity-100 rounded-md font-sans pb-10 shadow-md">
        <div className="flex justify-end mt-5 mr-10">
            <button
                onClick={handleDownloadPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
                Download PDF
            </button>
        </div>
        
        <div className="justify-center items-center mx-10">
            <div className="flex mt-5 justify-center items-center">
                {/* HEADER SECTION */}
                <div className="w-full bg-white">
                    {/* Outer container for header */}
                    <div className="flex justify-center items-start mb-4">
                        <div className="flex justify-between items-start w-full max-w-5xl">
                            {/* LEFT: Logo + Campus Info */}
                            <div className="flex items-start space-x-2 w-[70%]">
                                {/* Logo */}
                                <div className="w-20 ml-6 mt-4">
                                <img
                                    src="/assets/ustplogo.png"
                                    alt="USTP Logo"
                                    className="w-full h-auto"
                                />
                                </div>
                                {/* Text block */}
                                <div>
                                <h1 className="text-md text-center font-bold leading-tight ml-9 mt-[40px] uppercase">
                                    University of Science and Technology  
                                </h1>
                                <h1 className="text-md text-center font-bold leading-tight ml-9 uppercase">
                                    of Southern
                                    Philippines
                                </h1>
                                <p className="text-xs leading-snug ml-9">
                                    Alubijid | Balubal | Cagayan de Oro | Claveria |
                                    Jasaan | Oroquieta | Panaon | Villanueva
                                </p>
                                </div>
                            </div>

                            {/* RIGHT: Document Info Table */}
                            <table className="text-[10px] text-center border border-gray-400 w-50 mt-[25px]">
                                <thead>
                                    <tr className="bg-[#5A6E99] text-white">
                                        <th
                                            colSpan={3}
                                            className="border border-gray-400 px-1 font-semibold"
                                        >
                                            Document Code No.
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td
                                      colSpan={3}
                                      className="border border-gray-400 text-[16px] font-bold text-gray-700"
                                    >
                                      FM-USTP-ACAD-12
                                    </td>
                                </tr>
                                <tr className="bg-[#5A6E99] text-white">
                                    <td className="border border-gray-400 px-1 py-[2px]">
                                        Rev. No.
                                    </td>
                                    <td className="border border-gray-400 px-1 py-[2px]">
                                        Effective Date
                                    </td>
                                    <td className="border border-gray-400 px-1 py-[2px]">
                                        Page No.
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-400 px-1 py-[2px]"> 
                                      {formatRevisionNo(reviewForm.syllabus.syllabus_template?.revision_no)}
                                    </td>
                                    <td className="border border-gray-400 px-1 py-[2px]">
                                      {formatEffectiveDate(reviewForm.effective_date)}
                                    </td>
                                    <td className="border border-gray-400 px-1 py-[2px]">
                                      #
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Title Section (centered) */}
                    <div className="mb-5 mt-2 text-3xl text-left text-[#1A0A52] font-bold">
                        SYLLABUS REVIEW FORM
                    </div>
                </div>
            </div>

            {/* Course Info Grid */}
            <div className="grid grid-cols-2 grid-rows-2 gap-y-2 mb-6">
                <div>
                    <span className="font-bold">Course Code: </span>
                    <span>{reviewForm.syllabus.course.course_code}</span>
                </div>
                <div>
                    <span className="font-bold">Sem and Year: </span>
                    <span>{reviewForm.syllabus.course.course_semester.toLowerCase()} Semester - S.Y. {reviewForm.syllabus.bayanihan_group.school_year}</span>
                </div>
                <div>
                    <span className="font-bold">Descriptive Title: </span>
                    <span>{reviewForm.course_title}</span>
                </div>
                <div>
                    <span className="font-bold">Faculty: </span>
                    <span className="whitespace-pre-line">{reviewForm.faculty}</span>
                </div>
            </div>

            {/* Directions + Review Table */}
            <div className="w-[900px] bg-white bg-opacity-100">
                <div className="mb-4">
                    <p>
                        <span className="font-semibold">Directions:</span> Check the
                        column <span className="font-semibold">YES</span> if an
                        indicator is observed in the syllabus and check column NO if
                        otherwise. Provide clear and constructive remarks that would
                        help improve the content and alignment of the syllabus.
                    </p>
                </div>

                {/* Syllabus Review Table */}
                <div className="overflow-x-auto mb-10">
                    <table className="w-full border border-gray-300 text-sm" id="review_form_table">
                        <thead>
                            <tr className="bg-[#A1A1A1]">
                                <th className="w-[600px] border px-3 py-2 font-semibold">INDICATORS</th>
                                <th className="w-[100px] border px-3 py-2 font-semibold">YES</th>
                                <th className="w-[100px] border px-3 py-2 font-semibold">NO</th>
                                <th className="w-[200px] border px-3 py-2 font-semibold">REMARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* PART I */}
                            <tr className="bg-[#D1D1D1]">
                                <td className="border px-3 py-2 font-semibold" colSpan={4}>
                                  PART I. BASIC SYLLABUS INFORMATION
                                </td>
                            </tr>
                            {reviewForm.checklist_items
                              .filter((item) => item.number >= 1 && item.number <= 8)
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className={`border px-3 py-2 bg-[#D1D1D1] ${item.isBullet ? "pl-6" : ""}`}>
                                    {item.text}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "yes" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "no" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2">{item.remarks}</td>
                                </tr>
                              ))
                            }
                            {/* PART II */}
                            <tr className="bg-[#D1D1D1]">
                                <td className="border px-3 py-2 font-semibold" colSpan={4}>
                                    PART II. PROGRAM EDUCATIONAL OBJECTIVES <span className="italic">(or General Outcomes for Gen Ed courses)</span>
                                </td>
                            </tr>
                            {reviewForm.checklist_items
                              .filter((item) => item.number >= 9 && item.number <= 10)
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className={`border px-3 py-2 bg-[#D1D1D1] ${item.isBullet ? "pl-6" : ""}`}>
                                    {item.text}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "yes" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "no" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2">{item.remarks}</td>
                                </tr>
                              ))
                            }
                            {/* PART III */}
                            <tr className="bg-[#D1D1D1]">
                                <td className="border px-3 py-2 font-semibold" colSpan={4}>
                                PART III. COURSE OUTCOMES
                                </td>
                            </tr>
                            {reviewForm.checklist_items
                              .filter((item) => item.number >= 11 && item.number <= 12)
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className={`border px-3 py-2 bg-[#D1D1D1] ${item.isBullet ? "pl-6" : ""}`}>
                                    {item.text}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "yes" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "no" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2">{item.remarks}</td>
                                </tr>
                              ))
                            }
                            {/* PART IV */}
                            <tr className="bg-[#D1D1D1]">
                                <td className="border px-3 py-2 font-semibold" colSpan={4}>
                                PART IV. COURSE OUTLINES
                                </td>
                            </tr>
                            {reviewForm.checklist_items
                              .filter((item) => item.number >= 13 && item.number <= 19)
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className={`border px-3 py-2 bg-[#D1D1D1] ${item.isBullet ? "pl-6" : ""}`}>
                                    {item.text}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "yes" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2 text-center align-middle">
                                    {item.response === "no" ? "/" : ""}
                                  </td>
                                  <td className="border px-3 py-2">{item.remarks}</td>
                                </tr>
                              ))
                            }
                        </tbody>
                    </table>
                </div>
            </div> 

            {/* Review Form Bottom Information */}
            <div className="mt-8 space-y-6">

              {/* Plan of Action */}
              <div>
                <p className="font-semibold">Please check the appropriate plan of action:</p>

                {/* For Revision */}
                <p className="mt-2">
                  <span className="font-bold">For revision</span>{" "}
                  <span className="relative inline-block align-middle">
                    {/* Long underline */}
                    <span className="inline-block border-b border-black w-56"></span>
                    {/* Check mark overlayed */}
                    {reviewForm.action === 0 && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-[2px] font-bold text-lg">
                        ✓
                      </span>
                    )}
                  </span>{" "}
                  <span className="text-sm italic">
                    (please see remarks column for indicator(s) marked “no”)
                  </span>
                </p>

                {/* Approved for Implementation */}
                <p className="mt-2">
                  <span className="font-bold">Approved for implementation</span>{" "}
                  <span className="relative inline-block align-middle">
                    <span className="inline-block border-b border-black w-56"></span>
                    {reviewForm.action === 1 && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-[2px] font-bold text-lg">
                        ✓  
                      </span>
                    )}
                  </span>{" "}
                  <span className="text-sm italic">
                    (all indicators must be marked “yes”)
                  </span>
                </p>
              </div>

              {/* Reviewed By */}
              <div>
                <p className="mb-4">Reviewed by:</p>

                <div className="mb-8">
                  <p className="font-bold">{reviewForm.reviewed_by_snapshot}</p>
                  <div className="border-t border-black w-80"></div>
                  <p className="italic text-sm">Program Chairman/Unit Coordinator</p>
                </div>

                <div>
                  <p className="font-bold">{reviewForm.review_date}</p>
                  <div className="border-t border-black w-80"></div>
                  <p className="italic text-sm">Date of review</p>
                </div>
              </div>
            </div>
        </div>
    </div>
  );
}; 