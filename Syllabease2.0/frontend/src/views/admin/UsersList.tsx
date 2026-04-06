import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Label,
  TextInput,
  Drawer, 
  Spinner,
  Badge,
  Select,
} from "flowbite-react";
import {
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  ArrowRightIcon,
  PlusIcon,
  XMarkIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { LiaUsersSolid } from "react-icons/lia"; 
import { IoIosCheckmarkCircleOutline, IoMdCloseCircleOutline } from "react-icons/io";  
import { toast, ToastContainer } from "react-toastify"; 
import Tooltip from "../../components/ToolTip";
import api from "../../api";
import { EyeIcon } from "lucide-react";

type Role = { id: number; name: string };
type User = {
  id: number;
  faculty_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  prefix?: string;
  suffix?: string;
  phone?: string;
  user_roles: { role: Role }[];
  department_id?: number | null;
  college_id?: number | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRolesDrawerOpen, setIsRolesDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleEditingUser, setRoleEditingUser] = useState<User | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const [formData, setFormData] = useState({
    faculty_id: "",
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    prefix: "",
    suffix: "",
    phone: "",
  });

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
    
  // User Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterActive, setFilterActive] = useState("All"); 
  const [sortField, setSortField] = useState<string>(""); // e.g., "first_name"
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // --- pagination state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 
  const [totalResults, setTotalResults] = useState(0);
  const perPage = 10; // ✅ match your backend default

  useEffect(() => {
    let mounted = true;  
    const loadData = async () => {
      try {
        setLoading(true);

        const params: Record<string, any> = { 
          page: currentPage,
          page_size: perPage,
        };

        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (filterRole !== "All") params.role = filterRole;
        if (filterActive === "Active") params.active = "true";
        if (filterActive === "Inactive") params.active = "false";  
        if (filterActive === "All") params.active = "all";  

        // Add sorting params
        if (sortField) {
          params.sort = sortField;
          params.order = sortOrder;
        }
          
        const [userRes, roleRes] = await Promise.all([
          api.get(`/users/`, { params }),
          api.get(`/roles/`),
        ]); 

        if (!mounted) return;

        const data = userRes.data;

        setUsers(data.results || []); // ✅ paginated items
        setTotalPages(data.total_pages || 1); 
        setTotalResults(data.total_results || 0); 
        setRoles(roleRes.data); 

      } catch (err: any) {
        console.error("Failed to load Users or Roles", err); 
        toast.error("Failed to load Users or Roles")
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [
    currentPage,
    searchTerm,
    filterRole,
    filterActive,
    sortField,
    sortOrder
  ]);

  const fullName = (u: User) =>
    `${u.prefix ?? ""} ${u.first_name} ${u.last_name} ${u.suffix ?? ""}`.trim();

  const formatRole = (r: string) =>
    r
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const validateForm = () => {
    const errors: Record<string, string> = {};
 
    if (!formData.first_name.trim()) errors.first_name = "First name is required.";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required.";   
    if (!formData.phone) errors.phone = "Phone is required."; 
    if (!formData.email) errors.email = "Email is required.";
    if (!formData.faculty_id) errors.faculty_id = "Faculty ID is required.";
    if (!formData.username) errors.username = "Username is required.";
    if (!formData.password && !editMode) errors.password = "Password is required.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (user?: User) => {
    setFormErrors({});
    if (user) {
      setEditMode(true)
      setEditingUser(user);
      setFormData({
        faculty_id: user.faculty_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password: "",
        prefix: user.prefix || "",
        suffix: user.suffix || "",
        phone: user.phone || "",
      });
    } else { 
      setEditMode(false)
      setEditingUser(null);
      setFormData({
        faculty_id: "",
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        prefix: "",
        suffix: "",
        phone: "",
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; 

    const payload = { ...formData };
    try {
      if (editingUser && editMode) {
        const res = await api.patch(`/users/${editingUser.id}/`, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? res.data : u))
        );
        toast.success("User updated successfully!");
      } else {
        const res = await api.post("/users/", payload);
        setUsers((prev) => [...prev, res.data]);
        toast.success("User created successfully!");
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create User", err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          Object.entries(data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(`${msg}`));
            } else {
              toast.error(`${messages}`);
            }
          });
        } else {
          toast.error(data);
        }
      } else {
        toast.error("Failed to create User.");
      }
    }
  };

  const openRolesDrawer = (user: User) => {
    setRoleEditingUser(user);
    setRoleIds(user.user_roles.map((ur) => ur.role.id));
    setIsRolesDrawerOpen(true);
  };

  const handleAddRole = () => {
    if (!selectedRole) return;
    const roleObj = roles.find((r) => r.name === selectedRole);
    if (!roleObj) return;
    if (roleIds.includes(roleObj.id)) return toast.warning("Role already added.");
    setRoleIds((prev) => [...prev, roleObj.id]);
    setSelectedRole("");
  };

  const handleRemoveRole = (id: number) => {
    setRoleIds((prev) => prev.filter((x) => x !== id));
  };

  const handleSaveRoles = async () => {
    if (!roleEditingUser) return;
    try {
      setSavingRole(true);
      await api.patch(`/users/${roleEditingUser.id}/`, { role_ids: roleIds });

      // Fetch latest roles from backend to avoid duplicates
      const currentRoleIds = roleEditingUser.user_roles.map((ur) => ur.role.id);

      const rolesToAssign = roleIds.filter((id) => !currentRoleIds.includes(id));

      await Promise.all(
        rolesToAssign.map(async (id) => {
          const roleObj = roles.find((r) => r.id === id);
          if (!roleObj) return;

          // Determine entity_id if needed
          let entity_id = null;
          if (roleObj.name === "CHAIRPERSON") {
            entity_id = roleEditingUser.department_id; // set appropriately
          } else if (roleObj.name === "DEAN") {
            entity_id = roleEditingUser.college_id; // set appropriately
          }

          await api.post("/user-roles/assign-role/", {
            user_id: roleEditingUser.id,
            role_name: roleObj.name,
            entity_id: entity_id, 
            start_validity: new Date().toISOString().slice(0, 10),
            end_validity: "2099-12-31",
          });
        })
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === roleEditingUser.id
            ? {
                ...u,
                user_roles: roleIds.map((id) => ({
                  role: {
                    id,
                    name: roles.find((r) => r.id === id)?.name || "",
                  },
                })),
              }
            : u
        )
      );

      setIsRolesDrawerOpen(false);
      toast.success("User's Roles Updated!");
    } catch {
      toast.error("Failed to update roles.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // toggle
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      // change field and reset order
      setSortField(field);
      setSortOrder("asc");
    }

    setCurrentPage(1); // reset pagination when sorting changes
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="bg-white space-y-6 p-6 rounded-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-black">
            Users Management
          </h1>
          <Button color="blue" onClick={() => handleOpenModal()}>
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Create User
          </Button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-nowrap items-center rounded-md justify-between">
          {/* Search */}
          <div className="flex flex-col">
            <Label className="text-xs">Search User</Label>
            <TextInput
              type="text"
              placeholder="Search name, faculty ID, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-64"
            />
          </div>

          <div className="flex justify-between gap-3 items-center">
            {/* Role Filter */}
            <div className="flex flex-col">
              <Label className="text-xs">Filter Roles</Label>
              <Select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-35"
              >
                <option value="All">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {formatRole(r.name)}
                  </option>
                ))}
              </Select>
            </div>
            {/* Active Filter */}
            <div className="flex flex-col">
              <Label className="text-xs">Filter Users</Label>
              <Select
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-35"
              >
                <option value="All">Account Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </Select>
            </div>
          </div>
        </div> 
        
        {/* Users Table */}
        <div className="overflow-visible border rounded-lg bg-white shadow">
          <table className="w-full text-sm text-gray-700 relative">
            <thead className="bg-blue-600 text-white text-left">
              <tr>
                {[
                  { key: "faculty_id", label: "Faculty ID" },
                  { key: "first_name", label: "Full Name" },
                  { key: "email", label: "Email" },
                  { key: null, label: "Phone" },
                  { key: "user_roles__role__name", label: "Roles" },
                ].map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-2 select-none ${
                      col.key
                        ? "cursor-pointer hover:bg-blue-500 transition-colors"
                        : ""
                    }`}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}

                      {/* Sort Icon */}
                      {col.key && sortField === col.key && (
                        <span className="text-xs ml-0.5">
                          {sortOrder === "asc" ? "▲" : "▼"}
                        </span>
                      )}

                      {col.key && sortField !== col.key && (
                        <span className="opacity-40 text-xs">↕</span>
                      )}
                    </div>
                  </th>
                ))}

                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Spinner size="xl" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 italic">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{u.faculty_id}</td>
                    <td className="px-4 py-2 font-medium">{fullName(u)}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.phone || "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.user_roles.length ? (
                          u.user_roles.map((ur, i) => (
                            <Badge
                              key={i}
                              color={
                                ur.role.name.includes("DEAN") ||
                                ur.role.name.includes("CHAIR")
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {formatRole(ur.role.name)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">
                            No roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-2"> 
                      <Tooltip text="Edit User Roles" color="blue" position="bottom">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() => openRolesDrawer(u)}
                          title="Edit User Roles"
                        >
                          <LiaUsersSolid className="w-4 h-4" />
                        </Button>   
                      </Tooltip>

                      <Tooltip text="Edit User Details" color="yellow" position="bottom">
                        <Button
                          size="xs"
                          color="yellow"
                          onClick={() => handleOpenModal(u)}
                          title="Edit User Details"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Button>  
                      </Tooltip>

                      <Tooltip text="Delete item" color="red" position="bottom">
                        <Button
                          size="xs"
                          color="red"
                          onClick={() => handleDelete(u.id)}
                          title="Delete User?"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>  
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div> 

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing{" "}
            {totalResults === 0
              ? "0"
              : `${(currentPage - 1) * perPage + 1} - ${Math.min(
                  currentPage * perPage,
                  totalResults
                )}`}{" "}
            of {totalResults}
          </p>
          
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded-md disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              className="px-3 py-1 border rounded-md disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Create/Edit User Modal  */}
      <Modal dismissible show={isUserModalOpen} size="lg" onClose={() => setIsUserModalOpen(false)}>
        <ModalHeader>{editMode ? "Edit User" : "Create User"}</ModalHeader>

        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-5">
            {/* Username + Email */} 
            <div>
              <Label htmlFor="faculty_id">Faculty ID *</Label>
              <TextInput
                id="faculty_id"
                name="faculty_id"
                placeholder="Enter faculty ID"
                value={formData.faculty_id}
                onChange={handleChange}
                required
              />
              {formErrors.faculty_id && (<p className="text-red-500 text-sm mt-1">{formErrors.faculty_id}</p>)} 
            </div>
            
            <div>
              <Label htmlFor="username">Username *</Label>
              <TextInput
                id="username"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              {formErrors.username && (<p className="text-red-500 text-sm mt-1">{formErrors.username}</p>)} 
            </div> 

            {/* First + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <TextInput
                  id="first_name"
                  name="first_name"
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                {formErrors.first_name && (<p className="text-red-500 text-sm mt-1">{formErrors.first_name}</p>)}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <TextInput
                  id="last_name"
                  name="last_name"
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
                {formErrors.last_name && (<p className="text-red-500 text-sm mt-1">{formErrors.last_name}</p>)}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <TextInput
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!editingUser}
                required
              />
              {formErrors.email && (<p className="text-red-500 text-sm mt-1">{formErrors.email}</p>)}
            </div>

            {/* Prefix + Suffix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <TextInput
                  id="prefix"
                  name="prefix"
                  placeholder="e.g., Dr., Engr."
                  value={formData.prefix}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="suffix">Suffix</Label>
                <TextInput
                  id="suffix"
                  name="suffix"
                  placeholder="e.g., Jr., PhD"
                  value={formData.suffix}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <TextInput
                id="phone"
                name="phone"
                placeholder="e.g., +63 912 345 6789"
                value={formData.phone}
                onChange={handleChange}
              />
              {formErrors.phone && (<p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>)}
            </div>

            {/* Password with toggle */}
            <div className="relative">
              <Label htmlFor="password">Password {editingUser ? "" : "*"}</Label>
              <TextInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={editingUser ? "••••••••" : "Enter password"}
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              {formErrors.password && (<p className="text-red-500 text-sm mt-1">{formErrors.password}</p>)}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" onClick={handleSaveUser}>
            {editMode ? "Update" : "Create"}
          </Button>
          <Button color="alternative" onClick={() => setIsUserModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* 🔹 Role Management Drawer (Enhanced UI) */}
      <Drawer
        open={isRolesDrawerOpen}
        onClose={() => setIsRolesDrawerOpen(false)}
        position="right"
        className="z-9999! w-[30%]!"
      >
        {/* Header */}
        <div className="bg-[#f5f7fa] border-b p-5">
          <h2 className="text-xl font-bold text-gray-800">
            {roleEditingUser
              ? `${roleEditingUser.first_name} ${roleEditingUser.last_name}`
              : "Edit User Roles"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage this user’s access and permissions below.
          </p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar">
          {/* Current Roles */}
          <div> 
            <div className="flex flex-wrap gap-2">
              {roleIds.length > 0 ? (
                roleIds.map((id) => {
                  const roleObj = roles.find((r) => r.id === id);
                  if (!roleObj) return null;
                  const isSpecial =
                    roleObj.name === "DEAN" ||
                    roleObj.name === "CHAIRPERSON" ||
                    roleObj.name === "BAYANIHAN_LEADER";
                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isSpecial
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {formatRole(roleObj.name)}
                      {!isSpecial && (
                        <XMarkIcon
                          className="w-4 h-4 cursor-pointer hover:text-red-600"
                          onClick={() => handleRemoveRole(id)}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No roles assigned yet.
                </p>
              )}
            </div>
          </div>

          {/* General Role Assignment */}
          <div className="border-t-2 pt-5">
            <h3 className="font-semibold text-gray-700 mb-3">
              General Role Assignment
            </h3>

            {/* Add Role Row */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full"
              >
                <option value="">Add role...</option>
                {roles
                  .filter(
                    (r) =>
                      !["DEAN", "CHAIRPERSON", "BAYANIHAN_LEADER"].includes(r.name)
                  )
                  .map((r) => (
                    <option key={r.id} value={r.name}>
                      {formatRole(r.name)}
                    </option>
                  ))}
              </Select>

              <Button color="blue" onClick={handleAddRole}>
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Special Role Management */}
          <div className="border-t-2 pt-2">
            <h3 className="font-semibold text-gray-700 mb-3">
              Special Role Management
            </h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Dean</strong>, <strong>Chairperson</strong>, and{" "}
                <strong>Bayanihan Leader</strong> roles are managed on their dedicated pages.
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  size="xs"
                  color="gray"
                  onClick={() => navigate(`/admin/bayanihan`)}
                >
                  <div className="flex items-center gap-2">
                    Bayanihan Leader <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </Button>

                <Button
                  size="xs"
                  color="gray"
                  onClick={() => navigate(`/admin/department`)}
                >
                  <div className="flex items-center gap-2">
                    Chairpersons <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </Button>

                <Button
                  size="xs"
                  color="gray"
                  onClick={() => navigate(`/admin/college`)}
                >
                  <div className="flex items-center gap-2">
                    Deans <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </Button>
              </div>
              
            </div>
          </div> 
        </div> 

        {/* Save & Cancel Buttons */}
        <div className="flex justify-end gap-3 pt-5 border-t-2">
          <Button color="blue" onClick={handleSaveRoles} disabled={savingRole}>
            <div className="flex items-center gap-2">
              {savingRole && <Spinner size="sm" className="mr-2" />}
              <IoIosCheckmarkCircleOutline className="w-5 h-5" />
              {savingRole ? "Saving..." : "Save"}
            </div>
          </Button>

          <Button color="red" onClick={() => setIsRolesDrawerOpen(false)}>
            <div className="flex items-center gap-2">
              <IoMdCloseCircleOutline className="w-5 h-5" />
              Cancel
            </div>
          </Button>
        </div>
      </Drawer>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}
