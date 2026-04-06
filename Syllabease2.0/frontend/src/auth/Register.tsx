import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    prefix: "",
    suffix: "",
    phone: "", 
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields except prefix/suffix
    for (const [key, value] of Object.entries(form)) {
      if ((key !== "prefix" && key !== "suffix") && !value.trim()) {
        setError(`${key.replace("_", " ")} is required`);
        return;
      }
    }

    try {
      await api.post("/register/", form);
      navigate("/login"); 

    } catch (err) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="bg-white font-sans overflow-hidden">
      <div className="flex h-screen">
        {/* Left Panel (Image) */}
        <div className="hidden lg:block w-[60%] relative">
          <img
            src="/assets/reg-img1.png"
            alt="Register"
            className="w-full h-full object-cover"
            style={{ objectPosition: "1% center" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "#FFFFFFFF", opacity: 0.15 }}
          />
        </div>

        {/* Right Panel (Form) */}
        <div className="relative w-full lg:w-[40%] flex items-center justify-center px-6 bg-white overflow-hidden">
          {/* Decorative Blobs */}
          <svg
            className="absolute top-0 right-0 z-0 pointer-events-none"
            width="360"
            height="260"
            viewBox="0 0 360 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ right: "-60px", top: "-40px" }}
          >
            <path
              fill="#3188CFFF"
              d="M360,0 Q330,90 270,120 Q210,150 180,90 Q150,30 90,60 Q30,90 0,0 L360,0Z"
            />
          </svg>

          <div className="relative z-10 w-full max-w-md">
            <div className="text-center mx-auto mb-8">
              <img
                src="/assets/Sample/syllabease.png"
                alt="SyllabEase Logo"
                className="mx-auto w-60"
              /> 
            </div>

            <h1 className="text-xl font-bold text-black mb-4">Create Account</h1>

            {/* Form */}
            <form className="space-y-2" onSubmit={handleSubmit}>
              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>

              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              {/* Prefix + Suffix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prefix</label>
                  <input
                    name="prefix"
                    value={form.prefix}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Suffix</label>
                  <input
                    name="suffix"
                    value={form.suffix}
                    onChange={handleChange}
                    className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input 
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    // Only allow numbers
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, phone: numericValue });
                  }}
                  className="border p-2 w-full rounded focus:ring focus:ring-blue-200"
                  inputMode="numeric"  
                  required
                />
              </div>

              {/* Password with toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Register
              </button>

              <div className="text-center text-sm mt-4">
                Already have an account?{" "}
                <a href="/login" className="text-blue-500 font-semibold hover:underline">
                  Sign In
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
