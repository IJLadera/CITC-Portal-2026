import React, { useState, useEffect } from "react";
import { Alert, Button } from "flowbite-react";

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      setSuccessMessage(null);
      return;
    }

    setSuccessMessage("Password changed successfully!");
    setErrorMessage(null);
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div
      className="min-h-screen flex items-center justify-center -mt-[120px]"
      style={{
        backgroundImage: "url('/assets/wave1.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top",
        backgroundAttachment: "fixed",
        backgroundSize: "contain",
      }}
    >
      <div className="max-w-md bg-gradient-to-r from-white to-blue-100 w-[560px] p-6 px-8 rounded-lg shadow-lg">
        <img
          className="w-[300px] m-auto mb-6 mt-4"
          src="/assets/Change Password.png"
          alt="Change Password"
        />

        {/* ✅ Center the form and its contents */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="mb-4">
            <label htmlFor="current_password" className="block mb-1 text-left w-[300px]">
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-2 py-[6px] w-[300px] border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="new_password" className="block mb-1 text-left w-[300px]">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-2 py-[6px] w-[300px] border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirm_password" className="block mb-1 text-left w-[300px]">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-2 py-[6px] w-[300px] border border-gray-300 rounded"
            />
          </div>

          {/* ✅ Button now perfectly centered */}
          <div className="flex justify-center w-full">
            <Button
              type="submit"
              className="text-white font-semibold px-6 py-2 rounded-lg m-2 mt-8 mb-4 bg-blue-600 hover:bg-blue-700"
            >
              Change Password
            </Button>
          </div>
        </form>

        {(successMessage || errorMessage) && (
          <div className="fixed bottom-0 left-0 w-2/6 shadow-2xl m-3">
            {successMessage && (
              <Alert color="success">
                <span className="font-bold">Success!</span> {successMessage}
              </Alert>
            )}
            {errorMessage && (
              <Alert color="failure">
                <span className="font-bold">Error:</span> {errorMessage}
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
