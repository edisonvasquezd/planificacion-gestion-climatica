"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading: authLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
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
                            RESILIAI
                        </h1>
                    </Link>
                    <p className="text-neutral-300 mt-2">
                        Resiliencia Climática Inteligente
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6 text-center">
                        Iniciar Sesión
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-neutral-700 mb-1"
                            >
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field"
                                placeholder="usuario@organizacion.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-neutral-700 mb-1"
                            >
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-600 text-sm">
                            ¿No tienes cuenta?{" "}
                            <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-200">
                        <Link
                            href="/consulta-publica"
                            className="block text-center text-secondary-600 hover:underline text-sm"
                        >
                            Acceder a Consulta Pública (sin cuenta)
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-neutral-400 text-sm mt-8">
                    © 2026 RESILIAI
                </p>
            </div>
        </main>
    );
}
