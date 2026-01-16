"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Plan {
    planId: string;
    nombrePlan: string;
    tipoPlan: string;
    estadoPlan: string;
    version: string;
    responsablePlan: string;
    createdAt: string;
    organizacion?: { nombre: string };
}

export default function PlanesPage() {
    const { token } = useAuth();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ tipo: "", estado: "" });

    useEffect(() => {
        fetchPlanes();
    }, [token]);

    const fetchPlanes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/planes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setPlanes(data || []);
        } catch (error) {
            console.error("Error fetching planes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            "En elaboración": "bg-gray-100 text-gray-700",
            "En consulta pública": "bg-blue-100 text-blue-700",
            "Vigente": "bg-green-100 text-green-700",
            "Archivado": "bg-neutral-100 text-neutral-500",
        };
        return colors[estado] || "bg-gray-100 text-gray-700";
    };

    const getTipoColor = (tipo: string) => {
        return tipo === "PACCC"
            ? "bg-secondary-100 text-secondary-700"
            : "bg-orange-100 text-orange-700";
    };

    const filteredPlanes = planes.filter((plan) => {
        if (filter.tipo && plan.tipoPlan !== filter.tipo) return false;
        if (filter.estado && plan.estadoPlan !== filter.estado) return false;
        return true;
    });

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Gestión de Planes
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        PACCC (Ley 21.455) y PGRD (Ley 21.364)
                    </p>
                </div>
                <Link
                    href="/dashboard/planes/nuevo"
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <span>+</span> Nuevo Plan
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-neutral-200">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tipo de Plan
                        </label>
                        <select
                            value={filter.tipo}
                            onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
                            className="input-field w-40"
                        >
                            <option value="">Todos</option>
                            <option value="PACCC">PACCC</option>
                            <option value="PGRD">PGRD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Estado
                        </label>
                        <select
                            value={filter.estado}
                            onChange={(e) => setFilter({ ...filter, estado: e.target.value })}
                            className="input-field w-48"
                        >
                            <option value="">Todos</option>
                            <option value="En elaboración">En elaboración</option>
                            <option value="En consulta pública">En consulta pública</option>
                            <option value="Vigente">Vigente</option>
                            <option value="Archivado">Archivado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Plans List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Cargando planes...</p>
                </div>
            ) : filteredPlanes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                    <p className="text-neutral-500">No hay planes registrados</p>
                    <Link href="/dashboard/planes/nuevo" className="text-primary-600 hover:underline mt-2 inline-block">
                        Crear primer plan
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredPlanes.map((plan) => (
                        <Link
                            key={plan.planId}
                            href={`/dashboard/planes/${plan.planId}`}
                            className="block bg-white rounded-xl p-5 shadow-sm border border-neutral-200 
                       hover:shadow-md hover:border-primary-200 transition-all"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(plan.tipoPlan)}`}>
                                            {plan.tipoPlan}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEstadoColor(plan.estadoPlan)}`}>
                                            {plan.estadoPlan}
                                        </span>
                                        <span className="text-xs text-neutral-400">v{plan.version}</span>
                                    </div>
                                    <h3 className="font-semibold text-neutral-900">{plan.nombrePlan}</h3>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        Responsable: {plan.responsablePlan}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-neutral-500">
                                    <p>{new Date(plan.createdAt).toLocaleDateString("es-CL")}</p>
                                    {plan.organizacion && (
                                        <p className="text-xs">{plan.organizacion.nombre}</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
