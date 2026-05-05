import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";
import http from "../../../../../../../http";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Switch, Typography } from "@mui/material";
import Profileloadingskeleton from "./profileloadingskeleton";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

interface EditprofileProps {
  handleClickEdit: (value: boolean) => void;
  profile: any;
  collegeParams: string | undefined;
  currentUser: any;
  yearLevelParams: string | undefined;
}

interface Department {
  id: number;
  name: string;
  college: College[];
}

interface College {
  id: number;
  name: string;
}

interface Role {
  id: number;
  designation: string;
}

interface Section {
  id: number;
  sectionName: string;
  tblYearLevel: number;
}

interface YearLevel {
  id: number;
  yearLevel: string;
}

interface Organization {
  id: number;
  studentOrgName: string;
}

interface Error {
  message: string;
}

// ─── Safely extract a string from a value that may be a plain string
//     OR an object like { uuid, name, rank } or { id, designation } ─────────
function resolveString(value: any): string {
  if (!value && value !== 0) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      value.designation ??  // Role objects
      value.name ??          // General name objects {uuid, name, rank}
      value.label ??
      value.title ??
      value.display_name ??
      ""
    );
  }
  return String(value);
}

// ─── Safely extract a numeric/string id from an object or primitive ─────────
function resolveId(value: any): any {
  if (!value && value !== 0) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") return value.id ?? value.uuid ?? null;
  return null;
}

// ─── Shared sx for MUI Autocomplete to match CITC style ───────────────────
const autocompleteSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    height: "48px",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#FAB417" },
    "&.Mui-focused fieldset": { borderColor: "#FAB417", borderWidth: "1.5px" },
    "& .MuiInputBase-input": { height: "auto", padding: "12px 14px", fontSize: "15px", color: "#1a2340" },
  },
};

export default function Editprofile({
  handleClickEdit,
  profile,
  collegeParams,
  currentUser,
  yearLevelParams,
}: EditprofileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const token = Cookies.get("auth_token");
  const [colleges, setColleges] = useState<College[]>([]);
  const [roles, setRole] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionName, setSectionName] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState<string[]>([]);
  const [yearLevel, setYearLevel] = useState<YearLevel[]>([]);

  const [selectedCollegeName, setSelectedCollegeName] = useState<string>(
    resolveString(collegeParams)
  );
  // ✅ FIX: profile.role may be {uuid, name, rank} — use resolveString to get
  //         the display label; prefer .designation then .name
  const [selectedRoleName, setSelectedRoleName] = useState<string>(
    resolveString(profile.role?.designation ?? profile.role)
  );
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>(
    resolveString(profile.department?.name)
  );
  const [selectedSectionName, setSelectedSectionName] = useState<string>(
    resolveString(profile.section?.sectionName)
  );
  const [selectedYearLevelName, setSelectedYearLevelName] = useState<string>(
    resolveString(yearLevelParams)
  );
  const [selectedOrgName, setSelectedOrgName] = useState<string>(
    resolveString(profile.organization?.studentOrgName)
  );

  const [editProfileInfo, setEditProfileInfo] = useState({
    email: profile.email ?? "",
    username: profile.username ?? "",
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    middle_name: profile.middle_name ?? "",
    idNumber: profile.idNumber ?? "",
    // ✅ FIX: resolve IDs — profile.role may be an object, extract its id
    role: resolveId(profile.role) ?? null,
    // ✅ FIX: profile.department?.college may be an object, extract its id
    college: resolveId(profile.department?.college) ?? null,
    department: resolveId(profile.department) ?? null,
    yearLevel: resolveId(profile.section?.tblYearLevel) ?? null,
    section: resolveId(profile.section) ?? null,
    organization: resolveId(profile.organization) ?? null,
    image: profile.image ?? null,
    is_active: profile.is_active ?? false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    http.get("unieventify/userroles/")
      .then((response) => {
        setRole(response.data);
        setRoleName(response.data.map((role: any) => resolveString(role.designation ?? role.name)));
      })
      .catch((error) => console.log(error));

    http.get("unieventify/colleges/")
      .then((response) => setColleges(response.data))
      .catch((error) => console.log(error));

    http.get("unieventify/departments/")
      .then((response) => {
        setDepartments(response.data);
        setDepartmentName(
          response.data
            .filter((d: any) => d && (d.name || d.label))
            .map((d: any) => resolveString(d.name))
        );
      })
      .catch((error) => console.log(error));

    http.get("unieventify/sections/")
      .then((response) => {
        setSections(response.data);
        setSectionName(response.data.map((s: any) => resolveString(s.sectionName)));
      })
      .catch((error) => console.log(error));

    http.get("unieventify/studentorgs/")
      .then((response) => {
        setOrganizations(response.data);
        setOrganizationName(response.data.map((org: any) => resolveString(org.studentOrgName)));
      })
      .catch((error) => console.log(error));

    http.get("unieventify/yearlevel/")
      .then((response) => setYearLevel(response.data))
      .catch((error) => console.log(error));
  }, []);

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Alert severity="error">Error fetching profile: {error.message}</Alert>
      </Box>
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleRoleChange = (value: any) => {
    const strValue = resolveString(value);
    setSelectedRoleName(strValue);
    const role = roles.find(
      (r) => resolveString(r.designation) === strValue || resolveString((r as any).name) === strValue
    );
    if (role) setEditProfileInfo({ ...editProfileInfo, role: role.id });
  };

  const handleDepartmentsChange = (value: any) => {
    const strValue = resolveString(value);
    setSelectedDepartmentName(strValue);
    const department = departments.find((d) => resolveString(d.name) === strValue);
    if (department) {
      setEditProfileInfo({
        ...editProfileInfo,
        department: department.id,
        // ✅ FIX: department.college may be an object — resolve its id
        college: resolveId(department.college) ?? null,
      });
      const college = colleges.find((c: any) => c.id === resolveId(department.college));
      setSelectedCollegeName(resolveString(college?.name));
    }
  };

  const handleSectionsChange = (value: any) => {
    const strValue = resolveString(value);
    setSelectedSectionName(strValue);
    const section = sections.find((s) => resolveString(s.sectionName) === strValue);
    if (section) {
      setEditProfileInfo({
        ...editProfileInfo,
        section: section.id,
        yearLevel: resolveId(section.tblYearLevel) ?? null,
      });
      const yl = yearLevel.find((y) => y.id === resolveId(section.tblYearLevel));
      setSelectedYearLevelName(resolveString(yl?.yearLevel));
    }
  };

  const handleOrganizationsChange = (value: string) => {
    const strValue = resolveString(value);
    setSelectedOrgName(strValue);
    const org = organizations.find((o) => resolveString(o.studentOrgName) === strValue);
    if (org) setEditProfileInfo({ ...editProfileInfo, organization: org.id });
  };

  const handleActiveChange = (event: any) => {
    setEditProfileInfo({ ...editProfileInfo, is_active: event.target.checked });
  };

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setEditProfileInfo({ ...editProfileInfo, image: URL.createObjectURL(file) });
    } else {
      setSelectedFile(null);
      setEditProfileInfo({ ...editProfileInfo, image: profile.image });
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsDisabled(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("email", editProfileInfo.email);
    formData.append("username", editProfileInfo.username);
    formData.append("first_name", editProfileInfo.first_name);
    formData.append("last_name", editProfileInfo.last_name);
    formData.append("middle_name", editProfileInfo.middle_name);
    formData.append("is_active", String(editProfileInfo.is_active));
    if (editProfileInfo.idNumber) formData.append("idNumber", editProfileInfo.idNumber);
    if (editProfileInfo.role) formData.append("role", String(editProfileInfo.role));
    if (editProfileInfo.department) formData.append("department", String(editProfileInfo.department));
    if (editProfileInfo.section) formData.append("section", String(editProfileInfo.section));
    if (editProfileInfo.organization) formData.append("organization", String(editProfileInfo.organization));
    if (selectedFile) formData.append("image", selectedFile);

    http.patch(`auth/update_profile/`, formData, {
      headers: { Authorization: `Token ${token}`, "Content-Type": "multipart/form-data" },
    })
      .then(() => { setIsDisabled(false); setLoading(false); handleClickEdit(false); })
      .catch((error) => { console.log(error.response.data); setIsDisabled(false); setLoading(false); });
  };

  // ─── Initials helper ──────────────────────────────────────────────────────
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  // ─── Reusable sub-components ──────────────────────────────────────────────
  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{
      fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.07em", marginBottom: "6px", display: "block",
    }}>
      {children}
    </label>
  );

  const StyledInput = ({ id, placeholder, value, onChange }: any) => (
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      disabled={isDisabled}
      onChange={onChange}
      style={{
        width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: "6px",
        padding: "12px 14px", fontSize: "15px", color: "#1a2340", outline: "none",
        backgroundColor: isDisabled ? "#f3f4f6" : "#fff", transition: "border-color 0.2s",
        height: "48px",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#FAB417")}
      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
    />
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      fontSize: "11px", fontWeight: 700, color: "#FAB417", textTransform: "uppercase",
      letterSpacing: "0.1em", marginBottom: "20px", paddingBottom: "10px",
      borderBottom: "1.5px solid #FAB417",
    }}>
      {children}
    </div>
  );

  const ReadonlyField = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 14px", fontSize: "15px",
      color: "#9ca3af", backgroundColor: "#f9fafb", height: "48px", display: "flex", alignItems: "center",
    }}>
      {/* ✅ FIX: ensure children is always a string before rendering */}
      {typeof children === "object" ? resolveString(children) : children}
    </div>
  );

  // ✅ FIX: resolve role designation safely for the conditional check below
  const profileRoleDesignation = resolveString(profile.role?.designation ?? profile.role);

  return (
    <Box>
      {profile ? (
        <div style={{ display: "flex", gap: "20px", fontFamily: "'Segoe UI', sans-serif", alignItems: "flex-start" }}>

          {/* ── Left Panel ── */}
          <div style={{
            width: "315px", flexShrink: 0, display: "flex", flexDirection: "column",
            alignItems: "center", padding: "28px 20px", backgroundColor: "#fff",
            border: "1px solid #e5e7eb", borderRadius: "12px", gap: "10px",
          }}>

            {/* Avatar */}
            <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "3px solid #FAB417", padding: "3px", flexShrink: 0 }}>
              {editProfileInfo.image ? (
                <img
                  src={editProfileInfo.image}
                  alt={profile.username}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", borderRadius: "50%", backgroundColor: "#4a90d9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "26px", fontWeight: 700, color: "#fff",
                }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{ fontWeight: 700, fontSize: "17px", color: "#1a2340", textAlign: "center", lineHeight: 1.3, marginTop: "6px" }}>
              {profile.first_name} {profile.last_name}
            </div>

            {/* Email */}
            <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", wordBreak: "break-all", marginBottom: "6px" }}>
              {profile.email}
            </div>

            {/* Upload */}
            <div style={{ width: "100%", marginTop: "6px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Profile Photo
              </div>
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backgroundColor: "#1a2340", color: "#fff", borderRadius: "8px", padding: "11px 14px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", width: "100%", boxSizing: "border-box",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAB417" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Photo
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
              <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "5px" }}>
                JPG, PNG up to 5MB
              </div>
            </div>

            {/* Dept / College */}
            <div style={{ textAlign: "center", marginTop: "8px", lineHeight: 1.7 }}>
              <div style={{ color: "#1a2340", fontWeight: 700, fontSize: "14px" }}>
                {selectedDepartmentName || resolveString(profile.department?.name) || "No Department"}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {selectedCollegeName || resolveString(collegeParams) || "No College"}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ width: "100%", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                style={{
                  width: "100%", backgroundColor: isDisabled ? "#d1d5db" : "#FAB417",
                  border: "none", borderRadius: "24px", padding: "12px", fontSize: "15px",
                  fontWeight: 700, color: "#1a2340", cursor: isDisabled ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Saving...
                  </>
                ) : "Save Changes"}
              </button>
              <button
                onClick={() => handleClickEdit(false)}
                style={{
                  width: "100%", backgroundColor: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: "24px", padding: "12px", fontSize: "15px", color: "#6b7280",
                  cursor: "pointer", fontWeight: 500,
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{
            flex: 1, padding: "28px 36px 32px", backgroundColor: "#fff",
            border: "1px solid #e5e7eb", borderRadius: "12px",
          }}>

            <SectionTitle>Personal Information</SectionTitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <FieldLabel>First Name</FieldLabel>
                <StyledInput
                  id="first_name"
                  placeholder="First Name"
                  value={editProfileInfo.first_name}
                  onChange={(e: any) => setEditProfileInfo({ ...editProfileInfo, first_name: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <StyledInput
                  id="last_name"
                  placeholder="Last Name"
                  value={editProfileInfo.last_name}
                  onChange={(e: any) => setEditProfileInfo({ ...editProfileInfo, last_name: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Middle Name</FieldLabel>
                <StyledInput
                  id="middle_name"
                  placeholder="Middle Name"
                  value={editProfileInfo.middle_name}
                  onChange={(e: any) => setEditProfileInfo({ ...editProfileInfo, middle_name: e.target.value })}
                />
              </div>
              {currentUser?.is_staff && (
                <div>
                  <FieldLabel>ID Number</FieldLabel>
                  <StyledInput
                    id="id_number"
                    placeholder="e.g. 2021-12345"
                    value={editProfileInfo.idNumber}
                    onChange={(e: any) => setEditProfileInfo({ ...editProfileInfo, idNumber: e.target.value })}
                  />
                </div>
              )}
            </div>

            <SectionTitle>Account Details</SectionTitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

              {/* Email — readonly */}
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Email Address</FieldLabel>
                <ReadonlyField>{profile.email}</ReadonlyField>
              </div>

              {/* Role — staff only */}
              {currentUser?.is_staff && (
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <Autocomplete
                    disablePortal
                    id="role"
                    options={roleName}
                    disabled={isDisabled}
                    onChange={(_, newValue) => handleRoleChange(newValue)}
                    // ✅ FIX: always a string, never an object
                    value={selectedRoleName || null}
                    sx={autocompleteSx}
                    renderInput={(params) => <TextField {...params} label=" " />}
                  />
                </div>
              )}

              {/* Department */}
              <div>
                <FieldLabel>Department</FieldLabel>
                <Autocomplete
                  disablePortal
                  id="department"
                  options={departmentName}
                  disabled={isDisabled}
                  onChange={(_, newValue) => handleDepartmentsChange(newValue)}
                  // ✅ FIX: always a string, never an object
                  value={selectedDepartmentName || null}
                  sx={autocompleteSx}
                  renderInput={(params) => <TextField {...params} label=" " />}
                />
              </div>

              {/* College — derived, readonly */}
              <div>
                <FieldLabel>College</FieldLabel>
                <ReadonlyField>{selectedCollegeName || "Not Available"}</ReadonlyField>
              </div>

              {/* Section — students only */}
              {/* ✅ FIX: use resolved string for role comparison, not the raw object */}
              {profileRoleDesignation === "Student" && (
                <>
                  <div>
                    <FieldLabel>Section</FieldLabel>
                    <Autocomplete
                      disablePortal
                      id="section"
                      options={sectionName}
                      disabled={isDisabled}
                      onChange={(_, newValue) => handleSectionsChange(newValue)}
                      value={selectedSectionName || null}
                      sx={autocompleteSx}
                      renderInput={(params) => <TextField {...params} label=" " />}
                    />
                  </div>
                  <div>
                    <FieldLabel>Year Level</FieldLabel>
                    <ReadonlyField>{selectedYearLevelName || "Not Available"}</ReadonlyField>
                  </div>
                </>
              )}

              {/* Organization */}
              {profile.organization && (
                <div>
                  <FieldLabel>Organization</FieldLabel>
                  <Autocomplete
                    disablePortal
                    id="organization"
                    options={organizationName}
                    disabled={isDisabled}
                    onChange={(_, newValue) => handleOrganizationsChange(newValue as string)}
                    value={selectedOrgName || null}
                    sx={autocompleteSx}
                    renderInput={(params) => <TextField {...params} label=" " />}
                  />
                </div>
              )}

              {/* Active Status — staff only */}
              {currentUser?.is_staff && (
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "12px", paddingTop: "4px" }}>
                  <FieldLabel>Active Status</FieldLabel>
                  <Switch
                    checked={editProfileInfo.is_active}
                    onChange={handleActiveChange}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#FAB417" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#FAB417" },
                    }}
                    inputProps={{ "aria-label": "active status" }}
                  />
                  <span style={{ fontSize: "13px", color: editProfileInfo.is_active ? "#1a2340" : "#9ca3af" }}>
                    {editProfileInfo.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Profileloadingskeleton />
      )}

      <ToastContainer />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: #FAB417 !important; outline: none; }
      `}</style>
    </Box>
  );
}