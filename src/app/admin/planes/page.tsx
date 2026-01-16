"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Search,
    Building2,
    Calendar,
    MessageSquare,
    RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Plan {
    planId: string;
    nombrePlan: string;
    tipoPlan: string;
    estadoPlan: string;
    version: string;
    responsablePlan: string;
    organizacion: {
        nombre: string;
        region: string;
    };
    consultasPublicas: Array<{
        consultaId: string;
        estadoConsulta: string;
        totalObservaciones: number;
    }>;
    createdAt: string;
}

const ESTADOS = [
    "En elaboración",
    "En consulta pública",
    "Vigente",
    "Archivado",
];

const TIPOS = ["PACCC", "PGRD"];

export default function AdminPlanesPage() {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterEstado, setFilterEstado] = useState("");
    const [filterTipo, setFilterTipo] = useState("");

    useEffect(() => {
        fetchPlanes();
    }, []);

    const fetchPlanes = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/planes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setPlanes(data || []);
        } catch (err) {
            console.error("Error fetching planes:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPlanes = planes.filter((plan) => {
        const matchesSearch =
            plan.nombrePlan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.organizacion.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = !filterEstado || plan.estadoPlan === filterEstado;
        const matchesTipo = !filterTipo || plan.tipoPlan === filterTipo;
        return matchesSearch && matchesEstado && matchesTipo;
    });

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "Vigente":
                return "bg-green-100 text-green-700";
            case "En consulta pública":
                return "bg-amber-100 text-amber-700";
            case "En elaboración":
                return "bg-blue-100 text-blue-700";
            case "Archivado":
                return "bg-neutral-100 text-neutral-600";
            default:
                return "bg-neutral-100 text-neutral-600";
        }
    };

    const getTipoColor = (tipo: string) => {
        return tipo === "PACCC"
            ? "bg-secondary-100 text-secondary-700"
            : "bg-orange-100 text-orange-700";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Planes</h1>
                <p className="text-neutral-600">
                    Vista global de todos los planes PACCC y PGRD
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o organización..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Todos los tipos</option>
                            {TIPOS.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Todos los estados</option>
                            {ESTADOS.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchPlanes}
                            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ESTADOS.map((estado) => {
                    const count = planes.filter((p) => p.estadoPlan === estado).length;
                    return (
                        <div
                            key={estado}
                            className={`p-4 rounded-lg ${getEstadoColor(estado)} cursor-pointer hover:opacity-80 transition-opacity ${
                                filterEstado === estado ? "ring-2 ring-offset-2 ring-primary-500" : ""
                            }`}
                            onClick={() =>
                                setFilterEstado(filterEstado === estado ? "" : estado)
                            }
                        >
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm">{estado}</p>
                        </div>
                    );
                })}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600">Cargando planes...</p>
                    </div>
                ) : filteredPlanes.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-600">No se encontraron planes</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200">
                        {filteredPlanes.map((plan) => {
                            const consultaActiva = plan.consultasPublicas?.find(
                                (c) => c.estadoConsulta === "Activa"
                            );

                            return (
                                <div
                                    key={plan.planId}
                                    className="p-4 hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <FileText className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-neutral-900">
                                                        {plan.nombrePlan}
                                                    </h3>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs ${getTipoColor(
                                                            plan.tipoPlan
                                                        )}`}
                                                    >
                                                        {plan.tipoPlan}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {plan.organizacion.nombre} • {plan.organizacion.region}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(plan.createdAt).toLocaleDateString("es-CL")}
                                                    </span>
                                                    <span>v{plan.version}</span>
                                                    <span>Responsable: {plan.responsablePlan}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {consultaActiva && (
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-amber-600">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span className="font-semibold">
                                                            {consultaActiva.totalObservaciones}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-400">observaciones</p>
                                                </div>
                                            )}
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm ${getEstadoColor(
                                                    plan.estadoPlan
                                                )}`}
                                            >
                                                {plan.estadoPlan}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
