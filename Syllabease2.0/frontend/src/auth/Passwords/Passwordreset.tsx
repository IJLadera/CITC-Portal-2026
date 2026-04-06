import { useState } from "react";
import { Link } from "react-router-dom";
import { HiMail } from "react-icons/hi";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch("https://sea-lion-app-9h2ja.ondigitalocean.app/api/password-reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("✅ Password reset link has been sent to your email.");
        setEmail("");
      } else {
        const data = await res.json();
        setError(data.detail || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex flex-wrap lg:h-screen lg:items-center bg-white">
      {/* Left Side - Form */}
      <div className="w-full flex items-center justify-center min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2 lg:px-8 lg:py-24">
        <div
          className="
            bg-white 
            bg-opacity-90 
            shadow-[0_4px_20px_rgba(0,0,0,0.08)] 
            rounded-2xl 
            lg:rounded-l-2xl lg:rounded-r-none
            backdrop-blur-md
            p-8 sm:p-10 max-w-md w-full
            transition-all
          "
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link to="/login">
              <img
                src="/assets/Sample/syllabease.png"
                alt="SyllabEase Logo"
                className="mx-auto w-60"
              />
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2 text-left">
            Forgot Password
          </h1>
          <p className="text-gray-500 text-sm text-left mb-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#F4A100] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  className="w-full rounded-lg border border-gray-200 p-3 pr-12 text-sm shadow-sm focus:border-[#F4A100] focus:ring-[#F4A100] transition-colors duration-200"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <HiMail className="h-5 w-5 text-[#F4A100]" />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white font-semibold p-3 rounded-lg transition-colors duration-200 text-base`}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10l9-6 9 6-9 6-9-6zm0 0v6a9 9 0 009 9 9 9 0 009-9v-6"
                    />
                  </svg>
                  Send Password Reset Link
                </>
              )}
            </button>

            {status && (
              <div className="text-green-600 text-sm text-center mt-2">
                {status}
              </div>
            )}
            {error && (
              <div className="text-red-600 text-sm text-center mt-2">
                {error}
              </div>
            )}
          </form> 
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="bg-blue-600 relative h-64 w-full sm:h-96 lg:h-full lg:w-1/2">
        <img
          alt="Forgot Password Vector"
          src="/assets/forgotpass-vector.png"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </section>
  );
};

export default PasswordReset;
