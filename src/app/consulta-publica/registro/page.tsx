"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, User, Mail, Lock, MapPin, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

function RegistroCiudadanoForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/consulta-publica";

    const [formData, setFormData] = useState({
        nombreCompleto: "",
        email: "",
        password: "",
        confirmPassword: "",
        rut: "",
        comunaResidencia: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register-ciudadano`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    nombreCompleto: formData.nombreCompleto,
                    rut: formData.rut || undefined,
                    comunaResidencia: formData.comunaResidencia || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al registrarse");
            }

            // Store token
            if (data.data?.token) {
                localStorage.setItem("auth_token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
            }

            setSuccess(true);

            // Redirect after short delay
            setTimeout(() => {
                router.push(redirectTo);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Error al registrarse. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                        Registro Exitoso
                    </h2>
                    <p className="text-neutral-600 mb-4">
                        Tu cuenta ha sido creada. Ahora puedes participar en las consultas públicas.
                    </p>
                    <p className="text-sm text-neutral-500">
                        Redirigiendo...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Globe className="w-7 h-7 text-primary-600" />
                        <span className="font-heading font-bold text-primary-600 text-xl">
                            RESILIAI
                        </span>
                    </Link>
                    <Link
                        href="/consulta-publica"
                        className="text-sm text-neutral-600 hover:text-primary-600 flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Consultas
                    </Link>
                </div>
            </header>

            <div className="flex items-center justify-center py-12 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            Registro Ciudadano
                        </h1>
                        <p className="text-neutral-600 mt-2">
                            Crea una cuenta para participar en las consultas públicas de tu comuna.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nombre Completo */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Nombre Completo *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    name="nombreCompleto"
                                    value={formData.nombreCompleto}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Juan Pérez González"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Correo Electrónico *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        {/* RUT (opcional) */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                RUT <span className="text-neutral-400">(opcional)</span>
                            </label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="12.345.678-9"
                                />
                            </div>
                        </div>

                        {/* Comuna */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Comuna de Residencia <span className="text-neutral-400">(opcional)</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    name="comunaResidencia"
                                    value={formData.comunaResidencia}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Santiago"
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Contraseña *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Confirmar Contraseña *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Repite tu contraseña"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Registrando..." : "Crear Cuenta"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-600">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
                                className="text-primary-600 hover:underline font-medium"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-200">
                        <p className="text-xs text-neutral-500 text-center">
                            Al registrarte, aceptas que tus datos serán utilizados únicamente para
                            los procesos de participación ciudadana según la Ley 21.455.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

function LoadingFallback() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-neutral-600">Cargando...</p>
            </div>
        </main>
    );
}

export default function RegistroCiudadanoPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegistroCiudadanoForm />
        </Suspense>
    );
}
