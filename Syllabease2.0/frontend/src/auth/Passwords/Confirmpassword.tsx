import { useState } from "react";
import { Link } from "react-router-dom";
import { HiEye, HiEyeOff, HiLockClosed } from "react-icons/hi";

const ConfirmPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required.");
      return;
    }
    setError(null);

    // TODO: Hook this into your backend API for confirmation
    console.log("Password confirmed");
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Password
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Please confirm your password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your password"
              />
              {/* Lock Icon */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <HiLockClosed className="h-5 w-5" />
              </span>
              {/* Eye Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Confirm Password
            </button>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Your Password?
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ConfirmPassword;
