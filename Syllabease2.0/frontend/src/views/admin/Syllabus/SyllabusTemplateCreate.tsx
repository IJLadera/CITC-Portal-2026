import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Label, TextInput } from "flowbite-react";
import { FaChevronLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../api";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function SyllabusTemplateCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [effectivity, setEffectivity] = useState("");
  const [revisionNo, setRevisionNo] = useState<number | 0>(0);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /** 🧩 Load existing (for editing) */
  useEffect(() => {
    if (id) {
      api
        .get(`/syllabus-templates/${id}/`)
        .then((res) => {
          const t = res.data;
          setEffectivity(t.effective_date || "");
          setRevisionNo(t.revision_no ?? 0);
          setDescription(t.description || "");
          setHeaderPreview(t.header_image || null);
        })
        .catch(() => {});
    }
  }, [id]);

  /** 📤 Preview image */
  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setHeaderFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setHeaderPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /** 💾 Save or Update template */
  const handleSaveTemplate = async () => {
    const trimmedDesc = description.trim();
    const trimmedEff = effectivity.trim();

    if (!trimmedEff || !trimmedDesc) {
      toast.error("Please fill in Effectivity Date and Description.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("effective_date", trimmedEff);
      formData.append("description", trimmedDesc);
      formData.append("revision_no", revisionNo.toString()); 

      if (headerFile) {
        formData.append("header_image", headerFile);
      } 

      await api.post("/syllabus-templates/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }); 

      toast.success("Syllabus Template saved successfully!");
      setShowSaveModal(false);
      setShowConfirm(false);

      setTimeout(() => navigate("/admin/syllabus/syllabus-template"), 700);
    } catch (error: any) {
      console.error("Error saving syllabus template:", error);
      toast.error("Failed to save syllabus template.");
    } finally { 
      setShowSaveModal(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center bg-gray-50 min-h-screen">
      <ToastContainer />

      {/* 🔹 Top Bar */}
      <div className="flex justify-between items-center px-10 py-4">
        <button
          onClick={() => navigate("/admin/syllabus/syllabus-template")}
          className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-500 transition-colors"
        >
          <FaChevronLeft size={18} />
          <span>Back to Template List</span>
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Template
        </button>
      </div>

      {/* 🔹 Main Content Card */}
      <main className="flex flex-1 justify-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">
            {id ? "Edit Syllabus Template" : "Create Syllabus Template"}
          </h1>

          {/* Effectivity + Revision + Header */}
          <div className="grid md:grid-cols-2 gap-10 mb-12">

            {/* LEFT COLUMN */}
            <div className="space-y-6">
              <div>
                <Label className="text-gray-700 font-medium">Effectivity Date</Label>
                <TextInput
                  type="date"
                  className="mt-3"
                  value={effectivity}
                  onChange={(e) => setEffectivity(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Revision No.</Label>
                <TextInput
                  type="number"
                  min={0}
                  className="mt-3"
                  value={revisionNo}
                  onChange={(e) => setRevisionNo(Number(e.target.value))}
                />
              </div>
            </div>

            {/* RIGHT COLUMN — HEADER IMAGE */}
            <div>
              <Label className="text-gray-700 font-medium mb-2">Header Image</Label>

              <div className="border border-gray-300 rounded-lg w-full h-[130px] flex items-center justify-center bg-gray-50 overflow-hidden">
                {headerPreview ? (
                  <img src={headerPreview} alt="Header Preview" className="object-contain max-w-full max-h-full" />
                ) : (
                  <span className="text-sm text-gray-400">No image selected</span>
                )}
              </div>

              <label
                htmlFor="header_image"
                className="mt-3 inline-block cursor-pointer px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              >
                {headerFile ? "Replace Image" : "Upload Header"}
              </label>

              <input
                id="header_image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeaderUpload}
              />
            </div>
          </div>
        </div>
      </main>
      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Create TOS Template?"
        message="Once created, you might not be able to delete it anymore."
        confirmText="Yes, Create"
        doubleConfirm={true}
        onConfirm={handleSaveTemplate}
        onClose={() => setShowConfirm(false)}
      />

      {/* 🔹 Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          ></div>

          <div className="bg-white rounded-xl shadow-lg p-6 z-50 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Save Template</h2>

            <Label className="block mb-2 font-medium text-gray-700">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter description..."
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
