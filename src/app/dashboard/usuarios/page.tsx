"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    Users,
    Search,
    Mail,
    Shield,
    UserPlus,
    Edit,
    UserX,
    UserCheck,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Usuario {
    usuarioId: string;
    email: string;
    nombreCompleto: string;
    rol: string;
    activo: boolean;
    createdAt: string;
}

const ROLES_ORG = ["Ciudadano", "Técnico", "Administrador"];

export default function UsuariosOrganizacionPage() {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");

    // Invite user form
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: "",
        nombreCompleto: "",
        rol: "Técnico",
    });
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState("");

    useEffect(() => {
        if (user?.organizacionId) {
            fetchUsuarios();
        }
    }, [user?.organizacionId]);

    const fetchUsuarios = async () => {
        setIsLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Error al cargar usuarios");
            }

            const { data } = await response.json();
            setUsuarios(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        setInviteError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/usuarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...inviteForm,
                    organizacionId: user?.organizacionId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al invitar usuario");
            }

            setShowInviteModal(false);
            setInviteForm({ email: "", nombreCompleto: "", rol: "Técnico" });
            fetchUsuarios();
        } catch (err: any) {
            setInviteError(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleToggleActive = async (usuario: Usuario) => {
        const action = usuario.activo ? "desactivar" : "activar";
        if (!confirm(`¿Está seguro de ${action} a ${usuario.nombreCompleto}?`)) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                `${API_URL}/api/usuarios/${usuario.usuarioId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ activo: !usuario.activo }),
                }
            );

            if (!response.ok) {
                throw new Error("Error al actualizar usuario");
            }

            fetchUsuarios();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredUsers = usuarios.filter(
        (u) =>
            u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRolColor = (rol: string) => {
        switch (rol) {
            case "Administrador":
                return "bg-purple-100 text-purple-700";
            case "Técnico":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-green-100 text-green-700";
        }
    };

    if (!user?.organizacionId) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                    Sin organización asignada
                </h2>
                <p className="text-neutral-600 text-center max-w-md">
                    No tienes una organización asignada. Los usuarios se gestionan a nivel de organización.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Usuarios</h1>
                    <p className="text-neutral-600">
                        Gestiona los usuarios de tu organización
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    Invitar Usuario
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex gap-4">
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
                    <button
                        onClick={fetchUsuarios}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

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
                        <p className="text-neutral-600">No hay usuarios en la organización</p>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="mt-4 text-primary-600 hover:underline"
                        >
                            Invitar al primer usuario
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {filteredUsers.map((usuario) => (
                            <div
                                key={usuario.usuarioId}
                                className="p-4 hover:bg-neutral-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                            {usuario.nombreCompleto.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900">
                                                {usuario.nombreCompleto}
                                            </h3>
                                            <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {usuario.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getRolColor(
                                                usuario.rol
                                            )}`}
                                        >
                                            <Shield className="w-3 h-3" />
                                            {usuario.rol}
                                        </span>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-sm ${
                                                usuario.activo
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {usuario.activo ? "Activo" : "Inactivo"}
                                        </span>
                                        {usuario.usuarioId !== user?.id && (
                                            <button
                                                onClick={() => handleToggleActive(usuario)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    usuario.activo
                                                        ? "text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                                        : "text-neutral-400 hover:text-green-600 hover:bg-green-50"
                                                }`}
                                                title={usuario.activo ? "Desactivar" : "Activar"}
                                            >
                                                {usuario.activo ? (
                                                    <UserX className="w-5 h-5" />
                                                ) : (
                                                    <UserCheck className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Invitar Usuario
                            </h2>
                            <p className="text-sm text-neutral-500">
                                Agrega un nuevo miembro a tu organización
                            </p>
                        </div>
                        <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                            {inviteError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {inviteError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={inviteForm.nombreCompleto}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, nombreCompleto: e.target.value })
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
                                    value={inviteForm.email}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="juan@ejemplo.cl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={inviteForm.rol}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, rol: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    {ROLES_ORG.map((rol) => (
                                        <option key={rol} value={rol}>
                                            {rol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-sm text-neutral-500">
                                Se enviará una invitación al usuario para que establezca su contraseña.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {isInviting ? "Invitando..." : "Enviar Invitación"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
