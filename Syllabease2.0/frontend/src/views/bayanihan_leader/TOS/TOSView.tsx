import React, { useContext, useEffect, useState } from "react"; 
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import { createEmptyTOS } from "../../../utils/factories";
import { FaEdit, FaChevronRight, FaListAlt, FaCheckCircle, FaChevronLeft } from "react-icons/fa";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "flowbite-react"; // Spinner for loading overlay
import { useTOSMode } from "@/context/TOSModeContext";
import TOSCommentComponent from "@/components/TOSCommentComponent";
import type { TOS } from "../../../types/tos";
import api from "../../../api"; 
import { toast, ToastContainer } from "react-toastify";
import ConfirmDialog from "@/components/ConfirmDialog";
import { AuthContext } from "@/context/AuthContext";

export default function TOSView() {   
  const { tosId } = useParams<{ tosId: string }>();
  const { user } = useContext(AuthContext)!;
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase(); 
  
  const { isCommentMode } = useTOSMode();  
  const [tos, setTos] = useState<TOS>(createEmptyTOS()); 
  const [loading, setLoading] = useState<boolean>(true); 
  const [isUpdating, setisUpdating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const [showEditTOSModal, setShowEditTOSModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tosForm, setTosForm] = useState<any>({
    term: "",
    total_items: 0,
    tos_cpys: "",
    col1_percentage: 0,
    col2_percentage: 0,
    col3_percentage: 0,
    col4_percentage: 0,
  });

  // Fetch current TOS and also setFormData for Editing TOS
  useEffect(() => {
    if (!tosId) return; 
    setLoading(true);
    api.get(`/tos/${tosId}/?role=${role}`)
      .then((res) => {
        const tos = res.data;
        setTos(tos);  
        setTosForm({
          term: tos.term,
          total_items: tos.total_items || 0,
          tos_cpys: tos.tos_cpys || "",
          col1_percentage: tos.col1_percentage || 0,
          col2_percentage: tos.col2_percentage || 0,
          col3_percentage: tos.col3_percentage || 0,
          col4_percentage: tos.col4_percentage || 0,
        }); 
        // ✅ Preload selected topics from tos.tos_rows
        setSelectedTopics(tos.tos_rows.map((row: any) => row.topic));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [tosId]);

  const handleOpenEditModal = () => {
    setTosForm({
      term: tos.term,
      total_items: tos.total_items || 0,
      tos_cpys: tos.tos_cpys || "",
      col1_percentage: tos.col1_percentage || 0,
      col2_percentage: tos.col2_percentage || 0,
      col3_percentage: tos.col3_percentage || 0,
      col4_percentage: tos.col4_percentage || 0,
    }); 

    // ✅ Preload selected topics from tos.tos_rows
    setSelectedTopics(tos.tos_rows.map((row) => row.topic));

    setShowEditTOSModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    let newValue = value;

    // 🔒 Prevent negative numbers for number inputs
    if (type === "number") {
      if (value === "-") return; // prevents "-" entry from breaking input
      const numeric = Number(value);
      if (numeric < 0 || isNaN(numeric)) newValue = "0";
    }

    setTosForm({
      ...tosForm,
      [name]: newValue,
    });
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleUpdateTOS = async (e: React.FormEvent) => {
    e.preventDefault(); 

    const col1 = Number(tosForm.col1_percentage || 0);
    const col2 = Number(tosForm.col2_percentage || 0);
    const col3 = Number(tosForm.col3_percentage || 0);
    const col4 = Number(tosForm.col4_percentage || 0);
    const total = col1 + col2 + col3 + col4;

    if (tosForm.total_items < 1) {
      setFormError("Please select a valid total item number.");
      return;
    } 
    if (col1 > 50) {
      setFormError("Knowledge cannot exceed 50%.");
      return;
    }
    if (total !== 100) {
      setFormError("Total cognitive levels must equal 100%.");
      return;
    }
    if (selectedTopics.length === 0) {
      setFormError("Please select at least one topic.");
      return;
    }

    try {
      setisUpdating(true);
      setFormError(null);
      await api.put(`/tos/${tos.id}/`, {
        term: tosForm.term,
        total_items: tosForm.total_items,
        tos_cpys: tosForm.tos_cpys,
        col1_percentage: tosForm.col1_percentage,
        col2_percentage: tosForm.col2_percentage,
        col3_percentage: tosForm.col3_percentage,
        col4_percentage: tosForm.col4_percentage,
        selected_topics: selectedTopics, 
      });

      const res = await api.get(`/tos/${tos.id}/?role=${role}`);
      setTos(res.data);
      toast.success("TOS updated successfully.")

    } catch (err: any) {
      console.error("Failed to update TOS", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to update TOS. Please try again later.");
      }  
    } finally { 
      setShowEditTOSModal(false);
      setisUpdating(false);
    }
  }; 

  const handleSubmitTOS = async () => { 
    const col1 = Number(tosForm.col1_percentage || 0);
    const col2 = Number(tosForm.col2_percentage || 0);
    const col3 = Number(tosForm.col3_percentage || 0);
    const col4 = Number(tosForm.col4_percentage || 0);
    const total = col1 + col2 + col3 + col4; 

    if (tosForm.total_items < 1) {
      setFormError("Please select a valid total item number.");
      toast.error("Please select a valid total item number.");
      return;
    } 
    if (col1 > 50) {
      setFormError("Knowledge cannot exceed 50%.");
      toast.error("Knowledge cannot exceed 50%.");
      return;
    }
    if (total !== 100) {
      setFormError("Total cognitive levels must equal 100%.");
      toast.error("Total cognitive levels must equal 100%."); 
      return;
    }
    if (selectedTopics.length === 0) {
      setFormError("Please select at least one topic.");
      toast.error("Please select at least one topic.");
      return;
    }

    if (!user?.signature) {
        toast.error(`You cannot submit the syllabus because your account does not have a signature set yet. Please upload your signature in your profile before proceeding.`);
        return;
    }

    try {
      setSubmitLoading(true);
      const { data } = await api.patch(`/tos/${tos.id}/submit-tos/?role=${role}`); 
      setTos(data);

      toast.success("TOS Submitted Successfully!"); 

    } catch (err: any) {
      console.error("Failed to submit TOS", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to submit TOS.");
      }  
    } finally {
      setSubmitLoading(false);
    }
  }; 

  const handleReplicateTOS = async (e: React.FormEvent) => {
    e.preventDefault();

    try { 
      const { data: newTOS } = await api.post(`/tos/${tos.id}/replicate-tos/?role=${role}`); 
      setTos(newTOS);  
      toast.success("TOS replicated successfully!"); 

    } catch (err: any) {
      console.error("Error replicating TOS:", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to replicate TOS. Please try again.");
      }   
    }
  };
  
  const total_hours_taught = tos.tos_rows.reduce((sum, row) => sum + (row.no_hours || 0), 0);
  const total_percent = tos.tos_rows.reduce((sum, row) => sum + (row.percent || 0), 0);
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

      {/* Back button — fixed to viewport upper-left (arrow only, white) */}
      <button
        type="button"
        onClick={() => navigate("/bayanihan_leader/tos/")}
        aria-label="Back to syllabus list"
        className="absolute top-22 left-15 z-30 p-2 rounded-full text-white bg-transparent hover:bg-white/10 transition"
      >
        <FaChevronLeft size={22} color="white" />
      </button>
      
      {/* Loading overlay (blocks view until TOS is fetched) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" aria-label="Loading TOS" />
            <span className="text-white text-lg font-semibold">Loading TOS</span>
          </div>
        </div>
      )}

      {/* Submit overlay (shows when clicking Submit) */}
      {submitLoading && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" aria-label="Submitting..." />
            <span className="text-white text-lg font-semibold">Submitting</span>
          </div>
        </div>
      )}

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
                    Chairperson for review. 
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
                    <p className="mb-2">
                      <strong>Notice:</strong> The Chairperson has returned this TOS. 
                    </p> 
                    <div className="flex justify-center">
                      {/* Replicate Syllabus */}
                      {tos.is_latest && ( 
                        <button
                          onClick={handleReplicateTOS}
                          className="px-6 py-2 rounded-lg shadow transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
                        >
                          Replicate TOS
                        </button>
                      )}
                    </div>
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
                      with revisions and is awaiting Chairperson&apos;s re-review.
                    </p> 
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
                      Chairperson. 
                    </p> 
                  </div>
                </div>
              );
            }
            break; 

          case "Draft":
          case "Requires Revision":
            return (
              <div className="flex flex-row px-18 justify-between items-center font-normal">
                {/* Left group → action buttons */}
                <div className="flex flex-row space-x-4">
                  {/* Edit tos Header */}
                  <div className="bg-blue-700 py-2 px-3 text-white rounded shadow-lg hover:scale-105 transition ease-in-out cursor-pointer">
                    <button 
                      onClick={handleOpenEditModal}
                      type="button"
                      className="flex items-center space-x-2"
                    >
                      <FaEdit size={20} />
                      <span>Edit TOS Details</span>
                    </button>
                  </div> 

                  {/* Course Requirement */}
                  <div className="relative inline-block bg-white py-2 px-3 rounded shadow-lg text-blue-700 hover:scale-105 transition ease-in-out cursor-pointer">
                    <button 
                      onClick={() => navigate(`edit-tos-rows`)}
                      type="button"
                      className="flex items-center space-x-2 text-blue"
                    >
                      <FaListAlt size={22} />
                      <span>Edit TOS Topic Row Values</span>
                      <FaChevronRight size={10}/>
                    </button>
                  </div>
                </div>

                {/* Right group → Submit button */}
                <div>
                  <div className={`bg-green-300 py-2 px-3 mr-0 text-green-600 rounded shadow-lg transition ease-in-out ${submitLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}>
                    <button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center space-x-2"
                      disabled={submitLoading}
                    >
                      <FaCheckCircle size={20} />
                      <span>{submitLoading ? "Submitting TOS" : "Submit TOS"}</span>
                    </button>
                  </div>
                </div> 
                
                <ConfirmDialog
                  isOpen={showConfirm}
                  title="Submit TOS?"
                  message="Once submitted, you might not be able to edit it anymore."
                  confirmText="Yes, Submit"
                  doubleConfirm={false}
                  onConfirm={handleSubmitTOS}
                  onClose={() => setShowConfirm(false)}
                />
              </div>
            );
        }
      })()}
 
      {/* --- Edit TOS Modal --- */}
      <Modal show={showEditTOSModal} onClose={() => setShowEditTOSModal(false)} size="3xl">
        <ModalHeader className="text-xl font-semibold">
          Edit Table of Specifications (TOS)
        </ModalHeader>

        <ModalBody className="space-y-6">

          {/* Course Information */}
          <div className="rounded-lg border-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-lg">
              Course Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Course Code</span>
                <p className="text-gray-900 dark:text-white">
                  {tos.bayanihan_group.course.course_code}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Course Title</span>
                <p className="text-gray-900 dark:text-white">
                  {tos.bayanihan_group.course.course_title}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">School Year</span>
                <p className="text-gray-900 dark:text-white">
                  {tos.bayanihan_group.school_year}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-600 dark:text-gray-300">Semester</span>
                <p className="text-gray-900 dark:text-white">
                  {tos.bayanihan_group.course.course_semester}
                </p>
              </div>
            </div>
          </div>

          {/* EDIT DETAILS */}
          <div className="rounded-lg border-2 p-4 bg-white dark:bg-gray-900 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg text-center">
              Edit TOS Details
            </h3>

            <div className="grid grid-cols-2 gap-4"> 

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Select Term
                </label>
                <select
                  name="term"
                  value={tosForm.term}
                  disabled
                  className="border rounded-md px-3 py-2 bg-gray-300 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                >
                  <option value={tos.term}>
                    {{
                      PRELIM: "Prelim",
                      MIDTERM: "Midterm",
                      FINALS: "Finals"
                    }[tos.term] || tos.term}
                  </option>
                </select>
              </div>

              {/* Total Items */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Total Test Items
                </label>
                <input
                  type="number"
                  name="total_items"
                  value={tosForm.total_items}
                  onChange={handleFormChange}
                  placeholder="Total No. of Test Items"
                  min="0"
                  onWheel={(e) => e.currentTarget.blur()}
                  className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              {/* CPYS */}
              <div className="flex flex-col col-span-2">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Curricular Program / Year level / Section
                </label>
                <input
                  type="text"
                  name="tos_cpys"
                  value={tosForm.tos_cpys}
                  onChange={handleFormChange}
                  placeholder="Curricular Program / Year level / Section"
                  className="col-span-2 border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            {/* TOPICS */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 dark:text-gray-200">
                Select Topics ({tosForm.term})
              </label>

              <div className="border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-3 max-h-48 overflow-y-auto space-y-2">
                {Array.isArray(tos.syllabus.course_outlines)
                  ? (() => {
                      const outlines = tos.syllabus.course_outlines.filter(
                        (co) => co.syllabus_term === tosForm.term
                      );

                      if (outlines.length === 0)
                        return <p className="text-gray-500">No course outlines available.</p>;

                      return outlines.map((co) => (
                        <label key={co.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(co.topics)}
                            onChange={() => handleTopicToggle(co.topics)}
                          />
                          <span>{co.topics}</span>
                        </label>
                      ));
                    })()
                  : <p className="text-gray-500">No course outlines available.</p>}
              </div>
            </div>
          </div>

          {/* COGNITIVE LEVELS */}
          <div className="rounded-lg border-2 p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg text-center">
              Cognitive Levels (in %)
            </h3>

            <div className="grid grid-cols-2 gap-4 mt-3">

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Knowledge (Max 50%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="col1_percentage"
                    value={tosForm.col1_percentage}
                    onChange={handleFormChange}
                    min="0" 
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Comprehension
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="col2_percentage"
                    value={tosForm.col2_percentage}
                    onChange={handleFormChange}
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Application / Analysis
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="col3_percentage"
                    value={tosForm.col3_percentage}
                    onChange={handleFormChange}
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Synthesis / Evaluation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="col4_percentage"
                    value={tosForm.col4_percentage}
                    onChange={handleFormChange}
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Validation */}
            {Number(tosForm.col1_percentage) > 50 && (
              <p className="text-red-500 mt-2">Knowledge cannot exceed 50%.</p>
            )}
            {(() => {
              const total =
                Number(tosForm.col1_percentage) +
                Number(tosForm.col2_percentage) +
                Number(tosForm.col3_percentage) +
                Number(tosForm.col4_percentage);

              if (total > 100)
                return <p className="text-red-500 mt-2">Total cannot exceed 100%. (Current: {total}%)</p>;

              if (total < 100)
                return <p className="text-red-500 mt-2">Total must equal 100%. (Current: {total}%)</p>;

              return null;
            })()}

            {/* Optional error */}
            {formError && <p className="text-red-600 mt-2">{formError}</p>}
          </div>

        </ModalBody>

        <ModalFooter>
          <Button disabled={isUpdating} onClick={(e) => handleUpdateTOS(e)}>{isUpdating ? "Saving Changes..." : "Save Changes"}</Button>
          <Button color="gray" onClick={() => setShowEditTOSModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal> 

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
            <div className="flex flex-col relative">
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

              {isCommentMode && (
                <TOSCommentComponent
                  tosId={tos.id!} 
                  direction="left" 
                />
              )}

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
                        <tr key={row.id} className="relative">
                          <td className="border border-black text-left p-2 w-[35%]">{row.topic}</td>
                          <td className="border border-black text-center w-[8%]">{row.no_hours}</td>
                          <td className="border border-black text-center w-[6%]">{row.percent}</td>
                          <td className="border border-black text-center w-[8%]">{row.no_items}</td>

                          <td className="border border-black text-center w-[10%]">{row.col1_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col2_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col3_value}</td>
                          <td className="border border-black text-center w-[10%]">{row.col4_value}</td> 
                          <td>
                          {isCommentMode && (
                            <TOSCommentComponent
                              tosId={tos.id} 
                              tosRowId={row.id}
                              direction="left" 
                            />
                          )}
                          </td>
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
                      <td className="border border-black text-center font-bold p-2">{total_hours_taught}</td>
                      <td className="border border-black text-center font-bold p-2">{total_percent}</td>
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