import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchUserRole } from '../unieventify/src/Application/slice';
import axios from 'axios';
import { Modal, Button, Label, TextInput, Textarea, FileInput } from 'flowbite-react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface App {
    uuid: string;
    name: string;
    description: string;
    logo?: string;
    logo_url?: string;
    url: string;
    is_active: boolean;
    is_visible_to_users: boolean;
    display_order: number;
    created_at: string;
}

interface FormData {
    name: string;
    description: string;
    logo_url: string;
    url: string;
    is_active: boolean;
    is_visible_to_users: boolean;
    display_order: number;
}

export default function AdminApps() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);
    const user = useAppSelector((state) => state.auth.user);
    const highestRankRole = useAppSelector((state) => state.unieventify.userRole);
    
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAppId, setEditingAppId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        logo_url: '',
        url: '',
        is_active: true,
        is_visible_to_users: true,
        display_order: 0,
    });

    // Fetch role when the component mounts
    useEffect(() => {
        dispatch(fetchUserRole());
    }, [dispatch]);

    // Check if user is admin
    const isAdmin = () => {
        if (user && user.is_staff) {
            return true;
        }
        if (highestRankRole && (highestRankRole.name === 'Admin' || highestRankRole.name === 'Chairman')) {
            return true;
        }
        return false;
    };

    // Fetch apps
    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await axios.get('/api/apps/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApps(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch apps:', error);
                setLoading(false);
            }
        };

        if (token) {
            fetchApps();
        }
    }, [token]);

    const handleOpenModal = (app?: App) => {
        if (app) {
            setIsEditing(true);
            setEditingAppId(app.uuid);
            setFormData({
                name: app.name,
                description: app.description,
                logo_url: app.logo_url || '',
                url: app.url,
                is_active: app.is_active,
                is_visible_to_users: app.is_visible_to_users,
                display_order: app.display_order,
            });
        } else {
            setIsEditing(false);
            setEditingAppId(null);
            setFormData({
                name: '',
                description: '',
                logo_url: '',
                url: '',
                is_active: true,
                is_visible_to_users: true,
                display_order: 0,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditingAppId(null);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else if (type === 'number') {
            setFormData((prev) => ({
                ...prev,
                [name]: parseInt(value, 10),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingAppId) {
                // Update app
                await axios.put(`/api/apps/${editingAppId}/`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Refresh apps list
                const response = await axios.get('/api/apps/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApps(response.data);
            } else {
                // Create app
                await axios.post('/api/apps/', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Refresh apps list
                const response = await axios.get('/api/apps/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApps(response.data);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving app:', error);
            alert('Failed to save app');
        }
    };

    const handleDeleteApp = async (appId: string) => {
        if (window.confirm('Are you sure you want to delete this app?')) {
            try {
                await axios.delete(`/api/apps/${appId}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Refresh apps list
                const response = await axios.get('/api/apps/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApps(response.data);
            } catch (error) {
                console.error('Error deleting app:', error);
                alert('Failed to delete app');
            }
        }
    };

    if (!isAdmin()) {
        return (
            <div className="text-white text-center p-10">
                You do not have permission to access this page.
            </div>
        );
    }

    if (loading) {
        return <div className="text-white text-center p-10">Loading apps...</div>;
    }

    return (
        <div className="p-8 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">App Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <FaPlus /> Add New App
                </button>
            </div>

            {/* Apps Table */}
            <div className="overflow-x-auto bg-gray-800 rounded-lg">
                <table className="w-full text-left text-white">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-6 py-3">App Name</th>
                            <th className="px-6 py-3">URL</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Visible</th>
                            <th className="px-6 py-3">Order</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.length > 0 ? (
                            apps.map((app) => (
                                <tr key={app.uuid} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 font-semibold">{app.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{app.url}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                app.is_active
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            }`}
                                        >
                                            {app.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                app.is_visible_to_users
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-500 text-white'
                                            }`}
                                        >
                                            {app.is_visible_to_users ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{app.display_order}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(app)}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                title="Edit"
                                            >
                                                <FaEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteApp(app.uuid)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Delete"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                    No apps available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={handleCloseModal} size="md">
                <Modal.Header>
                    {isEditing ? 'Edit App' : 'Create New App'}
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name" value="App Name *" />
                            <TextInput
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter app name"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description" value="Description" />
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter app description"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="url" value="URL Path *" />
                            <TextInput
                                id="url"
                                name="url"
                                type="text"
                                value={formData.url}
                                onChange={handleInputChange}
                                placeholder="e.g., /syllabease/dashboard/"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="logo_url" value="Logo URL" />
                            <TextInput
                                id="logo_url"
                                name="logo_url"
                                type="text"
                                value={formData.logo_url}
                                onChange={handleInputChange}
                                placeholder="E.g., https://example.com/logo.png"
                            />
                        </div>

                        <div>
                            <Label htmlFor="display_order" value="Display Order" />
                            <TextInput
                                id="display_order"
                                name="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center">
                                <input
                                    id="is_active"
                                    name="is_active"
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="is_active" value="Active" className="ml-2" />
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="is_visible_to_users"
                                    name="is_visible_to_users"
                                    type="checkbox"
                                    checked={formData.is_visible_to_users}
                                    onChange={handleInputChange}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="is_visible_to_users" value="Visible to Users" className="ml-2" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button color="gray" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button type="submit" color="blue">
                                {isEditing ? 'Update App' : 'Create App'}
                            </Button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
