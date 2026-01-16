"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Shield, Plus, Trash2, AlertCircle, ShieldAlert } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Riesgo {
    riesgoId: string;
    nombreRiesgo: string;
    nivelRiesgoCalculado: string;
    justificacionRiesgo?: string;
    amenaza?: { amenazaId: string; tipoAmenaza: string; nombreAmenaza: string };
    vulnerabilidad?: { vulnerabilidadId: string; dimensionVulnerabilidad: string; nombreVulnerabilidad: string };
}

interface Amenaza {
    amenazaId: string;
    tipoAmenaza: string;
    nombreAmenaza: string;
}

interface Vulnerabilidad {
    vulnerabilidadId: string;
    dimensionVulnerabilidad: string;
    nombreVulnerabilidad: string;
}

interface MatrizResumen {
    total: number;
    porNivel: { Bajo: number; Medio: number; Alto: number; Crítico: number };
    porTipoAmenaza: Record<string, number>;
    porDimensionVulnerabilidad: Record<string, number>;
}

export default function RiesgosPage() {
    const { token } = useAuth();
    const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
    const [resumen, setResumen] = useState<MatrizResumen | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [amenazas, setAmenazas] = useState<Amenaza[]>([]);
    const [vulnerabilidades, setVulnerabilidades] = useState<Vulnerabilidad[]>([]);
    const [formData, setFormData] = useState({
        amenazaId: "",
        vulnerabilidadId: "",
        nombreRiesgo: "",
        nivelRiesgoCalculado: "Medio",
        justificacionRiesgo: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRiesgos();
        fetchResumen();
        fetchAmenazasYVulnerabilidades();
    }, [token]);

    const fetchRiesgos = async () => {
        try {
            const response = await fetch(`${API_URL}/api/riesgos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setRiesgos(data || []);
        } catch (error) {
            console.error("Error fetching riesgos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchResumen = async () => {
        try {
            const response = await fetch(`${API_URL}/api/riesgos/matriz/resumen`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setResumen(data);
        } catch (error) {
            console.error("Error fetching resumen:", error);
        }
    };

    const fetchAmenazasYVulnerabilidades = async () => {
        try {
            // Fetch all planes first, then get their diagnosticos
            const planesRes = await fetch(`${API_URL}/api/planes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const planesData = await planesRes.json();

            if (planesData.success && planesData.data.length > 0) {
                // Get diagnostico from first plan
                const diagRes = await fetch(`${API_URL}/api/diagnosticos/${planesData.data[0].planId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const diagData = await diagRes.json();

                if (diagData.success && diagData.data) {
                    setAmenazas(diagData.data.amenazas || []);
                    setVulnerabilidades(diagData.data.vulnerabilidades || []);
                }
            }
        } catch (error) {
            console.error("Error fetching amenazas/vulnerabilidades:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/api/riesgos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({
                    amenazaId: "",
                    vulnerabilidadId: "",
                    nombreRiesgo: "",
                    nivelRiesgoCalculado: "Medio",
                    justificacionRiesgo: "",
                });
                fetchRiesgos();
                fetchResumen();
            }
        } catch (error) {
            console.error("Error creating riesgo:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (riesgoId: string) => {
        if (!confirm("¿Eliminar este riesgo?")) return;

        try {
            await fetch(`${API_URL}/api/riesgos/${riesgoId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchRiesgos();
            fetchResumen();
        } catch (error) {
            console.error("Error deleting riesgo:", error);
        }
    };

    const getNivelColor = (nivel: string) => {
        const colors: Record<string, string> = {
            Bajo: "bg-green-500",
            Medio: "bg-yellow-500",
            Alto: "bg-orange-500",
            Crítico: "bg-red-500",
        };
        return colors[nivel] || "bg-gray-500";
    };

    const getNivelBadge = (nivel: string) => {
        const colors: Record<string, string> = {
            Bajo: "bg-green-100 text-green-700",
            Medio: "bg-yellow-100 text-yellow-700",
            Alto: "bg-orange-100 text-orange-700",
            Crítico: "bg-red-100 text-red-700",
        };
        return colors[nivel] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Matriz de Riesgos
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Análisis de riesgos: Amenaza × Vulnerabilidad
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary">+ Nuevo Riesgo</button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Crear Nuevo Riesgo</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Amenaza *
                                </label>
                                <select
                                    value={formData.amenazaId}
                                    onChange={(e) => setFormData({ ...formData, amenazaId: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seleccionar amenaza...</option>
                                    {amenazas.map((a) => (
                                        <option key={a.amenazaId} value={a.amenazaId}>
                                            {a.tipoAmenaza}: {a.nombreAmenaza}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Vulnerabilidad *
                                </label>
                                <select
                                    value={formData.vulnerabilidadId}
                                    onChange={(e) => setFormData({ ...formData, vulnerabilidadId: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seleccionar vulnerabilidad...</option>
                                    {vulnerabilidades.map((v) => (
                                        <option key={v.vulnerabilidadId} value={v.vulnerabilidadId}>
                                            {v.dimensionVulnerabilidad}: {v.nombreVulnerabilidad}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Nombre del Riesgo *
                            </label>
                            <input
                                type="text"
                                value={formData.nombreRiesgo}
                                onChange={(e) => setFormData({ ...formData, nombreRiesgo: e.target.value })}
                                className="input-field"
                                placeholder="Ej: Riesgo de inundación en viviendas sector bajo"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Nivel de Riesgo
                            </label>
                            <div className="flex gap-2">
                                {["Bajo", "Medio", "Alto", "Crítico"].map((nivel) => (
                                    <button
                                        key={nivel}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, nivelRiesgoCalculado: nivel })}
                                        className={`px-4 py-2 rounded-lg border transition-colors ${
                                            formData.nivelRiesgoCalculado === nivel
                                                ? `${getNivelBadge(nivel)} border-current`
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        {nivel}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Justificación
                            </label>
                            <textarea
                                value={formData.justificacionRiesgo}
                                onChange={(e) => setFormData({ ...formData, justificacionRiesgo: e.target.value })}
                                className="input-field"
                                rows={3}
                                placeholder="Explica por qué se asigna este nivel de riesgo..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Crear Riesgo"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Resumen Cards */}
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Total Riesgos</p>
                        <p className="text-3xl font-bold text-neutral-900">{resumen.total}</p>
                    </div>
                    {Object.entries(resumen.porNivel).map(([nivel, count]) => (
                        <div key={nivel} className="bg-white rounded-xl p-4 border border-neutral-200">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${getNivelColor(nivel)}`}></div>
                                <p className="text-sm text-neutral-500">{nivel}</p>
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">{count}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Visual Matrix */}
            {resumen && resumen.total > 0 && (
                <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Distribución Visual</h3>
                    <div className="flex gap-2 h-8">
                        {Object.entries(resumen.porNivel).map(([nivel, count]) => {
                            const percentage = resumen.total > 0 ? (count / resumen.total) * 100 : 0;
                            if (percentage === 0) return null;
                            return (
                                <div
                                    key={nivel}
                                    className={`${getNivelColor(nivel)} rounded flex items-center justify-center text-white text-sm font-medium`}
                                    style={{ width: `${percentage}%` }}
                                >
                                    {percentage >= 10 && `${Math.round(percentage)}%`}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                        {Object.entries(resumen.porNivel).map(([nivel, count]) => (
                            <div key={nivel} className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded-full ${getNivelColor(nivel)}`}></div>
                                <span className="text-neutral-600">{nivel}: {count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Riesgos List */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200">
                    <h3 className="font-semibold text-neutral-900">Listado de Riesgos</h3>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : riesgos.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        No hay riesgos registrados
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {riesgos.map((riesgo) => (
                            <div key={riesgo.riesgoId} className="p-4 hover:bg-neutral-50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getNivelBadge(riesgo.nivelRiesgoCalculado)}`}>
                                                {riesgo.nivelRiesgoCalculado}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-neutral-900">{riesgo.nombreRiesgo}</h4>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
                                            {riesgo.amenaza && (
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                                    {riesgo.amenaza.tipoAmenaza}: {riesgo.amenaza.nombreAmenaza}
                                                </span>
                                            )}
                                            {riesgo.vulnerabilidad && (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-3.5 h-3.5 text-orange-500" />
                                                    {riesgo.vulnerabilidad.dimensionVulnerabilidad}: {riesgo.vulnerabilidad.nombreVulnerabilidad}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(riesgo.riesgoId)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
