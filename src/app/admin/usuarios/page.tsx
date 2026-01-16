"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Building2,
    Mail,
    Shield,
    Edit,
    KeyRound,
    UserX,
    UserCheck,
    RefreshCw,
    Plus,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Usuario {
    usuarioId: string;
    email: string;
    nombreCompleto: string;
    rol: string;
    activo: boolean;
    organizacionId: string | null;
    organizacion?: {
        nombre: string;
        tipo: string;
    };
    createdAt: string;
}

interface Organizacion {
    organizacionId: string;
    nombre: string;
    tipo: string;
    region: string;
}

const ROLES = ["Ciudadano", "Técnico", "Administrador", "Administrador Plataforma"];

export default function AdminUsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRol, setFilterRol] = useState("");
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [editForm, setEditForm] = useState({
        nombreCompleto: "",
        rol: "",
        activo: true,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");

    // Create user state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [newUser, setNewUser] = useState({
        email: "",
        nombreCompleto: "",
        rol: "Técnico",
        organizacionId: "",
    });
    const [createdPassword, setCreatedPassword] = useState<string | null>(null);

    useEffect(() => {
        fetchUsuarios();
        fetchOrganizaciones();
    }, []);

    const fetchUsuarios = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setUsuarios(data || []);
        } catch (err) {
            console.error("Error fetching usuarios:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrganizaciones = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/organizaciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setOrganizaciones(data || []);
        } catch (err) {
            console.error("Error fetching organizaciones:", err);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/usuarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...newUser,
                    organizacionId: newUser.organizacionId || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al crear usuario");
            }

            // Show password modal
            setCreatedPassword(result.data.tempPassword);
            setNewUser({
                email: "",
                nombreCompleto: "",
                rol: "Técnico",
                organizacionId: "",
            });
            fetchUsuarios();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditUser = (user: Usuario) => {
        setEditingUser(user);
        setEditForm({
            nombreCompleto: user.nombreCompleto,
            rol: user.rol,
            activo: user.activo,
        });
        setError("");
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsUpdating(true);
        setError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                `${API_URL}/api/admin/usuarios/${editingUser.usuarioId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(editForm),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al actualizar usuario");
            }

            setEditingUser(null);
            fetchUsuarios();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!confirm("¿Está seguro de resetear la contraseña de este usuario?")) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                `${API_URL}/api/admin/usuarios/${userId}/reset-password`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al resetear contraseña");
            }

            alert(
                `Contraseña reseteada.\n\nContraseña temporal: ${data.data.tempPassword}\n\nCompartir esta contraseña de forma segura con el usuario.`
            );
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleToggleActive = async (user: Usuario) => {
        const action = user.activo ? "desactivar" : "activar";
        if (!confirm(`¿Está seguro de ${action} este usuario?`)) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                `${API_URL}/api/admin/usuarios/${user.usuarioId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ activo: !user.activo }),
                }
            );

            if (!response.ok) {
                throw new Error("Error al actualizar estado");
            }

            fetchUsuarios();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredUsers = usuarios.filter((user) => {
        const matchesSearch =
            user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRol = !filterRol || user.rol === filterRol;
        return matchesSearch && matchesRol;
    });

    const getRolColor = (rol: string) => {
        switch (rol) {
            case "Administrador Plataforma":
                return "bg-amber-100 text-amber-700";
            case "Administrador":
                return "bg-purple-100 text-purple-700";
            case "Técnico":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-green-100 text-green-700";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Usuarios</h1>
                    <p className="text-neutral-600">
                        Gestión global de usuarios de la plataforma
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <select
                        value={filterRol}
                        onChange={(e) => setFilterRol(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Todos los roles</option>
                        {ROLES.map((rol) => (
                            <option key={rol} value={rol}>
                                {rol}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={fetchUsuarios}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600">Cargando usuarios...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No se encontraron usuarios</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                                        Usuario
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                                        Organización
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                                        Rol
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.usuarioId} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-neutral-900">
                                                    {user.nombreCompleto}
                                                </p>
                                                <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.organizacion ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-neutral-700">
                                                        {user.organizacion.nombre}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400">Sin organización</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm ${getRolColor(
                                                    user.rol
                                                )}`}
                                            >
                                                <Shield className="w-3 h-3" />
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-sm ${
                                                    user.activo
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {user.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.usuarioId)}
                                                    className="p-2 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Resetear contraseña"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        user.activo
                                                            ? "text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                                            : "text-neutral-400 hover:text-green-600 hover:bg-green-50"
                                                    }`}
                                                    title={user.activo ? "Desactivar" : "Activar"}
                                                >
                                                    {user.activo ? (
                                                        <UserX className="w-4 h-4" />
                                                    ) : (
                                                        <UserCheck className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Editar Usuario
                            </h2>
                            <p className="text-sm text-neutral-500">{editingUser.email}</p>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    value={editForm.nombreCompleto}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, nombreCompleto: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={editForm.rol}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, rol: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    {ROLES.map((rol) => (
                                        <option key={rol} value={rol}>
                                            {rol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={editForm.activo}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, activo: e.target.checked })
                                    }
                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="activo" className="text-sm text-neutral-700">
                                    Usuario activo
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
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

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Nuevo Usuario
                            </h2>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            {createError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {createError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.nombreCompleto}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, nombreCompleto: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="usuario@ejemplo.cl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Rol *
                                </label>
                                <select
                                    value={newUser.rol}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, rol: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    {ROLES.map((rol) => (
                                        <option key={rol} value={rol}>
                                            {rol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Organización
                                </label>
                                <select
                                    value={newUser.organizacionId}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, organizacionId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Sin organización</option>
                                    {organizaciones.map((org) => (
                                        <option key={org.organizacionId} value={org.organizacionId}>
                                            {org.nombre} ({org.region})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Los usuarios con rol Técnico o Administrador deben tener una organización asignada.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError("");
                                    }}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {isCreating ? "Creando..." : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {createdPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-2">
                                Usuario creado exitosamente
                            </h2>
                            <p className="text-neutral-600">
                                Guarde la contraseña temporal para compartirla con el usuario.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-amber-800 font-medium mb-2">
                                Contraseña temporal:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border border-amber-300 font-mono text-lg">
                                    {createdPassword}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(createdPassword);
                                    }}
                                    className="px-3 py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                                    title="Copiar"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="text-xs text-amber-700 mt-2">
                                El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setCreatedPassword(null);
                                setShowCreateModal(false);
                            }}
                            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
