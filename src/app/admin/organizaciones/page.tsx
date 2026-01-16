"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    Plus,
    Search,
    Users,
    FileText,
    MapPin,
    Edit,
    Trash2,
    LogIn,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Organizacion {
    organizacionId: string;
    nombre: string;
    tipo: string;
    region: string;
    provincia: string;
    poblacion: number | null;
    contactoEmail: string | null;
    totalPlanes: number;
    totalUsuarios: number;
    createdAt: string;
}

export default function AdminOrganizacionesPage() {
    const router = useRouter();
    const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrg, setNewOrg] = useState({
        nombre: "",
        tipo: "Municipal",
        region: "",
        provincia: "",
        poblacion: "",
        contactoEmail: "",
    });
    const [createAdmin, setCreateAdmin] = useState(true);
    const [adminData, setAdminData] = useState({
        nombreCompleto: "",
        email: "",
    });
    const [createdAdminPassword, setCreatedAdminPassword] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");
    const [enteringOrg, setEnteringOrg] = useState<string | null>(null);

    // Edit state
    const [editingOrg, setEditingOrg] = useState<Organizacion | null>(null);
    const [editForm, setEditForm] = useState({
        nombre: "",
        tipo: "Municipal",
        region: "",
        provincia: "",
        poblacion: "",
        contactoEmail: "",
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState("");

    useEffect(() => {
        fetchOrganizaciones();
    }, []);

    const fetchOrganizaciones = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/organizaciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setOrganizaciones(data || []);
        } catch (err) {
            console.error("Error fetching organizaciones:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/organizaciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...newOrg,
                    poblacion: newOrg.poblacion ? parseInt(newOrg.poblacion) : undefined,
                    admin: createAdmin ? adminData : undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al crear organización");
            }

            // If admin was created, show the temp password
            if (result.data?.admin?.tempPassword) {
                setCreatedAdminPassword(result.data.admin.tempPassword);
            } else {
                setShowCreateModal(false);
            }

            setNewOrg({
                nombre: "",
                tipo: "Municipal",
                region: "",
                provincia: "",
                poblacion: "",
                contactoEmail: "",
            });
            setAdminData({ nombreCompleto: "", email: "" });
            fetchOrganizaciones();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteOrg = async (orgId: string) => {
        if (!confirm("¿Está seguro de eliminar esta organización?")) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/organizaciones/${orgId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al eliminar");
            }

            fetchOrganizaciones();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEditOrg = (org: Organizacion) => {
        setEditingOrg(org);
        setEditForm({
            nombre: org.nombre,
            tipo: org.tipo,
            region: org.region,
            provincia: org.provincia,
            poblacion: org.poblacion?.toString() || "",
            contactoEmail: org.contactoEmail || "",
        });
        setEditError("");
    };

    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrg) return;

        setIsUpdating(true);
        setEditError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/organizaciones/${editingOrg.organizacionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...editForm,
                    poblacion: editForm.poblacion ? parseInt(editForm.poblacion) : undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al actualizar organización");
            }

            setEditingOrg(null);
            fetchOrganizaciones();
        } catch (err: any) {
            setEditError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEnterOrg = async (orgId: string, orgName: string) => {
        setEnteringOrg(orgId);

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/impersonate/${orgId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al acceder a la organización");
            }

            const { data } = await response.json();

            // Save the new token and mark as impersonating
            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("impersonating_org", JSON.stringify({
                id: data.organizacion.id,
                nombre: data.organizacion.nombre,
            }));

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            alert(err.message);
            setEnteringOrg(null);
        }
    };

    const filteredOrgs = organizaciones.filter(
        (org) =>
            org.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.region.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Organizaciones</h1>
                    <p className="text-neutral-600">
                        Gestión de municipalidades y organizaciones
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Organización
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o región..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600">Cargando organizaciones...</p>
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No se encontraron organizaciones</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {filteredOrgs.map((org) => (
                            <div
                                key={org.organizacionId}
                                className="p-4 hover:bg-neutral-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900">
                                                {org.nombre}
                                            </h3>
                                            <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {org.provincia}, {org.region}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-neutral-600">
                                                <Users className="w-4 h-4" />
                                                <span className="font-semibold">{org.totalUsuarios}</span>
                                            </div>
                                            <p className="text-xs text-neutral-400">usuarios</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-neutral-600">
                                                <FileText className="w-4 h-4" />
                                                <span className="font-semibold">{org.totalPlanes}</span>
                                            </div>
                                            <p className="text-xs text-neutral-400">planes</p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                org.tipo === "Municipal"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}
                                        >
                                            {org.tipo}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEnterOrg(org.organizacionId, org.nombre)}
                                                disabled={enteringOrg === org.organizacionId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                                title="Entrar al dashboard de esta organización"
                                            >
                                                {enteringOrg === org.organizacionId ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <LogIn className="w-4 h-4" />
                                                )}
                                                Entrar
                                            </button>
                                            <button
                                                onClick={() => handleEditOrg(org)}
                                                className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Editar organización"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrg(org.organizacionId)}
                                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Nueva Organización
                            </h2>
                        </div>
                        <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newOrg.nombre}
                                    onChange={(e) =>
                                        setNewOrg({ ...newOrg, nombre: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Municipalidad de Santiago"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={newOrg.tipo}
                                    onChange={(e) =>
                                        setNewOrg({ ...newOrg, tipo: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="Municipal">Municipal</option>
                                    <option value="Privada">Privada</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Región *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newOrg.region}
                                        onChange={(e) =>
                                            setNewOrg({ ...newOrg, region: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Metropolitana"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Provincia *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newOrg.provincia}
                                        onChange={(e) =>
                                            setNewOrg({ ...newOrg, provincia: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Santiago"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Población
                                </label>
                                <input
                                    type="number"
                                    value={newOrg.poblacion}
                                    onChange={(e) =>
                                        setNewOrg({ ...newOrg, poblacion: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="500000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email de Contacto
                                </label>
                                <input
                                    type="email"
                                    value={newOrg.contactoEmail}
                                    onChange={(e) =>
                                        setNewOrg({ ...newOrg, contactoEmail: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="contacto@municipalidad.cl"
                                />
                            </div>

                            {/* Admin User Section */}
                            <div className="border-t border-neutral-200 pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        id="createAdmin"
                                        checked={createAdmin}
                                        onChange={(e) => setCreateAdmin(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="createAdmin" className="text-sm font-medium text-neutral-700">
                                        Crear usuario administrador
                                    </label>
                                </div>

                                {createAdmin && (
                                    <div className="space-y-4 pl-6 border-l-2 border-primary-200">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                Nombre del Administrador *
                                            </label>
                                            <input
                                                type="text"
                                                required={createAdmin}
                                                value={adminData.nombreCompleto}
                                                onChange={(e) =>
                                                    setAdminData({ ...adminData, nombreCompleto: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="Juan Pérez"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                Email del Administrador *
                                            </label>
                                            <input
                                                type="email"
                                                required={createAdmin}
                                                value={adminData.email}
                                                onChange={(e) =>
                                                    setAdminData({ ...adminData, email: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="admin@municipalidad.cl"
                                            />
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Se generará una contraseña temporal que deberá compartir de forma segura.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {isCreating ? "Creando..." : "Crear Organización"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {createdAdminPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-2">
                                Organización creada exitosamente
                            </h2>
                            <p className="text-neutral-600">
                                Se ha creado el usuario administrador. Guarde la contraseña temporal.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-amber-800 font-medium mb-2">
                                Contraseña temporal:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border border-amber-300 font-mono text-lg">
                                    {createdAdminPassword}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(createdAdminPassword);
                                    }}
                                    className="px-3 py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                                    title="Copiar"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="text-xs text-amber-700 mt-2">
                                Comparta esta contraseña de forma segura con el administrador.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setCreatedAdminPassword(null);
                                setShowCreateModal(false);
                            }}
                            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingOrg && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Editar Organización
                            </h2>
                            <p className="text-sm text-neutral-500">{editingOrg.nombre}</p>
                        </div>
                        <form onSubmit={handleUpdateOrg} className="p-6 space-y-4">
                            {editError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {editError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.nombre}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, nombre: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={editForm.tipo}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, tipo: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="Municipal">Municipal</option>
                                    <option value="Privada">Privada</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Región *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.region}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, region: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Provincia *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.provincia}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, provincia: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Población
                                </label>
                                <input
                                    type="number"
                                    value={editForm.poblacion}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, poblacion: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email de Contacto
                                </label>
                                <input
                                    type="email"
                                    value={editForm.contactoEmail}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, contactoEmail: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingOrg(null)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {isUpdating ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
