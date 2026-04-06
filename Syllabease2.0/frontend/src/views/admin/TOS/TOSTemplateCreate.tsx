import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Label, TextInput } from "flowbite-react";
import { FaChevronLeft } from "react-icons/fa";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../api";

export default function TOSTemplateCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [effectivity, setEffectivity] = useState("");
  const [revisionNo, setRevisionNo] = useState<number>(0);
  const [description, setDescription] = useState(""); 
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null); 
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /** 🧩 Load existing template (Edit mode) */
  useEffect(() => {
    if (id) {
      api
        .get(`/tos-templates/${id}/`)
        .then((res) => {
          const t = res.data;
          setEffectivity(t.effective_date || "");
          setDescription(t.description || "");
          setRevisionNo(t.revision_no ?? 0);
          setHeaderPreview(t.header_image || null);
        })
        .catch(() => {});
    }
  }, [id]);

  /** 📤 Preview header upload */
  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeaderFile(file);

      const reader = new FileReader();
      reader.onload = (ev) => setHeaderPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  /** 💾 Save Template */
  const handleSaveTemplate = async () => {
    const trimmedDesc = description.trim();
    const trimmedEff = effectivity.trim();

    if (!trimmedDesc || !trimmedEff) {
      toast.error("Please fill in Effectivity Date and Description.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("effective_date", trimmedEff);
      formData.append("description", trimmedDesc);
      formData.append("revision_no", String(revisionNo));

      if (headerFile) {
        formData.append("header_image", headerFile);
      } 

      await api.post("/tos-templates/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }); 

      toast.success("TOS Template saved successfully!");
      setShowSaveModal(false);
      setShowConfirm(false);
      
      setTimeout(() => navigate("/admin/tos/tos-template"), 700);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save TOS template.");
    } finally { 
      setShowSaveModal(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center bg-gray-100 min-h-screen">
      <ToastContainer />

      {/* ███ Top Bar */}
      <div className="flex justify-between items-center px-10 py-4 bg-white border-b">
        <button
          onClick={() => navigate("/admin/tos/tos-template")}
          className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-500 transition"
        >
          <FaChevronLeft size={18} />
          <span>Back to Template List</span>
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Save Template
        </button>
      </div>

      {/* ███ Main Card */}
      <main className="flex flex-1 justify-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-gray-200 p-10">

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">
            {id ? "Edit TOS Template" : "Create TOS Template"}
          </h1>

          {/* ░░ Group: Template Details */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Template Details
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Effective Date */}
            <div>
              <Label htmlFor="effectivity" className="font-medium text-gray-700">
                Effectivite Date
              </Label>
              <TextInput
                id="effectivity"
                type="date"
                className="mt-2"
                value={effectivity}
                onChange={(e) => setEffectivity(e.target.value)}
              />
            </div>

            {/* Revision Number */}
            <div>
              <Label htmlFor="revision_no" className="font-medium text-gray-700">
                Revision Number (Rev. No.)
              </Label>
              <TextInput
                id="revision_no"
                type="number"
                min={0}
                className="mt-2"
                value={revisionNo}
                onChange={(e) => setRevisionNo(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* ░░ Group: Header Upload */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Header Image
          </h2>

          <div className="mb-14">
            <div className="border border-gray-300 rounded-lg w-full h-[140px] flex items-center justify-center bg-gray-50 overflow-hidden shadow-sm">
              {headerPreview ? (
                <img
                  src={headerPreview}
                  alt="Header Preview"
                  className="object-contain max-w-full max-h-full"
                />
              ) : (
                <span className="text-sm text-gray-400">
                  No image selected
                </span>
              )}
            </div>

            <label
              htmlFor="header_image"
              className="mt-3 inline-block cursor-pointer px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
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

      {/* ███ Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-xs"
            onClick={() => setShowSaveModal(false)}
          ></div>

          <div
            className="bg-white rounded-xl shadow-xl p-6 z-50 w-[440px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Save Template
            </h2>

            <Label className="block mb-2 font-medium text-gray-700">
              Description
            </Label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter description..."
              rows={4}
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirm(true)}
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
