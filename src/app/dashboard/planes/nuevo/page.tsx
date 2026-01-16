"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export default function NuevoPlanPage() {
    const router = useRouter();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        nombrePlan: "",
        tipoPlan: "PACCC",
        responsablePlan: "",
        version: "1.0",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/planes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al crear plan");
            }

            router.push(`/dashboard/planes/${result.data.planId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/planes" className="text-primary-600 hover:underline text-sm mb-2 inline-block">
                    ← Volver a Planes
                </Link>
                <h1 className="text-2xl font-heading font-bold text-neutral-900">
                    Nuevo Plan
                </h1>
                <p className="text-neutral-600 mt-1">
                    Crear un nuevo PACCC o PGRD
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="tipoPlan" className="block text-sm font-medium text-neutral-700 mb-1">
                            Tipo de Plan *
                        </label>
                        <select
                            id="tipoPlan"
                            name="tipoPlan"
                            value={formData.tipoPlan}
                            onChange={handleChange}
                            className="input-field"
                            required
                        >
                            <option value="PACCC">PACCC - Plan de Acción Comunal de Cambio Climático (Ley 21.455)</option>
                            <option value="PGRD">PGRD - Plan de Gestión de Riesgo de Desastres (Ley 21.364)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="nombrePlan" className="block text-sm font-medium text-neutral-700 mb-1">
                            Nombre del Plan *
                        </label>
                        <input
                            id="nombrePlan"
                            name="nombrePlan"
                            type="text"
                            value={formData.nombrePlan}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Ej: Plan de Acción Comunal de Cambio Climático 2024-2030"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="responsablePlan" className="block text-sm font-medium text-neutral-700 mb-1">
                            Responsable del Plan *
                        </label>
                        <input
                            id="responsablePlan"
                            name="responsablePlan"
                            type="text"
                            value={formData.responsablePlan}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Ej: Encargado Oficina de Medio Ambiente"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="version" className="block text-sm font-medium text-neutral-700 mb-1">
                            Versión
                        </label>
                        <input
                            id="version"
                            name="version"
                            type="text"
                            value={formData.version}
                            onChange={handleChange}
                            className="input-field w-24"
                            placeholder="1.0"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">ℹ️ Información</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• El plan se creará en estado &quot;En elaboración&quot;</li>
                            <li>• Se generará automáticamente un módulo de diagnóstico vacío</li>
                            <li>• Para iniciar la consulta pública (mínimo 30 días según Ley 21.455), deberá completar el diagnóstico primero</li>
                        </ul>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {isLoading ? "Creando..." : "Crear Plan"}
                        </button>
                        <Link
                            href="/dashboard/planes"
                            className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
