import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TextInput, Button } from "flowbite-react";
import { BiEdit } from "react-icons/bi";
import Cropper from "react-easy-crop";
import { AuthContext } from "../context/AuthContext";
import { FaChevronLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import api from "../api";

export default function EditProfilePage() {
  const activeRole = localStorage.getItem("activeRole");
  const { user } = useContext(AuthContext)!;
  const navigate = useNavigate();

  // form state
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [prefix, setPrefix] = useState(user?.prefix || "");
  const [suffix, setSuffix] = useState(user?.suffix || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  // profile image
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // signature handling
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);


  // Password change handler
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordSuccess(null);
      return;
    }
    if (!newPassword) {
      setPasswordError("Password cannot be empty.");
      setPasswordSuccess(null);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await api.post(
        "/password/change/",
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show success banner
      setPasswordSuccess(res.data.message || "Password updated successfully!");
      setPasswordError(null);
      setNewPassword("");
      setConfirmPassword("");

      // Auto-close modal after 1.5 seconds
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordModal(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setPasswordError(err.response?.data?.error || "Failed to change password.");
      setPasswordSuccess(null);
    }
  };

  // cleanup preview URLs
  useEffect(() => {
    return () => {
      if (croppedImage) URL.revokeObjectURL(croppedImage);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [croppedImage, previewUrl]);

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePreview(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSignatureFile(file);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));

      setCroppedImage(null);
      setShowModal(true);
    }
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImage = async () => {
    if (!signatureFile || !croppedAreaPixels) return null;
    const image = new Image();
    image.src = previewUrl!;
    return new Promise<File>((resolve) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], signatureFile.name, {
              type: "image/png",
            });
            const url = URL.createObjectURL(croppedFile);
            setCroppedImage(url);
            setSignatureFile(croppedFile);
            resolve(croppedFile);
            setShowModal(false);
          }
        }, "image/png");
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    if (prefix) formData.append("prefix", prefix);
    if (suffix) formData.append("suffix", suffix);
    if (phone) formData.append("phone", phone);
    if (signatureFile) formData.append("signature", signatureFile);
    if (signatureFile) formData.append("signature_file", signatureFile);

    try {
      const res = await api.put(`/profile/${user.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedUser = res.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      Object.assign(user, updatedUser);
      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className="flex flex-1 flex-col relative">
      <ToastContainer autoClose={3000} position="top-right" />

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-3 left-6 z-30 flex gap-2 items-center p-2 rounded-full 
        text-white hover:text-gray-600 transition"
      >
        <FaChevronLeft size={20} />
        Back
      </button>

      <section className="w-full max-w-6xl mx-auto pt-14 pb-10 px-4">

        {/* Main Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-400 p-6">
            <h2 className="text-white text-2xl font-semibold">Edit Profile</h2>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* LEFT — Profile Picture */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-40 h-40 mb-3">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    className="w-full h-full object-cover rounded-full border-4 border-blue-500 shadow"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-200 text-white text-5xl rounded-full border-4 border-blue-500 font-bold">
                    {firstName[0]?.toUpperCase()}
                    {lastName[0]?.toUpperCase()}
                  </div>
                )}

                {/* <label
                  htmlFor="profile_image"
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow"
                >
                  <BiEdit size={20} />
                </label> */}
              </div>

              {/* <input
                type="file"
                id="profile_image"
                accept="image/*"
                className="hidden"
                onChange={handleProfileUpload}
              />

              <p className="text-sm text-gray-500">
                Upload a new profile picture
              </p> */}
            </div>

            {/* CENTER — Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-semibold">First Name</label>
                  <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>

                <div>
                  <label className="font-semibold">Last Name</label>
                  <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-semibold">Prefix</label>
                  <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold">Suffix</label>
                  <TextInput value={suffix} onChange={(e) => setSuffix(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-semibold">Phone</label>
                  <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold">Email</label>
                  <TextInput type="email" value={email} readOnly disabled className="opacity-70" />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" color="blue" className="px-8">
                  Save Changes
                </Button>

                <Button
                  color="blue"
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>
              </div>
            </form>

          </div>

          {/* Signature Section */}
          <div className="px-8 pb-8 mt-4">
            <h3 className="font-semibold mb-2">Signature</h3>

            <div className="flex items-center gap-6">
              <div className="border rounded w-[300px] h-[130px] flex items-center justify-center bg-gray-100">
                {croppedImage || user?.signature ? (
                  <img
                    src={croppedImage || user?.signature}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No signature uploaded</span>
                )}
              </div>

              <div>
                <label
                  htmlFor="signature_image"
                  className="inline-block cursor-pointer px-5 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700"
                >
                  Upload Signature
                </label>
                <input
                  type="file"
                  id="signature_image"
                  className="hidden"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CROPPER MODAL — unchanged */}
      {showModal && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 shadow-xl w-[500px] relative">
            <h3 className="text-lg font-semibold">Crop Signature</h3>

            <div className="relative w-full h-72 mt-3 bg-gray-100 rounded">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={2 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-1 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={getCroppedImage} className="px-4 py-1 bg-blue-600 text-white rounded">
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] relative">
            <h3 className="text-lg font-semibold mb-4 text-center">Change Password</h3>

            {/* Banner */}
            {passwordSuccess && (
              <div className="mb-4 px-4 py-2 bg-green-100 border border-green-400 text-green-700 rounded">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <TextInput
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="relative">
                <TextInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
