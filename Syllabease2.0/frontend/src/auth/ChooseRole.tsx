import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  GraduationCap,
  Briefcase,
  Users,
  Presentation, // ✅ instead of Chalkboard
  UserCheck,
  Key,
  BookOpen, // alternative teacher icon
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

export default function ChooseRole() {
  const navigate = useNavigate(); 
  const { user } = useContext(AuthContext)!;
  const roles = user?.user_roles || [];

  useEffect(() => {
    if (roles.length === 1) {
      const singleRole = roles[0];
      handleChoose(singleRole.role.name.toLowerCase());
    }
  }, [roles]);

  const formatRole = (role: string) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleChoose = (roleName: string) => {
    localStorage.setItem("activeRole", roleName);
    navigate(`/${roleName.toLowerCase()}`);
  };

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="w-5 h-5" />,
    dean: <GraduationCap className="w-5 h-5" />,
    chairperson: <Briefcase className="w-5 h-5" />,
    bayanihan_leader: <Users className="w-5 h-5" />,
    bayanihan_teacher: <BookOpen className="w-5 h-5" />,  
    auditor: <UserCheck className="w-5 h-5" />,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: "url('/assets/ustp_pic.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-[#F8BD0C]/20 pointer-events-none"></div>

      <div className="relative bg-[#faf6e8] rounded-2xl p-8 max-w-lg mx-auto shadow-lg text-center z-10">
        <img
          src="/assets/Sample/syllabease.png"
          alt="SyllabEase"
          className="mx-auto mb-6 w-60"
        />

        <h1 className="text-lg font-semibold text-gray-800 mb-6">
          Choose Your Role
        </h1>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {roles.map((ur: any) => {
            const roleName = ur.role.name.toLowerCase();
            return (
              <button
                key={ur.id}
                onClick={() => handleChoose(roleName)}
                className="flex items-center justify-start gap-3 bg-[#d7ecf9] rounded-xl px-4 py-3 text-[#1a3557] font-medium shadow-sm hover:bg-[#c3dff3] transition w-full"
              >
                <span className="text-xl">
                  {roleIcons[roleName] ?? <Key className="w-5 h-5" />}
                </span>
                {formatRole(roleName)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
