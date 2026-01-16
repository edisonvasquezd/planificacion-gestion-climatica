"use client";

import { useState, useEffect } from "react";
import { User, Lock, Mail, Building2, Shield, Save, Eye, EyeOff, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface UserData {
    id: string;
    email: string;
    nombreCompleto: string;
    rol: string;
    organizacionId: string | null;
}

export default function PerfilPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Change password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setUser(data);
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess(false);

        // Validations
        if (newPassword.length < 6) {
            setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError("La nueva contraseña debe ser diferente a la actual");
            return;
        }

        setIsChangingPassword(true);

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al cambiar contraseña");
            }

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Hide success message after 5 seconds
            setTimeout(() => setPasswordSuccess(false), 5000);
        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const getRolColor = (rol: string) => {
        switch (rol) {
            case "Administrador Plataforma":
                return "bg-amber-100 text-amber-800";
            case "Administrador":
                return "bg-purple-100 text-purple-800";
            case "Técnico":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-green-100 text-green-800";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Mi Perfil</h1>
                <p className="text-neutral-600">Gestiona tu información y seguridad</p>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-white">
                            <h2 className="text-xl font-bold">{user?.nombreCompleto}</h2>
                            <p className="text-primary-100">{user?.email}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-neutral-100 rounded-lg">
                                <Mail className="w-5 h-5 text-neutral-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Email</p>
                                <p className="font-medium text-neutral-900">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-neutral-100 rounded-lg">
                                <Shield className="w-5 h-5 text-neutral-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Rol</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRolColor(user?.rol || "")}`}>
                                    {user?.rol}
                                </span>
                            </div>
                        </div>
                        {user?.organizacionId && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-neutral-100 rounded-lg">
                                    <Building2 className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Organización</p>
                                    <p className="font-medium text-neutral-900">Vinculada</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900">Cambiar Contraseña</h3>
                            <p className="text-sm text-neutral-500">Actualiza tu contraseña de acceso</p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    {passwordSuccess && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <span>Contraseña actualizada exitosamente</span>
                        </div>
                    )}

                    {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {passwordError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Contraseña Actual
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Ingresa tu contraseña actual"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Repite la nueva contraseña"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isChangingPassword ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Contraseña
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
