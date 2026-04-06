import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Container,
    Grid,
    Typography,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    Pagination,
} from "@mui/material";
import { useAppSelector } from "../../../../hooks";
import http from "../../../../http";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

interface User {
    uuid: string;
    id_number: string;
    email: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    is_staff: boolean;
    is_student: boolean;
    is_employee: boolean;
    is_active: boolean;
    department?: { id: number; name: string };
    section?: { id: number; name: string };
    organization?: { id: number; name: string };
}

interface FormData {
    email: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    id_number: string;
    password: string;
    is_staff: boolean;
    is_student: boolean;
    is_employee: boolean;
    is_active: boolean;
    department?: string;
    roles?: string[];
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [formData, setFormData] = useState<FormData>({
        email: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        suffix: "",
        id_number: "",
        password: "",
        is_staff: false,
        is_student: false,
        is_employee: false,
        is_active: true,
        roles: [],
    });

    const token = useAppSelector((state: any) => state.auth.token);
    const navigate = useNavigate();

    // Check if user is admin
    const checkAdminAccess = async () => {
        try {
            const response = await http.get("auth/users/me/", {
                headers: { Authorization: `Token ${token}` },
            });
            const userRoles = response.data.roles || [];
            const isAdminUser = userRoles.some((role: any) => role.name === "Admin" || role.name === "Chairman");
            
            if (!isAdminUser) {
                toast.error("You do not have permission to access User Management");
                navigate("/");
                return false;
            }
            setIsAdmin(true);
            return true;
        } catch (error: any) {
            toast.error("Failed to verify admin access");
            navigate("/");
            return false;
        }
    };

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await http.get("auth/users/", {
                headers: { Authorization: `Token ${token}` },
            });
            
            let userData = [];
            if (Array.isArray(response.data)) {
                userData = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                userData = response.data.results;
            } else if (response.data && response.data.data) {
                userData = response.data.data;
            }
            
            setAllUsers(userData);
            paginateUsers(userData, 1);
        } catch (error: any) {
            console.error("Failed to load users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // Fetch departments
    const fetchDepartments = async () => {
        try {
            const response = await http.get("lms/departments/", {
                headers: { Authorization: `Token ${token}` },
            });
            // Handle different response structures
            if (Array.isArray(response.data)) {
                setDepartments(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setDepartments(response.data.results);
            } else {
                setDepartments([]);
            }
        } catch (error: any) {
            console.error("Failed to load departments", error);
            setDepartments([]);
        }
    };

    // Fetch roles
    const fetchRoles = async () => {
        try {
            const response = await http.get("auth/roles/", {
                headers: { Authorization: `Token ${token}` },
            });
            console.log("Roles response:", response.data);
            // Handle different response structures
            if (Array.isArray(response.data)) {
                setRoles(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setRoles(response.data.results);
            } else if (response.data) {
                // If it's an object but not an array, try to get results
                const rolesList = response.data.results || response.data;
                setRoles(Array.isArray(rolesList) ? rolesList : []);
            } else {
                setRoles([]);
            }
        } catch (error: any) {
            console.error("Failed to load roles", error);
            console.error("Error details:", error.response?.data);
            setRoles([]);
        }
    };

    // Paginate users
    const paginateUsers = (userList: User[], page: number) => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setUsers(userList.slice(startIndex, endIndex));
        setCurrentPage(page);
    };

    // Handle search
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (!term) {
            paginateUsers(allUsers, 1);
            return;
        }
        
        const filtered = allUsers.filter(user =>
            user.email.toLowerCase().includes(term.toLowerCase()) ||
            user.id_number.toLowerCase().includes(term.toLowerCase()) ||
            user.first_name.toLowerCase().includes(term.toLowerCase()) ||
            user.last_name.toLowerCase().includes(term.toLowerCase())
        );
        paginateUsers(filtered, 1);
    };

    useEffect(() => {
        const initializeComponent = async () => {
            const hasAccess = await checkAdminAccess();
            if (hasAccess) {
                fetchUsers();
                fetchDepartments();
                fetchRoles();
            }
        };
        initializeComponent();
    }, []);

    // Handle form change
    const handleInputChange = (e: any) => {
        const { name, value, checked, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Handle edit user
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            middle_name: user.middle_name || "",
            suffix: user.suffix || "",
            id_number: user.id_number || "",
            password: "",
            is_staff: user.is_staff || false,
            is_student: user.is_student || false,
            is_employee: user.is_employee || false,
            is_active: user.is_active || false,
            department: user.department?.id ? user.department.id.toString() : "",
        });
        setOpenDialog(true);
    };

    // Handle delete user
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await http.delete(`auth/users/${userToDelete.uuid}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            toast.success("User deleted successfully");
            setOpenDeleteDialog(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error: any) {
            toast.error("Failed to delete user");
        }
    };

    // Handle save user
    const handleSaveUser = async () => {
        try {
            // Validate required fields
            if (!formData.email || !formData.first_name || !formData.last_name || !formData.id_number) {
                toast.error("Please fill in all required fields");
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error("Please enter a valid email address");
                return;
            }

            // Prepare payload - only include fields that should be sent
            const payload: any = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                middle_name: formData.middle_name,
                suffix: formData.suffix,
                id_number: formData.id_number,
                is_staff: formData.is_staff,
                is_student: formData.is_student,
                is_employee: formData.is_employee,
                is_active: formData.is_active,
                roles: formData.roles && formData.roles.length > 0 ? formData.roles : [],
            };

            // Add department only if it has a value
            if (formData.department) {
                payload.department = parseInt(formData.department);
            }

            if (editingUser) {
                // Update user - only include password if provided
                if (formData.password) {
                    payload.password = formData.password;
                }
                await http.put(`auth/users/${editingUser.uuid}/`, payload, {
                    headers: { Authorization: `Token ${token}` },
                });
                toast.success("User updated successfully");
            } else {
                // Create user - password required for new users
                if (!formData.password) {
                    toast.error("Password is required for new users");
                    return;
                }
                payload.password = formData.password;
                await http.post("auth/users/", payload, {
                    headers: { Authorization: `Token ${token}` },
                });
                toast.success("User created successfully");
            }
            setOpenDialog(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.email?.[0] || "Failed to save user";
            toast.error(errorMsg);
            console.error("Save user error:", error.response?.data);
        }
    };

    const resetForm = () => {
        setFormData({
            email: "",
            first_name: "",
            last_name: "",
            middle_name: "",
            suffix: "",
            id_number: "",
            password: "",
            is_staff: false,
            is_student: false,
            is_employee: false,
            is_active: true,
            roles: [],
        });
        setEditingUser(null);
    };

    const handleAddNew = () => {
        resetForm();
        setOpenDialog(true);
    };

    return (
        <Box className="w-full h-full bg-gray-50 overflow-y-auto">
            {/* Header */}
            <Box className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <IoArrowBack className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <Typography variant="h5" className="font-bold text-gray-900">
                    👥 User Management
                </Typography>
            </Box>

            <Container maxWidth="lg" className="py-8">
                {/* Admin Only Alert */}
                {!loading && isAdmin && (
                    <Alert severity="info" className="mb-6">
                        ✓ You have admin access to manage all user accounts. You can add, edit, view, and delete users.
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <Box className="flex justify-center py-12">
                        <CircularProgress />
                    </Box>
                ) : !isAdmin ? (
                    <Alert severity="error">
                        You do not have permission to access this page. Admin access required.
                    </Alert>
                ) : (
                    <>
                        {/* Add User Button and Search */}
                        <Box className="mb-6 flex gap-4 items-center">
                            <Button
                                variant="contained"
                                startIcon={<FaPlus />}
                                onClick={handleAddNew}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Add New User
                            </Button>
                            <TextField
                                placeholder="Search by email, ID, name..."
                                size="small"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="flex-1"
                                variant="outlined"
                            />
                        </Box>

                        {/* Users Table */}
                        <TableContainer component={Paper} className="mb-4">
                            <Table>
                                <TableHead>
                                    <TableRow className="bg-gray-100">
                                        <TableCell className="font-bold">ID Number</TableCell>
                                        <TableCell className="font-bold">Name</TableCell>
                                        <TableCell className="font-bold">Email</TableCell>
                                        <TableCell className="font-bold">Department</TableCell>
                                        <TableCell className="font-bold">Status</TableCell>
                                        <TableCell className="font-bold">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.uuid} className="hover:bg-gray-50">
                                                <TableCell>{user.id_number}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" className="font-semibold">
                                                            {user.first_name} {user.last_name}
                                                        </Typography>
                                                        {user.middle_name && (
                                                            <Typography variant="caption" className="text-gray-600">
                                                                {user.middle_name}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.department?.name || "N/A"}</TableCell>
                                                <TableCell>
                                                    {user.is_active ? (
                                                        <Chip label="Active" color="success" size="small" />
                                                    ) : (
                                                        <Chip label="Inactive" color="error" size="small" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box className="flex gap-2">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<FaEdit />}
                                                            onClick={() => handleEdit(user)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<FaTrash />}
                                                            onClick={() => handleDeleteClick(user)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {allUsers.length > pageSize && (
                            <Box className="flex justify-center mb-6">
                                <Pagination
                                    count={Math.ceil(allUsers.length / pageSize)}
                                    page={currentPage}
                                    onChange={(e, page) => paginateUsers(allUsers, page)}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>

            {/* Add/Edit User Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle className="bg-gray-100 font-bold">
                    {editingUser ? "Edit User" : "Add New User"}
                </DialogTitle>
                <DialogContent className="pt-6">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="ID Number"
                                name="id_number"
                                value={formData.id_number}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={!!editingUser}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Middle Name"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Suffix"
                                name="suffix"
                                value={formData.suffix}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        {!editingUser && (
                            <Grid item xs={12}>
                                <TextField
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    fullWidth
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    name="department"
                                    value={formData.department || ""}
                                    onChange={handleInputChange}
                                    label="Department"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {Array.isArray(departments) && departments.map((dept: any) => (
                                        <MenuItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    name="roles"
                                    multiple
                                    value={formData.roles || []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            roles: typeof value === "string" ? value.split(",") : value,
                                        }));
                                    }}
                                    label="Role"
                                >
                                    {Array.isArray(roles) && roles.map((role: any) => (
                                        <MenuItem key={role.uuid || role.id} value={role.uuid || role.id}>
                                            {role.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} className="space-y-3">
                            <Typography variant="subtitle2" className="font-bold">
                                User Type
                            </Typography>
                            <Box className="flex gap-4">
                                <Box className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_staff"
                                        checked={formData.is_staff}
                                        onChange={handleInputChange}
                                        id="is_staff"
                                    />
                                    <label htmlFor="is_staff">Staff</label>
                                </Box>
                                <Box className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_student"
                                        checked={formData.is_student}
                                        onChange={handleInputChange}
                                        id="is_student"
                                    />
                                    <label htmlFor="is_student">Student</label>
                                </Box>
                                <Box className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_employee"
                                        checked={formData.is_employee}
                                        onChange={handleInputChange}
                                        id="is_employee"
                                    />
                                    <label htmlFor="is_employee">Employee</label>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                id="is_active"
                            />
                            <label htmlFor="is_active">Active</label>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="p-4 bg-gray-50">
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveUser}
                        variant="contained"
                        color="primary"
                        className="bg-blue-600"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {userToDelete?.first_name}{" "}
                        {userToDelete?.last_name}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
