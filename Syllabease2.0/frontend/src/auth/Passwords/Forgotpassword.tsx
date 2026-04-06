import { useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";

// ✅ ConfirmPasswordModal Component
function ConfirmPasswordModal({
  isOpen,
  onClose,
  uid,
  token,
  newPassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  uid: string | null;
  token: string | null;
  newPassword: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid || !token) {
      setError("Invalid request.");
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess("");

    try {
      const res = await fetch(`https://sea-lion-app-9h2ja.ondigitalocean.app/api/password-reset/confirm/${uid}/${token}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Password confirmed successfully!");
        setTimeout(() => {
          onClose();
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Confirm Password
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Please confirm your password reset before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-500">{success}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ Main ForgotPassword Component
export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: "",
    passwordConfirm: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Extract uid and token from URL
  const queryParams = new URLSearchParams(location.search);
  const uid = queryParams.get("uid");
  const token = queryParams.get("token");

  useEffect(() => {
    if (!uid || !token) {
      setTokenValid(false);
      setError("Invalid password reset link.");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`https://sea-lion-app-9h2ja.ondigitalocean.app/api/password/validate/?uid=${uid}&token=${token}`);
        if (!res.ok) throw new Error();
        setTokenValid(true);
      } catch {
        setTokenValid(false);
        setError("This password reset link has expired or is invalid. Please request a new one.");
      }
    };

    validateToken();
  }, [uid, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    // ✅ Instead of calling API, open confirmation modal
    setShowModal(true);
  };

  return (
    <div className="bg-white font-sans overflow-hidden">
      <div className="flex h-screen">
        {/* Left Image Panel */}
        <div className="hidden lg:block w-[60%] relative">
          <img
            src="/assets/reg-img1.png"
            alt="Reset Password Illustration"
            className="w-full h-full object-cover"
            style={{ objectPosition: "1% center" }}
          />
          <div className="absolute inset-0 bg-white opacity-15" />
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-[40%] flex items-center justify-center px-6 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img
                src="/assets/Sample/syllabease.png"
                alt="SyllabEase Logo"
                className="mx-auto w-60"
              />
            </div>

            <h1 className="text-xl font-bold text-black mb-4 text-center">
              Reset Password
            </h1>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            {tokenValid === null ? (
              <div className="text-gray-500 text-center">Checking link...</div>
            ) : tokenValid === false ? (
              <div className="text-gray-500 text-center">
                Invalid or expired link.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={form.passwordConfirm}
                      onChange={handleChange}
                      className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showPasswordConfirm ? (
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full text-white px-4 py-2 rounded transition bg-blue-500 hover:bg-blue-600"
                >
                  Reset Password
                </button>

                <div className="text-center text-sm mt-4">
                  <a
                    href="/login"
                    className="text-blue-500 font-semibold hover:underline cursor-pointer"
                  >
                    Go Back
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Confirm Password Modal */}
      <ConfirmPasswordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        uid={uid}
        token={token}
        newPassword={form.password}
      />
    </div>
  );
}
