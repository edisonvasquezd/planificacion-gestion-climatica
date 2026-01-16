"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        nombreCompleto: "",
        rol: "Ciudadano",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            await register({
                email: formData.email,
                password: formData.password,
                nombreCompleto: formData.nombreCompleto,
                rol: formData.rol,
            });
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl font-heading font-bold text-white">
                            PGRC <span className="text-secondary-400">Platform</span>
                        </h1>
                    </Link>
                    <p className="text-neutral-300 mt-2">
                        Crear una cuenta nueva
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">by CHUCAW + JHEDAI</p>
                </div>

                {/* Register Card */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6 text-center">
                        Registro
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="nombreCompleto" className="block text-sm font-medium text-neutral-700 mb-1">
                                Nombre Completo
                            </label>
                            <input
                                id="nombreCompleto"
                                name="nombreCompleto"
                                type="text"
                                value={formData.nombreCompleto}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Juan Pérez González"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="usuario@email.cl"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Repetir contraseña"
                            />
                        </div>

                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-neutral-700 mb-1">
                                Tipo de Usuario
                            </label>
                            <select
                                id="rol"
                                name="rol"
                                value={formData.rol}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="Ciudadano">Ciudadano / Público General</option>
                                <option value="Técnico">Técnico / Analista Organizacional</option>
                                <option value="Administrador">Administrador Organizacional</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 text-lg disabled:opacity-50"
                        >
                            {isLoading ? "Registrando..." : "Crear Cuenta"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-600 text-sm">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-neutral-400 text-sm mt-8">
                    © 2026 CHUCAW • Partner: JHEDAI
                </p>
            </div>
        </main>
    );
}
