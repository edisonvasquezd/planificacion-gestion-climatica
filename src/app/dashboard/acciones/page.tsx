"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Leaf, Star, Target, Plus, DollarSign, Clock, CheckCircle2, PauseCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Accion {
    accionId: string;
    nombreAccion: string;
    tipoSolucion: string;
    pilarPaccc: string;
    faseCicloRiesgo: string;
    responsableImplementacion: string;
    prioridad: number | null;
    gestiones?: { estadoImplementacion: string; presupuestoAsignadoClp: number }[];
}

export default function AccionesPage() {
    const { token } = useAuth();
    const [acciones, setAcciones] = useState<Accion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ tipo: "", pilar: "" });

    useEffect(() => {
        fetchAcciones();
    }, [token]);

    const fetchAcciones = async () => {
        try {
            const response = await fetch(`${API_URL}/api/acciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setAcciones(data || []);
        } catch (error) {
            console.error("Error fetching acciones:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            Gris: "bg-gray-100 text-gray-700",
            Verde: "bg-green-100 text-green-700",
            Híbrida: "bg-teal-100 text-teal-700",
            SbN: "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300",
        };
        return colors[tipo] || "bg-gray-100 text-gray-700";
    };

    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            Diseño: "bg-gray-100 text-gray-600",
            Licitación: "bg-blue-100 text-blue-700",
            "En Ejecución": "bg-yellow-100 text-yellow-700",
            Finalizada: "bg-green-100 text-green-700",
            Pausada: "bg-orange-100 text-orange-700",
        };
        return colors[estado] || "bg-gray-100";
    };

    const formatCLP = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const filteredAcciones = acciones.filter((accion) => {
        if (filter.tipo && accion.tipoSolucion !== filter.tipo) return false;
        if (filter.pilar && accion.pilarPaccc !== filter.pilar) return false;
        return true;
    });

    // Stats
    const stats = {
        total: acciones.length,
        sbn: acciones.filter(a => a.tipoSolucion === "SbN").length,
        enEjecucion: acciones.filter(a => a.gestiones?.[0]?.estadoImplementacion === "En Ejecución").length,
        presupuestoTotal: acciones.reduce((sum, a) => sum + (a.gestiones?.[0]?.presupuestoAsignadoClp || 0), 0),
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Cartera de Acciones
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Diseño, priorización y verificación SbN-UICN
                    </p>
                </div>
                <Link href="/dashboard/acciones/nueva" className="btn-primary">
                    + Nueva Acción
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-500">Total Acciones</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-sm text-emerald-600">Soluciones SbN</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.sbn}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-600">En Ejecución</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.enEjecucion}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-500">Presupuesto Total</p>
                    <p className="text-xl font-bold text-neutral-900">{formatCLP(stats.presupuestoTotal)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-neutral-200">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tipo de Solución
                        </label>
                        <select
                            value={filter.tipo}
                            onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
                            className="input-field w-40"
                        >
                            <option value="">Todos</option>
                            <option value="Gris">Gris</option>
                            <option value="Verde">Verde</option>
                            <option value="Híbrida">Híbrida</option>
                            <option value="SbN">SbN</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Pilar PACCC
                        </label>
                        <select
                            value={filter.pilar}
                            onChange={(e) => setFilter({ ...filter, pilar: e.target.value })}
                            className="input-field w-40"
                        >
                            <option value="">Todos</option>
                            <option value="Mitigación">Mitigación</option>
                            <option value="Adaptación">Adaptación</option>
                            <option value="N/A">N/A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Actions List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredAcciones.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                    <p className="text-neutral-500">No hay acciones registradas</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAcciones.map((accion) => {
                        const gestion = accion.gestiones?.[0];
                        return (
                            <Link
                                key={accion.accionId}
                                href={`/dashboard/acciones/${accion.accionId}`}
                                className="block bg-white rounded-xl p-5 shadow-sm border border-neutral-200 
                         hover:shadow-md hover:border-primary-200 transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getTipoColor(accion.tipoSolucion)}`}>
                                                {accion.tipoSolucion === "SbN" && <Leaf className="w-3 h-3" />}
                                                {accion.tipoSolucion}
                                            </span>
                                            {accion.pilarPaccc !== "N/A" && (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                                                    {accion.pilarPaccc}
                                                </span>
                                            )}
                                            {accion.faseCicloRiesgo !== "N/A" && (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                                    {accion.faseCicloRiesgo}
                                                </span>
                                            )}
                                            {accion.prioridad && (
                                                <span className="text-xs text-neutral-400 flex items-center gap-0.5">
                                                    Prioridad: {Array.from({ length: accion.prioridad }).map((_, i) => (
                                                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    ))}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-neutral-900">{accion.nombreAccion}</h3>
                                        <p className="text-sm text-neutral-500 mt-1">
                                            Responsable: {accion.responsableImplementacion}
                                        </p>
                                    </div>

                                    {gestion && (
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(gestion.estadoImplementacion)}`}>
                                                {gestion.estadoImplementacion}
                                            </span>
                                            {gestion.presupuestoAsignadoClp > 0 && (
                                                <span className="text-sm text-neutral-600">
                                                    {formatCLP(gestion.presupuestoAsignadoClp)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
