import { useState, useEffect, useRef, useMemo } from "react";  
import { useNavigate, useParams } from "react-router-dom";
import { formatEffectiveDate, formatRevisionNo } from "@/utils/formatters";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  Label,
  TextInput,
  Textarea,
  Checkbox,
  Spinner, // <-- added
} from "flowbite-react";
import { FaEdit, FaListAlt, FaChevronDown, FaBookOpen, FaChevronLeft, FaChevronRight, FaPlus, FaHighlighter, FaComments, FaCheckCircle, FaChevronUp } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { Undo2, CheckCircle, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDialog from "../../../components/ConfirmDialog";
import type { Syllabus } from "../../../types/syllabus";
import type { User } from "../../../types/bayanihan";
import { createEmptySyllabus } from "../../../utils/factories";
import { useSyllabusMode } from "@/context/SyllabusModeContext";
import SyllabusCommentComponent from "@/components/SyllabusCommentComponent";
import RemarkIcon from "../../../components/RemarkIcon"; 
import api from "../../../api";   

export default function SyllabusView() { 
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const activeRole = localStorage.getItem("activeRole");
  const role = activeRole?.toUpperCase();
  
  const { isCommentMode } = useSyllabusMode();  
  const [syllabus, setSyllabus] = useState<Syllabus>(createEmptySyllabus());
  const [instructors, setInstructors] = useState<User[]>([]) 

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [openDropdown, setOpenDropdown] = useState(null); 

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState(false);

  const [showPrev, setShowPrev] = useState(false);
  const [showDeanFeedback, setShowDeanFeedback] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(""); 
  
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bayanihan_group_id: "",
    effective_date: "",
    class_schedules: "",
    building_room: "",
    class_contact: "",
    consultation_hours: "",
    consultation_room: "",
    consultation_contact: "",
    course_description: "",
    instructor_ids: [] as number[],
  });

  const useAutoGrow = (value: string, active: boolean) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (!ref.current || !active) return;

      const el = ref.current;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }, [value, active]);

    return ref;
  };

  const classScheduleRef = useAutoGrow(formData.class_schedules, showModal);
  const buildingRoomRef = useAutoGrow(formData.building_room, showModal);
  const classContactRef = useAutoGrow(formData.class_contact, showModal);
  const consultationHoursRef = useAutoGrow(formData.consultation_hours, showModal);
  const consultationRoomRef = useAutoGrow(formData.consultation_room, showModal);
  const consultationContactRef = useAutoGrow(formData.consultation_contact, showModal);
  const courseDescRef = useAutoGrow(formData.course_description, showModal);

  // Fetch Syllabus details and also setFormData for Editing Syllabus Details
  useEffect(() => {
    let mounted = true;
    if (!syllabusId) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        setLoading(true);

        // Fetch Syllabi Details three in parallel for speed
        const res = await api.get(`/syllabi/${syllabusId}/?role=${role}`);

        if (!mounted) return;

        const syllabusData = res.data;
        setSyllabus(syllabusData);
        setFormData({
          bayanihan_group_id: res.data.bayanihan_group.id,
          effective_date: res.data.effective_date || "",
          class_schedules: res.data.class_schedules || "",
          building_room: res.data.building_room || "",
          class_contact: res.data.class_contact || "",
          consultation_hours: res.data.consultation_hours || "",
          consultation_room: res.data.consultation_room || "",
          consultation_contact: res.data.consultation_contact || "",
          course_description: res.data.course_description || "",
          instructor_ids: res.data.instructors?.map((i: any) => i.user.id) || [],
        });

      } catch (err: any) {
        console.error("Error loading data:", err);

        // Generic error handler (shared for all fetches)
        const data = err.response?.data;
        if (data) {
          if (typeof data === "object" && !Array.isArray(data)) {
            Object.entries(data).forEach(([field, messages]) => {
              if (field === "non_field_errors" && Array.isArray(messages)) {
                messages.forEach((msg) => toast.error(msg));
              } else if (Array.isArray(messages)) {
                messages.forEach((msg) => toast.error(`${msg}`));
              } else {
                toast.error(`${messages}`);
              }
            });
          } else if (typeof data === "string" || Array.isArray(data)) {
            toast.error(Array.isArray(data) ? data.join(", ") : data);
          } else {
            toast.error("An unexpected error occurred.");
          }
        } else {
          toast.error("Error fetching Syllabus or Review Form. Please try again later.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [syllabusId, role]);

  useEffect(() => {
    if (!showModal) return;

    setTimeout(() => {
      document.querySelectorAll("textarea.auto-expand").forEach((el) => {
        const textarea = el as HTMLTextAreaElement;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
      });
    }, 0);
  }, [showModal, syllabus]);
  
  // Fetch Teachers for Editing Syllabus Details
  useEffect(() => {  
    const teacherMembers = syllabus.bayanihan_group.bayanihan_members;

    // Deduplicate by user.id
    const uniqueTeachers: User[] = [];
    const seen = new Set<number>();

    for (const member of teacherMembers) {
      const u = member.user;  // <-- normalize
      if (!seen.has(u.id)) {
        seen.add(u.id);
        uniqueTeachers.push(u);
      }
    }

    setInstructors(uniqueTeachers);
 
    setFormData(prev => ({
      ...prev,
      instructor_ids: prev.instructor_ids.filter(id => seen.has(id))
    }));
  }, [syllabus]);
  
  // ✅ Calculate Course Outlines Hour totals
  const { midtermTotal, finalTotal } = useMemo(() => {
    const midterm = syllabus.course_outlines
      .filter((cot) => cot.syllabus_term === "MIDTERM")
      .reduce((sum, cot) => sum + (cot.allotted_hour || 0), 0);

    const finals = syllabus.course_outlines
      .filter((cot) => cot.syllabus_term === "FINALS")
      .reduce((sum, cot) => sum + (cot.allotted_hour || 0), 0);

    return { midtermTotal: midterm, finalTotal: finals };
  }, [syllabus]);

  // 🔔 Trigger CO Toast Alerts
  useEffect(() => {
    if (syllabus.chair_submitted_at) return;

    // MIDTERM
    if (midtermTotal > 35 && midtermTotal < 40) {
      showCOToast("warning", `Midterm hours (${midtermTotal}) are nearing the 40-hour limit.`);
    } else if (midtermTotal === 40) {
      showCOToast("success", "Midterm instructional hours reached exactly 40.");
    } else if (midtermTotal > 40) {
      showCOToast("error", `Midterm hours (${midtermTotal}) exceeded the 40-hour limit.`);
    }

    // FINALS
    if (finalTotal > 35 && finalTotal < 40) {
      showCOToast("warning", `Finals hours (${finalTotal}) are nearing the 40-hour limit.`);
    } else if (finalTotal === 40) {
      showCOToast("success", "Finals instructional hours reached exactly 40.");
    } else if (finalTotal > 40) {
      showCOToast("error", `Finals hours (${finalTotal}) exceeded the 40-hour limit.`);
    }
 
  }, [midtermTotal, finalTotal, syllabus.chair_submitted_at]);

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
  
  const addInstructor = (id: number) => {
    const selected = instructors.find(u => u.id === id);
    if (!selected) return;

    // Extract the phone number from user (adjust based on your actual User model)
    const phone = selected.phone;

    setFormData(prev => {
      const alreadyAdded = prev.instructor_ids.includes(id);

      let updatedContact = prev.class_contact.trim();

      if (phone) {
        // Add phone number ONLY if not already inserted
        const phoneExists = updatedContact
          .split(",")
          .map(p => p.trim())
          .includes(phone.trim());

        if (!phoneExists) {
          updatedContact = updatedContact
            ? `${updatedContact}, ${phone}`
            : phone;
        }
      }

      return alreadyAdded
        ? prev
        : {
            ...prev,
            instructor_ids: [...prev.instructor_ids, id],
            class_contact: updatedContact,
          };
    });
  };

  const removeInstructor = (id: number) => {
    const removed = instructors.find(u => u.id === id);
    if (!removed) return;

    const phone = removed.phone;

    setFormData(prev => {
      let updatedContact = prev.class_contact;

      if (phone) {
        updatedContact = updatedContact
          .split(",")
          .map(p => p.trim())
          .filter(p => p !== phone.trim())
          .join(", ");
      }

      return {
        ...prev,
        instructor_ids: prev.instructor_ids.filter(uid => uid !== id),
        class_contact: updatedContact,
      };
    });
  };
  const filteredInstructors = instructors.filter(
    u => !formData.instructor_ids.includes(u.id)
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}; 
    if (!formData.building_room) newErrors.building_room = "Required";
    if (!formData.class_schedules) newErrors.class_schedules = "Required";
    if (!formData.class_contact) newErrors.class_contact = "Required";
    if (!formData.course_description) newErrors.course_description = "Required";
    if (!formData.consultation_room) newErrors.consultation_room = "Required";
    if (!formData.consultation_hours) newErrors.consultation_hours = "Required";
    if (!formData.consultation_contact) newErrors.consultation_contact = "Required";
    if (formData.instructor_ids.length === 0) newErrors.instructor_ids = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();  

    try {
      setIsSaving(true);
      await api.put(`/syllabi/${syllabus.id}/`, formData);

      const res = await api.get(`/syllabi/${syllabus.id}/`)
      toast.success("Syllabus Details Edited!");  
      setSyllabus(res.data); 
      setShowModal(false);

    } catch (err: any) {
      console.error("Failed to update Syllabus", err);
  
      if (err.response && err.response.data) {
        const data = err.response.data;

        // If Django returned field-specific errors
        if (typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([field, messages]) => {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } 
        // Generic string or array message (like PermissionDenied)
        else if (typeof data === "string" || Array.isArray(data)) {
          toast.error(Array.isArray(data) ? data.join(", ") : data);
        } 
        else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Error editing Syllabus. Please check your input or try again.");
      }

    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitSyllabus = async () => {  
    setShowConfirm(false);
    setLoading(true);

    // Helper to stop loading + show toast + exit function
    const fail = (message: string) => {
      toast.error(message);
      setLoading(false);
      return;
    };

    const getText = (value: string | null | undefined) => value?.trim() || "";

    if (getText(syllabus.consultation_hours) === "") 
      return fail("Please provide the consultation schedule before submitting the syllabus.");

    if (getText(syllabus.consultation_room) === "") 
      return fail("Please provide the consultation bldg.rm. before submitting the syllabus.");

    if (getText(syllabus.consultation_contact) === "") 
      return fail("Please provide the consultation contact information before submitting the syllabus.");

    if (getText(syllabus.course_description) === "") 
      return fail("Please provide a Course Description before submitting the syllabus.");

    if (syllabus.course_outcomes.length === 0) 
      return fail("No Course Outcomes found. Please add Course Outcomes.");

    if (syllabus.instructors.length === 0) 
      return fail("No instructors are assigned to this syllabus. Please add at least one instructor.");

    if (syllabus.syllcopos.length === 0) 
      return fail("Missing CO–PO Mapping. Please complete the Course Outcome to Program Outcome mapping.");

    const midtermCount = syllabus.course_outlines.filter(
      (o) => o.syllabus_term === "MIDTERM"
    ).length;

    const finalsCount = syllabus.course_outlines.filter(
      (o) => o.syllabus_term === "FINALS"
    ).length;

    if (midtermCount === 0 || finalsCount === 0)
      return fail("Course Outlines incomplete. Please ensure both MIDTERM and FINALS outlines are provided.");

    if (midtermTotal !== 40)
      return fail(`Midterm instructional hours must total 40 hours. Current total: ${midtermTotal} hours.`);

    if (finalTotal !== 40)
      return fail(`Finals instructional hours must total 40 hours. Current total: ${finalTotal} hours.`); 

    // ✅ Check if the Bayanihan leader has a signature
    const leader = syllabus.bayanihan_group?.bayanihan_members?.find(
      (member: any) => member.role === "LEADER"
    )?.user;

    if (!leader?.signature) {
      return fail(
        "Cannot submit syllabus because the Bayanihan Leader does not have a signature set. Please upload the signature in the leader's profile first."
      );
    }

    try {
      const { data } = await api.patch(
        `/syllabi/${syllabus.id}/submit-syllabus/?role=${role}`
      ); 
      toast.success("Syllabus submitted successfully!"); 
      setSyllabus(data); // ✅ directly use response

    } catch (err: any) {
      console.error("Failed to submit Syllabus", err);
 
      if (err.response && err.response.data) {
        const data = err.response.data;

        // If Django returned field-specific errors
        if (typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([field, messages]) => {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } 
        // Generic string or array message (like PermissionDenied)
        else if (typeof data === "string" || Array.isArray(data)) {
          toast.error(Array.isArray(data) ? data.join(", ") : data);
        } 
        else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Error submitting Syllabus. Please check your input or try again.");
      }
      
    } finally {
      setLoading(false); 
    }
  };

  const handleReplicateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();

    try { 
      setLoading(true);
      const { data: newSyllabus } = await api.post(`/syllabi/${syllabus.id}/replicate-syllabus/?role=${role}`);
 
      toast.success("Syllabus replicated successfully!"); 

      // Update state to reflect the new syllabus
      setSyllabus(newSyllabus); 
 
    } catch (err: any) {
      console.error("Error replicating syllabus:", err);
     
      if (err.response && err.response.data) {
        const data = err.response.data;

        // If Django returned field-specific errors
        if (typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([field, messages]) => {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } 
        // Generic string or array message (like PermissionDenied)
        else if (typeof data === "string" || Array.isArray(data)) {
          toast.error(Array.isArray(data) ? data.join(", ") : data);
        } 
        else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Failed to replicate syllabus. Please try again.");
      } 

    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: "approve" | "reject") => {
    if (!syllabus.id) return;  

    try {
      setLoading(true);
      if (decision === "approve") {
        const res = await api.patch(
          `/syllabi/${syllabus.id}/review-syllabus-dean/?role=${role}`,
          { decision: "approve" }
        );   
        setSyllabus(res.data);

        toast.success("Syllabus approved successfully!");

      } else if (decision === "reject") { 
        const res = await api.patch(`/syllabi/${syllabus.id}/review-syllabus-dean/?role=${role}`,
          { decision: "reject", feedback_text: feedback }
        );  
        setSyllabus(res.data);
        
        toast.success("Syllabus returned with feedback.");
        setIsModalOpen(false);
        setFeedback("");
      } 

    } catch (err: any) {
      console.error("Error reviewing syllabus:", err);
     
      if (err.response && err.response.data) {
        const data = err.response.data;

        // If Django returned field-specific errors
        if (typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([field, messages]) => {
            if (field === "non_field_errors" && Array.isArray(messages)) {
              // 🔹 Only show the messages directly
              messages.forEach((msg) => toast.error(msg));
            } else if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } 
        // Generic string or array message (like PermissionDenied)
        else if (typeof data === "string" || Array.isArray(data)) {
          toast.error(Array.isArray(data) ? data.join(", ") : data);
        } 
        else {
          toast.error("An unexpected error occurred.");
        }
      } else {
        toast.error("Something went wrong while reviewing.");
      }
      
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (menu: any) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  }; 

  const showCOToast = (type: "warning" | "success" | "error", message: string) => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      case "error":
        toast.error(message);
        break;
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

  return (
    <div className="font-thin min-h-screen my-14"> 
      <ToastContainer position="top-right" autoClose={3000} closeOnClick theme="colored" /> 
      
      {/* Loading overlay (blocks view until done) */}
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
        onClick={() => navigate(`/${activeRole}/syllabus/`)}
        aria-label="Back to syllabus list"
        className="absolute top-20 left-5 z-30 p-2 rounded-full text-white bg-transparent hover:bg-white/10 transition"
      >
        <FaChevronLeft size={22} color="white" />
      </button>

      {/* Status-specific Banners and Actions */}
      {(() => {
        switch (syllabus.status) {
          case "Pending Chair Review":
            if (syllabus.chair_submitted_at && !syllabus.chair_rejected_at && !syllabus.dean_submitted_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Pending Chair Review"]}
                  > 
                    <p className="mb-2">
                      <strong>Notice:</strong> This syllabus has been submitted to the
                      Chairman for review. You may review the syllabus below.
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`review-syllabus`)}
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Pending Chair Review"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#B45309") // darker amber
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Pending Chair Review"].color || "")
                        }
                      >
                        Review Syllabus
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            break;

          case "Returned by Chair":
            if (syllabus.chair_rejected_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Returned by Chair"]}
                  > 
                    <p className="mb-2">
                      <strong>Notice:</strong> The Chairman has returned this syllabus.
                      Check the review form for the revisions.
                    </p>
                    <div className="flex justify-center gap-1">
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
                      {/* Replicate Syllabus */}
                      { syllabus.is_latest && ( 
                        <button
                          onClick={handleReplicateSyllabus}
                          className="px-6 py-2 rounded-lg shadow transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
                        >
                          Replicate Syllabus
                        </button>
                      )}
                    </div> 
                  </div>
                </div>
              );
            }
            break;

          case "Revisions Applied":
            if (syllabus.chair_submitted_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Revisions Applied"]}
                  >
                    <p className="mb-2">
                      <strong>Notice:</strong> This syllabus has been re-submitted
                      with revisions and is awaiting Chairman&apos;s re-review.
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate(`review-syllabus`)}
                        className="px-6 py-2 rounded-lg shadow transition-colors duration-200"
                        style={{
                          backgroundColor: statusStyles["Revisions Applied"].color,
                          color: "#fff",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1E3A8A") // darker blue
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            statusStyles["Revisions Applied"].color || "")
                        }
                      >
                        Review Syllabus
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            break;

          case "Approved by Chair":
            if (syllabus.dean_submitted_at && !syllabus.chair_rejected_at) {
              return (
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Approved by Chair"]}
                  >
                    <p className="mb-2">
                      <strong>Notice:</strong> This syllabus has been approved by the
                      Chairman. It is now pending Dean’s review.
                    </p>
                    <div className="flex justify-center gap-3">
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

                    {/* Action Buttons */}
                    <div className="flex justify-center">
                      {/* Return for Revision */}
                      <div className="bg-red-600 py-2 px-3 text-pink-100 rounded shadow-lg hover:scale-105 transition ease-in-out mx-2">
                        <div className="flex items-center space-x-2">
                          <Undo2 size={20} className="text-pink2" />
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
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

                    {/* Feedback Modal */}
                    {isModalOpen && (
                      <div className="fixed inset-0 flex items-center justify-center bg-white/25 z-50">
                        <div className="bg-white w-[35%] rounded-lg shadow-lg relative p-6">
                          {/* Header */}
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                              Give Feedback
                            </h2>
                            <button
                              onClick={() => setIsModalOpen(false)}
                              className="hover:bg-gray-200 p-1 rounded-full"
                            >
                              <X size={20} className="text-gray-600" />
                            </button>
                          </div>

                          {/* Instructions */}
                          <p className="text-gray-500 mb-4">
                            Could you please provide more information on why the
                            syllabus submission was returned for revision?
                          </p>

                          {/* Form */}
                          <form onSubmit={() => handleReview("reject")} className="relative ">
                            <textarea
                              className="resize-none border border-blue-500  focus:outline-blue-600 w-full rounded-lg p-2 flex-grow"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              rows={10}
                              placeholder="Write your feedback here..."
                            />

                            <div className="flex justify-end mt-4">
                              <button
                                type="submit"
                                className="bg-blue-500 px-3 py-2 rounded-lg text-white hover:bg-blue-600"
                              >
                                Submit
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )} 
                  </div>
                </div>
              );
            }
            break;

          case "Returned by Dean":
            if (syllabus.dean_rejected_at) {
              return ( 
                <div className="flex flex-row items-center justify-center font-normal">
                  <div
                    className="p-4 mb-4 rounded"
                    style={statusStyles["Returned by Dean"]}
                  >
                    <p className="mb-2">
                      <strong>Notice:</strong> The Dean has returned this syllabus.
                      Please check Dean feedback and revise accordingly.
                    </p> 
                    <div className="flex justify-center gap-3">  
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
                      {/* Replicate Syllabus */}
                      { syllabus.is_latest && ( 
                        <button
                          onClick={handleReplicateSyllabus}
                          className="px-6 py-2 rounded-lg shadow transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
                        >
                          Replicate Syllabus
                        </button>
                      )}
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
                </div>
              );
            }
            break;

          case "Approved by Dean":
            if (syllabus.dean_approved_at) {
              return ( 
                <div className="flex flex-row items-center justify-center font-normal">
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
                </div>
              );
            }
            break;

          case "Draft":
          case "Requires Revision":
            return (
              <div className="flex flex-row justify-between items-center ml-16 font-normal">
                {/* Left group → action buttons */}
                <div className="flex flex-row space-x-4">
                  {/* Edit Syllabus Info */}
                  <div className="bg-blue-700 py-2 px-3 text-white rounded shadow-lg hover:scale-105 transition ease-in-out cursor-pointer">
                    <button 
                      onClick={() => setShowModal(true)}
                      type="button"
                      className="flex items-center space-x-2"
                    >
                      <FaEdit size={20} />
                      <span>Edit Syllabus Details</span>
                    </button>
                  </div>

                  {/* Course Outcome Dropdown */}
                  <div className="relative inline-block text-blue-700 bg-white py-2 px-3 rounded shadow-lg">
                    <button
                      onClick={() => toggleDropdown("courseOutcome")}
                      className="flex items-center space-x-2 text-blue-700 cursor-pointer"
                    >
                      <FaListAlt size={22} />
                      <span>Course Outcome</span>
                      <FaChevronDown />
                    </button>

                    {openDropdown === "courseOutcome" && (
                      <ul className="absolute z-50 mt-3 left-0 min-w-[260px] bg-white rounded-b-lg shadow-2xl py-2">
                        <li className="hover:text-sePrimary hover:bg-gray-200">
                          <button
                            onClick={() => navigate(`course-outcomes`)}
                            type="button"
                            className="flex w-full items-center space-x-2 px-4 py-2 cursor-pointer"
                          >
                            <FaPlus size={18} />
                            <span>Manage Course Outcomes</span>
                          </button>
                        </li> 
                        <li className="hover:text-sePrimary hover:bg-gray-200">
                          <button
                          onClick={() => navigate("syllco-pos")}
                            type="button"
                            className="flex text-yellow-400 w-full items-center space-x-2 px-4 py-2 cursor-pointer"
                          >
                            <MdAssignment size={18} />
                            <span>Edit CO ↔ PO Mapping</span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>

                  {/* Course Outline Dropdown */}
                  <div className="relative inline-block bg-white py-2 px-3 rounded shadow-lg text-blue-700">
                    <button
                      onClick={() => toggleDropdown("courseOutline")}
                      className="flex items-center space-x-2 text-blue"
                    >
                      <FaBookOpen size={22} />
                      <span>Course Outline</span>
                      <FaChevronDown />
                    </button> 

                    {openDropdown === "courseOutline" && (
                      <ul className="absolute z-50 mt-3 left-0 min-w-[320px] bg-white rounded-b-lg shadow-2xl py-2">
                        <li className="hover:text-sePrimary hover:bg-gray-200">
                          <button
                            onClick={() => navigate(`course-outlines/MIDTERM`)}
                            type="button"
                            className="flex w-full items-center space-x-2 px-4 py-2"
                          >
                            <FaPlus size={18} />
                            <span>Manage Midterm Course Outline</span>
                          </button>
                        </li>
                        <li className="hover:text-sePrimary hover:bg-gray-200">
                          <button
                            onClick={() => navigate(`course-outlines-reorder/MIDTERM`)}
                            type="button"
                            className="text-yellow-400 flex w-full items-center space-x-2 px-4 py-2"
                          >
                            <FaEdit size={18} />
                            <span>Edit Midterm Course Outline Order</span>
                          </button>
                        </li>
                        <li className="hover:text-sePrimary hover:bg-gray-200">
                          <button
                            onClick={() => navigate(`course-outlines/FINALS`)}
                            type="button"
                            className="flex w-full items-center space-x-2 px-4 py-2"
                          >
                            <FaPlus size={18} />
                            <span>Manage Final Course Outline</span>
                          </button>
                        </li>
                        <li className="text-yellow-400 hover:text-sePrimary hover:bg-gray-200">
                          <button
                            onClick={() => navigate(`course-outlines-reorder/FINALS`)}
                            type="button"
                            className="flex w-full items-center space-x-2 px-4 py-2"
                          >
                            <FaEdit size={18} />
                            <span>Edit Final Course Outline Order</span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>

                  {/* Course Requirement */}
                  <div className="relative inline-block bg-white py-2 px-3 rounded shadow-lg text-blue-700 hover:scale-105 transition ease-in-out cursor-pointer">
                    <button 
                      onClick={() => navigate(`course-requirements`)}
                      type="button"
                      className="flex items-center space-x-2 text-blue"
                    >
                      <FaListAlt size={22} />
                      <span>Manage Course Requirements</span>
                      <FaChevronRight size={10}/>
                    </button>
                  </div>

                  {/* Highlight Revisions Toggle OR Show Dean Feedback Button*/} 
                  {syllabus.previous_version?.status === "Returned by Chair" && (
                    <div className="flex items-center bg-yellow-300 px-3 py-2 rounded shadow-lg space-x-4 cursor-pointer">
                      <label htmlFor="toggleRevisions" className="cursor-pointer font-medium">
                        <FaHighlighter className="inline mr-1" />
                        Highlight Revisions
                      </label>
                      <Checkbox 
                        id="toggleRevisions"
                        color="white" 
                        checked={showPrev}
                        onChange={(e) => setShowPrev(e.target.checked)}
                        className="cursor-pointer"
                      />
                    </div>
                  )}

                  {syllabus.previous_version?.status === "Returned by Dean" && (
                    <>
                      {/* Button to open Dean Feedback modal */}
                      <button
                        type="button"
                        onClick={() => setShowDeanFeedback(true)}
                        className="flex items-center text-white bg-blue-600 hover:bg-blue-700 hover:scale-110 transition duration-200 px-3 py-2 rounded shadow-lg space-x-2 cursor-pointer border border-blue-700"
                      >
                        <FaComments size={18} />
                        <span>View Dean Feedback</span>
                      </button>

                      {/* Dean Feedback Modal */}
                      {showDeanFeedback && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50">
                          <div className="bg-white w-[90%] max-w-xl rounded-xl shadow-2xl relative p-6 animate-fadeIn">
                            
                            {/* Header */}
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                              <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                                <span className="inline-block w-2 h-6 bg-blue-600 rounded-sm"></span>
                                Dean Feedback
                              </h2>
                              <button
                                onClick={() => setShowDeanFeedback(false)}
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
                                value={
                                  syllabus.previous_version?.dean_feedback?.feedback_text ||
                                  "No feedback provided."
                                }
                                rows={8}
                                disabled
                              />
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end mt-6">
                              <button
                                onClick={() => setShowDeanFeedback(false)}
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </>
                  )}
                </div>

                {/* Right group → Submit button */}
                <div>
                  <div className={`bg-green-300 py-2 px-3 mr-16 text-green-600 rounded shadow-lg hover:scale-105 transition ease-in-out 
                    ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center space-x-2"
                      disabled={loading}
                    >
                      <FaCheckCircle size={20} />
                      <span>{loading ? "Submitting" : "Submit"}</span>
                    </button>
                  </div>
                </div>
                
                <ConfirmDialog
                  isOpen={showConfirm}
                  title="Submit Syllabus?"
                  message="Once submitted, you might not be able to edit it anymore."
                  confirmText="Yes, Submit"
                  doubleConfirm={true}
                  onConfirm={handleSubmitSyllabus}
                  onClose={() => setShowConfirm(false)}
                />
              </div>
            );
        }
      })()}

      {/* Edit Syllabus Details Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl" popup>
        <div className="relative flex flex-col bg-gradient-to-r from-[#FFF] to-[#dbeafe] rounded-xl shadow-lg p-6 border border-white w-full max-w-4xl">
          {/* X button */}
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="absolute top-3 right-5 text-gray-600 font-bold text-xl hover:text-gray-900 focus:outline-none"
          >
            ✕
          </button>

          {/* ModalHeader */}
          <div className="flex justify-center w-full my-2">
            <img
              src="/assets/Edit Syllabus Header.png"
              alt="Edit Syllabus"
              className="w-[280px] h-auto"
            />
          </div> 

          <ModalBody>
            <form className="space-y-8">
              {/* Bayanihan Group (disabled) */}
              <h3 className="text-2xl font-bold text-black">Bayanihan Group</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="!text-black">Bayanihan Group</Label>
                  <Button color="light" disabled className="w-full mt-1">
                    {syllabus.bayanihan_group.course.course_code} -{" "}
                    {syllabus.bayanihan_group.course.course_title} (
                    {syllabus.bayanihan_group.school_year})
                  </Button>
                </div>

                <div>
                  <Label htmlFor="effective_date" className="text-black!">Effective Date</Label>
                  <TextInput
                    type="date"
                    id="effective_date"
                    name="effective_date"
                    disabled
                    value={formData.effective_date} 
                  /> 
                </div>
              </div>

              <h3 className="text-2xl font-bold text-black">Schedules & Building Rooms</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-4">
                    <Label htmlFor="class_schedules" className="!text-black">Class Schedule</Label>
                    <Textarea
                      ref={classScheduleRef}
                      id="class_schedules"
                      name="class_schedules" 
                      rows={1}
                      className="auto-expand resize-none overflow-hidden rounded-xs"
                      value={formData.class_schedules}
                      onChange={handleInputChange}
                    />
                    {errors.class_schedules && <p className="text-red-500">{errors.class_schedules}</p>}
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="building_room"  className="!text-black">Bldg/Rm No.</Label>
                    <Textarea
                      ref={buildingRoomRef}
                      id="building_room"
                      name="building_room"
                      rows={1}
                      className="auto-expand resize-none overflow-hidden rounded-xs"
                      value={formData.building_room}
                      onChange={handleInputChange}
                    />
                    {errors.building_room && <p className="text-red-500">{errors.building_room}</p>}
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <Label htmlFor="consultation_hours" className="!text-black">
                      Consultation Schedule
                    </Label>
                    <Textarea
                      ref={consultationHoursRef}
                      id="consultation_hours"
                      name="consultation_hours"
                      rows={1}
                      className="auto-expand resize-none overflow-hidden rounded-xs"
                      value={formData.consultation_hours}
                      onChange={handleInputChange}
                    />
                    {errors.consultation_hours && <p className="text-red-500 text-sm">{errors.consultation_hours}</p>}
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="consultation_room" className="!text-black">
                      Consultation Bldg. Room
                    </Label>
                    <Textarea
                      ref={consultationRoomRef}
                      id="consultation_room"
                      name="consultation_room"
                      rows={1}
                      className="auto-expand resize-none overflow-hidden rounded-xs"
                      value={formData.consultation_room}
                      onChange={handleInputChange}
                    />
                    {errors.consultation_room && <p className="text-red-500 text-sm">{errors.consultation_room}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="consultation_contact"  className="!text-black">Office Phone No./Local</Label>
                    <Textarea
                      ref={consultationContactRef}
                      id="consultation_contact"
                      name="consultation_contact"
                      rows={1}
                      className="auto-expand resize-none overflow-hidden rounded-xs"
                      value={formData.consultation_contact}
                      onChange={handleInputChange}
                    />
                    {errors.consultation_contact && <p className="text-red-500">{errors.consultation_contact}</p>}
                  </div>
                </div>
              </div> 

              <h3 className="text-2xl font-bold text-black">Instructor Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Instructors picker */}
                <div className="relative">
                  <Label className="!text-black">Instructors</Label>
                  <div
                    className="mt-1 min-h-[42px] border rounded p-2 flex flex-wrap gap-2 cursor-text bg-[#374151] text-white"
                    onClick={() => setShowInstructorDropdown(s => !s)}
                  >
                    {formData.instructor_ids.map(uid => {
                      const u = instructors.find(t => t.id === uid);
                      if (!u) return null;
                      return (
                        <span key={`instructor-${uid}`} className="inline-flex items-center gap-1 border rounded px-2 py-1 text-sm">
                          {displayName(u)}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeInstructor(uid); }}
                            className="ml-1 text-red-600"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {formData.instructor_ids.length === 0 && (
                      <span className="text-gray-400">Click to add instructors…</span>
                    )}
                  </div>

                  {/* Disclosure message */}
                  <p className="text-gray-400 text-xs mt-1">
                    When an instructor is added, their email will also be automatically added.
                  </p>

                  {showInstructorDropdown && (
                    <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border rounded shadow ">
                      {filteredInstructors.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-300 bg-[#374151]">No more users</div>
                      ) : filteredInstructors.map(u => (
                        <button
                          key={`instructoropt-${u.id}`}
                          type="button"
                          onClick={() => addInstructor(u.id)}
                          className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          {displayName(u)}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.instructor_ids && <p className="text-red-500 text-sm">{errors.instructor_ids}</p>}
                </div>
                
                <div>
                  <Label htmlFor="class_contact"  className="!text-black">Mobile No.</Label>
                  <Textarea
                    ref={classContactRef}
                    id="class_contact"
                    name="class_contact"
                    rows={1}
                    className="auto-expand resize-none overflow-hidden rounded-xs"
                    value={formData.class_contact}
                    onChange={handleInputChange}
                  />
                  {errors.class_contact && <p className="text-red-500">{errors.class_contact}</p>}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-black">Course Description</h3>
              <div> 
                <div> 
                  <Textarea
                    ref={courseDescRef}
                    id="course_description"
                    name="course_description"
                    rows={1}
                    className="auto-expand resize-none overflow-hidden rounded-xs"
                    value={formData.course_description}
                    onChange={handleInputChange}
                  />
                  {errors.course_description && <p className="text-red-500">{errors.course_description}</p>}
                </div> 
              </div>
            </form>
          </ModalBody>

          <ModalFooter className="flex justify-center">
            <Button disabled={isSaving} onClick={handleEditSyllabus} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Button>
            <Button color="gray" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* SYLLABUS SECTION */}
      <div className={`mx-auto mt-6 w-11/12 max-w-[1500px] border-[3px] border-black bg-white font-serif text-sm p-4 px-24 relative
        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "format")?.response === "no" || 
          (showPrev &&
            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "format")?.response === "no"
          ))
          ? "border-4 border-red-600"
          : "border-black"
        }
      `}>
        <RemarkIcon
          checklistItems={syllabus.review_form?.checklist_items.filter(
            (item) => item.item.syllabus_section === "format"
          )}
          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
            (item) => item.item.syllabus_section === "format"
          )}
          showPrevRevisions={showPrev}
        />
        {/* SYLLABUS HEADER SECTION */}
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
        <table className="mt-2 w-full max-w-full mx-auto border-2 border-solid border-black  text-sm bg-white font-[Times-New-Roman]">
          <tbody>
            {/* 1st Header */}
            <tr>
              <th colSpan={2} className={`font-medium border-1 border-solid px-4 relative border-black
                ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "header_1")?.response === "no" || 
                  (showPrev &&
                    syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "header_1")?.response === "no"
                  ))
                  ? "border-3 border-red-600 " // red border + slight red background
                  : "border-black"
                }
              `}>
                <span className="font-bold">{syllabus.college.college_description}</span>
                <br />
                {syllabus.program.department.department_name}
                <RemarkIcon
                  checklistItems={syllabus.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "header_1"
                  )}
                  previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "header_1"
                  )}
                  showPrevRevisions={showPrev}
                /> 
                {isCommentMode && (
                  <SyllabusCommentComponent
                    syllabusId={syllabus.id!}
                    section="header_1"
                    direction="left"
                  />
                )}
              </th>
              <th className={`font-medium border-2 border-solid border-black text-left px-4 w-2/6 relative 
                ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "header_2")?.response === "no" || 
                  (showPrev &&
                    syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "header_2")?.response === "no"
                  ))
                  ? "border-3 border-red-600 " // red border + slight red background
                  : "border-black"
                }`}>
                <span className="font-bold underline underline-offset-4">Syllabus<br /></span>
                Course Title: <span className="font-bold">{syllabus.course.course_title}<br /></span>
                Course Code: <span className="font-bold">{syllabus.course.course_code}<br /></span> 
                Credits: <span className="font-bold">{syllabus.course.course_credit_unit} units ({syllabus.course.course_hrs_lec} hours lecture, {syllabus.course.course_hrs_lab} hrs Laboratory)<br /></span>
                <RemarkIcon
                  checklistItems={syllabus.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "header_2"
                  )}
                  previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "header_2"
                  )}
                  showPrevRevisions={showPrev}
                /> 
                {isCommentMode && (
                  <SyllabusCommentComponent
                    syllabusId={syllabus.id!}
                    section="header_2"
                    direction="left"
                  />
                )}
              </th>
            </tr>
            {/* 2nd Header */}
            <tr>
              <td className={`w-[20%] border-2 border-solid font-medium text-sm border-black text-left px-4 align-top relative
                ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "side_section")?.response === "no" || 
                  (showPrev &&
                    syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "side_section")?.response === "no"
                  ))
                  ? "border-3 border-red-600 " // red border + slight red background
                  : "border-black"
                }
              `}>
                <RemarkIcon
                  checklistItems={syllabus.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "side_section"
                  )}
                  previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                    (item) => item.item.syllabus_section === "side_section"
                  )}
                  showPrevRevisions={showPrev}
                />
                
                {/* VISION */}
                <div className="mt-2 mb-8 relative">
                  <span className="font-bold">USTP Vision<br /><br /></span>
                  <p>The University is a nationally recognized Science and Technology University providing the vital link between education and the economy.</p>
                  {isCommentMode && (
                    <SyllabusCommentComponent
                      syllabusId={syllabus.id!}
                      section="side_vision_mission"
                      direction="right"
                    />
                  )}
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

                {/* CORE VALUES */}
                <div className="mb-8 relative">
                    <span className="font-bold">USTP Core Values<br /><br /></span>
                    <p>A. <span className="font-bold">Unselfish Dedication</span> – Selfless
                      commitment and complete fidelity
                      towards a course of action
                      or goal.
                    </p>
                    <p>B. <span className="font-bold">Social Responsiveness</span> –
                      Ethical/moral responsibility leading
                      to corrective action on social
                      issues and contributions for the
                      betterment of the environment and the
                      community’s quality
                    </p>
                    <p>C. <span className="font-bold">Transformational Leadership</span> –
                      Leading through inspiration and by
                      example to foster positive
                      change with the end goal of
                      developing followers into leaders.
                    </p>
                    <p>
                      D. <span className="font-bold">Prudence</span> – Self-governance
                      leading to circumspection and good
                      judgment in the management
                      of affairs and use of resources.
                    </p>
                </div>

                {/* PEO */}
                <div className={`mb-8 relative`}>
                    <span className="font-bold">Program Educational Objectives<br /><br /></span>
                    {syllabus.peos.map((peo) => (
                    <div className="mb-2" key={peo.id}>
                        <p><span className="font-semibold">{peo.peo_code}: </span>{peo.peo_description}</p>
                    </div>
                    ))} 
                    {isCommentMode && (
                      <SyllabusCommentComponent
                        syllabusId={syllabus.id!}
                        section="side_peos"
                        direction="right"
                      />
                    )}
                </div>
                {/* Program Outcomes */}
                <div className={`mb-8 relative`}>
                    <span className="font-bold">Program Outcomes<br /><br /></span>
                    {syllabus.program_outcomes.map((po) => (
                    <div className="mb-5" key={po.id}>
                        <p><span className="font-semibold leading-relaxed">{po.po_letter}: </span>{po.po_description}</p>
                    </div> 
                    ))} 
                    {isCommentMode && (
                      <SyllabusCommentComponent
                        syllabusId={syllabus.id!}
                        section="side_pos"
                        direction="right"
                      />
                    )}
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
                      <td className={`border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative 
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_1")?.response === "no" || 
                          (showPrev &&
                            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_1")?.response === "no"
                          ))
                          ? "border-3 border-red-600 " 
                          : "border-black"
                        }
                      `}>
                        Semester/Year: {syllabus.course.course_semester.toLowerCase()} Semester -  AY {syllabus.bayanihan_group.school_year}
                        <br />
                        <span className="wrap-break-word whitespace-pre-line">
                          Class Schedule: {syllabus.class_schedules}
                        </span>
                        <br /> 
                        <span className="wrap-break-word whitespace-pre-line">
                          Bldg./Rm. No.: {syllabus.building_room}
                        </span>
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_1"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_1"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="section_1"
                            direction="left" 
                          />
                        )}
                      </td>
                      <td className={`border-2 border-solid font-medium text-start max-w-[250px] wrap-break-word whitespace-pre-line text-top px-4 relative 
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_2")?.response === "no" || 
                          (showPrev &&
                            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_2")?.response === "no"
                          ))
                          ? "border-3 border-red-600 " // red border + slight red background
                          : "border-black"
                        }`
                      }>
                        Pre-requisite(s): {syllabus.course.course_pre_req} <br />
                        Co-requisite(s): {syllabus.course.course_co_req}
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_2"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_2"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="section_2"
                            direction="left" 
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={`items-start border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_3")?.response === "no" || 
                          (showPrev &&
                            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_3")?.response === "no"
                          ))
                          ? "border-3 border-red-600 " // red border + slight red background
                          : "border-black"
                        }
                      `}>
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
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_3"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_3"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="section_3"
                            direction="left" 
                          />
                        )}
                      </td>
                      <td className={`border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_4")?.response === "no" || 
                          (showPrev &&
                            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "section_4")?.response === "no"
                          ))
                          ? "border-3 border-red-600 " 
                          : "border-black"
                        }
                      `}>
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
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_4"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "section_4"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="section_4"
                            direction="left" 
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className={`items-start border-2 border-solid font-medium text-left px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_description")?.response === "no" || 
                          (showPrev &&
                            syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_description")?.response === "no"
                          ))
                          ? "border-3 border-red-600 " 
                          : "border-black"
                        }
                      `}>
                        <span className="text-left font-bold">I. Course Description:</span>
                        <br /> 
                        <span className="wrap-break-word whitespace-pre-line">  
                          {syllabus.course_description}
                        </span>
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_description"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_description"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="course_description"
                            direction="left" 
                          />
                        )}
                      </td>
                    </tr>
                    {/* Course Outcomes Table */}
                    <tr>
                        <td colSpan={2} className={`border-2 border-solid font-medium px-4 max-w-[250px] wrap-break-word whitespace-pre-line relative 
                          ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_outcomes")?.response === "no" || 
                              (showPrev &&
                                syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_outcomes")?.response === "no"
                              ))
                              ? "border-3 border-red-600 " 
                              : "border-black"
                            }
                        `}>
                          <span className="text-left font-bold">II. Course Outcome:</span> 
                          <table className={`m-10 mx-auto border-2 border-solid w-full `}>
                            <thead>
                              <tr className="border-2 border-solid border-black"> 
                                <th className="border-2 border-solid border-black align-middle" rowSpan={2}>
                                  Course Outcomes (CO)
                                </th>
                                <th
                                  className="border-2 border-solid border-black text-center relative"
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
                          <RemarkIcon
                            checklistItems={syllabus.review_form?.checklist_items.filter(
                              (item) => item.item.syllabus_section === "course_outcomes"
                            )}
                            previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                              (item) => item.item.syllabus_section === "course_outcomes"
                            )}
                            showPrevRevisions={showPrev}
                          />
                          {isCommentMode && (
                            <SyllabusCommentComponent
                              syllabusId={syllabus.id!}
                              section="course_outcomes"
                              direction="left" 
                            />
                          )}
                        </td>
                    </tr>
                    {/* Course Outline Table */}
                    <tr>
                      <td colSpan={2} className={`border-2 border-solid font-medium px-4 border-black relative 
                        ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_outlines")?.response === "no" || 
                            (showPrev &&
                              syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_outlines")?.response === "no"
                            ))
                            ? "border-3 border-red-600 " 
                            : ""
                          }
                      `}>
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_outlines"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_outlines"
                          )}
                          showPrevRevisions={showPrev}
                        />
                        <span className="text-left font-bold">III. Course Outline:</span>
                        <br />
                        <table className="m-5 mx-auto border-2 border-solid w-full border-black">
                          <thead>
                            <tr className="border-2 border-solid border-black">
                              <th className={`border-2 border-solid border-black`}>
                                Allotted Time  
                              </th>
                              <th className="border-2 border-solid border-black">
                                Course Outcomes (CO)
                              </th>
                              <th className={`border-2 border-solid border-black`}>
                                Intended Learning Outcome (ILO) 
                              </th>
                              <th className={`border-2 border-solid border-black`}>
                                Topics 
                              </th>
                              <th className={`border-2 border-solid border-black`}>
                                Suggested Readings 
                              </th>
                              <th className={`border-2 border-solid border-black`}>
                                Teaching Learning Activities 
                              </th>
                              <th className={`border-2 border-solid border-black`}> 
                                Assessment Tasks/Tools 
                              </th>
                              <th className={`border-2 border-solid border-black`}>
                                Grading Criteria 
                              </th>
                              <th className={`border-2 border-solid border-black`}> 
                                Remarks 
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {syllabus.course_outlines
                              .filter(cot => cot.syllabus_term === "MIDTERM")
                              .sort((a, b) => a.row_no - b.row_no) // ✅ sort by row_no ascending
                              .map((cot, idx) => (
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
                              .map((cot, idx) => (
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
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="course_outlines"
                            direction="left" 
                          />
                        )}
                      </td>
                    </tr>
                    {/* Course Requirements */}
                    <tr className={`crq border-2 relative
                      ${(syllabus.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_requirements")?.response === "no" || 
                        (showPrev &&
                          syllabus.previous_version?.review_form?.checklist_items.find((item) => item.item.syllabus_section === "course_requirements")?.response === "no"
                        ))
                        ? "border-3 border-red-600 " 
                        : "border-black"
                      }
                    `}>
                      <td colSpan={2} className="border-2 border-solid font-medium border-black max-w-full px-2 relative">
                        <span className="text-left font-bold">IV. Course Requirements:</span>
                        <br />
                        <div className="crq prose prose-sm sm:prose lg:prose-lg max-w-fit px-4">
                          <div className="max-w-fit" dangerouslySetInnerHTML={{ __html: syllabus.course_requirements || "" }} />
                        </div> 
                        <RemarkIcon
                          checklistItems={syllabus.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_requirements"
                          )}
                          previousChecklistItems={syllabus.previous_version?.review_form?.checklist_items.filter(
                            (item) => item.item.syllabus_section === "course_requirements"
                          )}
                          showPrevRevisions={showPrev}
                        /> 
                        {isCommentMode && (
                          <SyllabusCommentComponent
                            syllabusId={syllabus.id!}
                            section="course_outlines"
                            direction="left" 
                          />
                        )}
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