import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spinner } from "flowbite-react";
import { Editor } from "@tinymce/tinymce-react";
import api from "../../../api";

export default function CRQCreate() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const [content, setContent] = useState<string>("");
  const role = localStorage.getItem("activeRole")?.toUpperCase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);          // Entire page loading
  const [isUpdating, setIsUpdating] = useState(false);
  const [editorReady, setEditorReady] = useState(false); 
 
  useEffect(() => {
    const fetchCourseRequirement = async () => {
      try {
        const res = await api.get(`/syllabi/${syllabusId}/?role=${role}`); 
        setContent(res.data.course_requirements || ""); 
      } catch (error) {
        console.error("Failed to fetch course requirements:", error);
        alert("Failed to load course requirements.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseRequirement();
  }, [syllabusId]);

  const handleEditorChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await api.patch(`/syllabi/${syllabusId}/course-requirements/?role=${role}`, {
        course_requirements: content,
      });
      alert("Course requirements updated successfully!");
      navigate(-1); // or wherever you want to go

    } catch (error) {
      console.error("Error updating course requirements:", error);
      alert("Failed to update course requirements.");
    } finally {
      setIsUpdating(true);
    }
  };

  const pageStillLoading = loading || !editorReady;

  return (
    <div className="my-14 w-full">
      {/* Loading overlay (blocks view until done) */}
      {pageStillLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="xl" color="purple" aria-label="Loading syllabus..." />
            <span className="text-white text-lg font-semibold">Loading Course Requirements Editor...</span>
          </div>
        </div>
      )}

      <div className="m-auto bg-slate-100 p-4 shadow-lg bg-gradient-to-r from-white to-blue-100 rounded-sm w-[80%]">
        {/* Logo */}
        <img
          className="text-center my-4 w-[370px] m-auto"
          src="/assets/Course Requirement.png"
          alt="Create Course Requirement"
        />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="m-2 mx-8 focus:border-2 focus:border-orange-400 rounded-lg">
            <Editor
              apiKey="wl82on1oz75aej915bxcddm5m4vdo4twyatntjw05qxp9zkd"
              value={content}
              init={{ 
                height: 500,
                menubar: true,
                branding: false,
                statusbar: false,
                elementpath: false,
                plugins:
                  "advlist autolink lists link image charmap print preview anchor " +
                  "searchreplace visualblocks code fullscreen insertdatetime media table " +
                  "paste help wordcount codesample emoticons",
                toolbar:
                  "undo redo | formatselect fontselect fontsizeselect | " + // ✅ font family + font size
                  "bold italic underline strikethrough forecolor backcolor | " + // ✅ text styles + colors
                  "outdent indent | " +  
                  "alignleft aligncenter alignright alignjustify | " +
                  "bullist numlist | removeformat | " +
                  "link image table codesample | fullscreen preview code",
                font_formats:
                  "Arial=arial,helvetica,sans-serif;" +
                  "Courier New=courier new,courier,monospace;" +
                  "Georgia=georgia,palatino;" +
                  "Tahoma=tahoma,arial,helvetica,sans-serif;" +
                  "Times New Roman=times new roman,times;" +
                  "Verdana=verdana,geneva;",
                fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt",
              }}
              onEditorChange={handleEditorChange}
              onInit={() => {
                setEditorReady(true); // ← TinyMCE is ready
              }}
            />
          </div> 

          <div className="flex justify-center text-center">
            <Button
              type="submit"
              color="blue"
              disabled={isUpdating}
              className="px-6 font-semibold text-white rounded-lg m-5"
            >
              {isUpdating ? "Updating Course Requirements..." : "Update Course Requirements"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}