"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, Plus, Trash2, TrendingUp, Activity, Target, Clock, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Indicador {
    indicadorId: string;
    nombreIndicador: string;
    tipoIndicador: string;
    unidadMedida: string;
    lineaBase: number;
    meta: number;
    frecuenciaMedicion: string;
    accion?: { nombreAccion: string };
    mediciones?: { valorMedido: number; fechaMedicion: string }[];
}

interface Accion {
    accionId: string;
    nombreAccion: string;
}

interface Resumen {
    totalIndicadores: number;
    porTipo: Record<string, number>;
    conMediciones: number;
    sinMediciones: number;
    promedioAvance: number;
}

export default function IndicadoresPage() {
    const { token, user } = useAuth();
    const [indicadores, setIndicadores] = useState<Indicador[]>([]);
    const [acciones, setAcciones] = useState<Accion[]>([]);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showMedicionForm, setShowMedicionForm] = useState(false);
    const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null);

    const [formData, setFormData] = useState({
        accionId: "",
        nombreIndicador: "",
        tipoIndicador: "Impacto PACCC-Mitigación",
        unidadMedida: "",
        lineaBase: 0,
        meta: 0,
        frecuenciaMedicion: "Anual",
        fuenteVerificacion: "",
    });

    const [medicionData, setMedicionData] = useState({
        indicadorId: "",
        fechaMedicion: new Date().toISOString().split("T")[0],
        valorMedido: 0,
        observaciones: "",
        evidenciaUrl: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchIndicadores();
        fetchResumen();
        fetchAcciones();
    }, [token]);

    const fetchIndicadores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/indicadores`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setIndicadores(data || []);
        } catch (error) {
            console.error("Error fetching indicadores:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchResumen = async () => {
        try {
            const response = await fetch(`${API_URL}/api/indicadores/resumen/general`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setResumen(data);
        } catch (error) {
            console.error("Error fetching resumen:", error);
        }
    };

    const fetchAcciones = async () => {
        try {
            const res = await fetch(`${API_URL}/api/acciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setAcciones(data.data);
        } catch (error) {
            console.error("Error fetching acciones:", error);
        }
    };

    const handleCreateIndicador = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/api/indicadores`, {
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
                    accionId: "",
                    nombreIndicador: "",
                    tipoIndicador: "Impacto PACCC-Mitigación",
                    unidadMedida: "",
                    lineaBase: 0,
                    meta: 0,
                    frecuenciaMedicion: "Anual",
                    fuenteVerificacion: "",
                });
                fetchIndicadores();
                fetchResumen();
            }
        } catch (error) {
            console.error("Error creating indicador:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateMedicion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/api/indicadores/${medicionData.indicadorId}/mediciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fechaMedicion: medicionData.fechaMedicion,
                    valorMedido: medicionData.valorMedido,
                    observaciones: medicionData.observaciones,
                    evidenciaUrl: medicionData.evidenciaUrl,
                    registradoPor: user?.id,
                }),
            });

            if (res.ok) {
                setShowMedicionForm(false);
                setMedicionData({
                    indicadorId: "",
                    fechaMedicion: new Date().toISOString().split("T")[0],
                    valorMedido: 0,
                    observaciones: "",
                    evidenciaUrl: "",
                });
                setSelectedIndicador(null);
                fetchIndicadores();
                fetchResumen();
            }
        } catch (error) {
            console.error("Error creating medicion:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (indicadorId: string) => {
        if (!confirm("¿Eliminar este indicador y todas sus mediciones?")) return;

        try {
            await fetch(`${API_URL}/api/indicadores/${indicadorId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchIndicadores();
            fetchResumen();
        } catch (error) {
            console.error("Error deleting indicador:", error);
        }
    };

    const openMedicionForm = (indicador: Indicador) => {
        setSelectedIndicador(indicador);
        setMedicionData({
            ...medicionData,
            indicadorId: indicador.indicadorId,
        });
        setShowMedicionForm(true);
    };

    const calcularAvance = (indicador: Indicador) => {
        const ultimaMedicion = indicador.mediciones?.[0];
        if (!ultimaMedicion) return 0;
        if (indicador.meta === indicador.lineaBase) return 100;
        const avance = ((ultimaMedicion.valorMedido - indicador.lineaBase) /
            (indicador.meta - indicador.lineaBase)) * 100;
        return Math.min(Math.max(avance, 0), 150);
    };

    const getTipoColor = (tipo: string) => {
        if (tipo.includes("Mitigación")) return "bg-blue-100 text-blue-700";
        if (tipo.includes("Adaptación")) return "bg-teal-100 text-teal-700";
        if (tipo.includes("Reducción")) return "bg-orange-100 text-orange-700";
        if (tipo.includes("Biodiversidad")) return "bg-green-100 text-green-700";
        if (tipo.includes("Social")) return "bg-pink-100 text-pink-700";
        return "bg-gray-100 text-gray-700";
    };

    const TIPOS_INDICADOR = [
        "Impacto PACCC-Mitigación",
        "Impacto PACCC-Adaptación",
        "Impacto PGRD-Reducción de Riesgo",
        "Co-beneficio Biodiversidad",
        "Co-beneficio Social",
        "Gestión",
    ];

    const FRECUENCIAS = ["Mensual", "Trimestral", "Semestral", "Anual"];

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Monitoreo y Evaluación
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Indicadores de impacto y co-beneficios
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowForm(true)} className="btn-primary">
                        + Nuevo Indicador
                    </button>
                    <button
                        onClick={() => setShowMedicionForm(true)}
                        className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
                    >
                        + Registrar Medición
                    </button>
                </div>
            </div>

            {/* Form Nuevo Indicador */}
            {showForm && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Crear Nuevo Indicador</h3>
                    <form onSubmit={handleCreateIndicador} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre del Indicador *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombreIndicador}
                                    onChange={(e) => setFormData({ ...formData, nombreIndicador: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Reducción de emisiones de CO2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Acción Relacionada *
                                </label>
                                <select
                                    value={formData.accionId}
                                    onChange={(e) => setFormData({ ...formData, accionId: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seleccionar acción...</option>
                                    {acciones.map((a) => (
                                        <option key={a.accionId} value={a.accionId}>
                                            {a.nombreAccion}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tipo de Indicador
                                </label>
                                <select
                                    value={formData.tipoIndicador}
                                    onChange={(e) => setFormData({ ...formData, tipoIndicador: e.target.value })}
                                    className="input-field"
                                >
                                    {TIPOS_INDICADOR.map((tipo) => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Unidad de Medida *
                                </label>
                                <input
                                    type="text"
                                    value={formData.unidadMedida}
                                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: tCO2eq, %, m2, personas"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Frecuencia de Medición
                                </label>
                                <select
                                    value={formData.frecuenciaMedicion}
                                    onChange={(e) => setFormData({ ...formData, frecuenciaMedicion: e.target.value })}
                                    className="input-field"
                                >
                                    {FRECUENCIAS.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Línea Base *
                                </label>
                                <input
                                    type="number"
                                    value={formData.lineaBase}
                                    onChange={(e) => setFormData({ ...formData, lineaBase: parseFloat(e.target.value) || 0 })}
                                    className="input-field"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Meta *
                                </label>
                                <input
                                    type="number"
                                    value={formData.meta}
                                    onChange={(e) => setFormData({ ...formData, meta: parseFloat(e.target.value) || 0 })}
                                    className="input-field"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Fuente de Verificación
                            </label>
                            <input
                                type="text"
                                value={formData.fuenteVerificacion}
                                onChange={(e) => setFormData({ ...formData, fuenteVerificacion: e.target.value })}
                                className="input-field"
                                placeholder="Ej: Informe anual de emisiones, Reporte de beneficiarios"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Crear Indicador"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Form Nueva Medición */}
            {showMedicionForm && (
                <div className="bg-secondary-50 rounded-xl border border-secondary-200 p-6 mb-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Registrar Nueva Medición</h3>
                    <form onSubmit={handleCreateMedicion} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Indicador *
                                </label>
                                <select
                                    value={medicionData.indicadorId}
                                    onChange={(e) => {
                                        setMedicionData({ ...medicionData, indicadorId: e.target.value });
                                        const ind = indicadores.find(i => i.indicadorId === e.target.value);
                                        setSelectedIndicador(ind || null);
                                    }}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Seleccionar indicador...</option>
                                    {indicadores.map((ind) => (
                                        <option key={ind.indicadorId} value={ind.indicadorId}>
                                            {ind.nombreIndicador} ({ind.unidadMedida})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Fecha de Medición *
                                </label>
                                <input
                                    type="date"
                                    value={medicionData.fechaMedicion}
                                    onChange={(e) => setMedicionData({ ...medicionData, fechaMedicion: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        {selectedIndicador && (
                            <div className="bg-white rounded-lg p-3 border">
                                <p className="text-sm text-neutral-600">
                                    Línea Base: <strong>{selectedIndicador.lineaBase}</strong> |
                                    Meta: <strong>{selectedIndicador.meta}</strong> {selectedIndicador.unidadMedida}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Valor Medido *
                                </label>
                                <input
                                    type="number"
                                    value={medicionData.valorMedido}
                                    onChange={(e) => setMedicionData({ ...medicionData, valorMedido: parseFloat(e.target.value) || 0 })}
                                    className="input-field"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    URL Evidencia
                                </label>
                                <input
                                    type="url"
                                    value={medicionData.evidenciaUrl}
                                    onChange={(e) => setMedicionData({ ...medicionData, evidenciaUrl: e.target.value })}
                                    className="input-field"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Observaciones
                            </label>
                            <textarea
                                value={medicionData.observaciones}
                                onChange={(e) => setMedicionData({ ...medicionData, observaciones: e.target.value })}
                                className="input-field"
                                rows={2}
                                placeholder="Notas sobre la medición..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Registrar Medición"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMedicionForm(false);
                                    setSelectedIndicador(null);
                                }}
                                className="btn-outline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Resumen */}
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Total Indicadores</p>
                        <p className="text-2xl font-bold text-neutral-900">{resumen.totalIndicadores}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Con Mediciones</p>
                        <p className="text-2xl font-bold text-green-600">{resumen.conMediciones}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Sin Mediciones</p>
                        <p className="text-2xl font-bold text-orange-600">{resumen.sinMediciones}</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-4 text-white">
                        <p className="text-sm opacity-90">Avance Promedio</p>
                        <p className="text-2xl font-bold">{resumen.promedioAvance}%</p>
                    </div>
                </div>
            )}

            {/* Indicadores List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : indicadores.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                    <div className="flex justify-center mb-3">
                        <BarChart3 className="w-12 h-12 text-neutral-300" />
                    </div>
                    <p className="text-neutral-500">No hay indicadores registrados</p>
                    <p className="text-sm text-neutral-400">Crea tu primer indicador para comenzar el monitoreo</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {indicadores.map((indicador) => {
                        const avance = calcularAvance(indicador);
                        const ultimaMedicion = indicador.mediciones?.[0];

                        return (
                            <div
                                key={indicador.indicadorId}
                                className="bg-white rounded-xl p-5 shadow-sm border border-neutral-200"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(indicador.tipoIndicador)}`}>
                                                {indicador.tipoIndicador}
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                                {indicador.frecuenciaMedicion}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-neutral-900">{indicador.nombreIndicador}</h3>
                                        {indicador.accion && (
                                            <p className="text-sm text-neutral-500 mt-1">
                                                Acción: {indicador.accion.nombreAccion}
                                            </p>
                                        )}
                                    </div>

                                    <div className="lg:w-64">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-neutral-500">
                                                {ultimaMedicion ? ultimaMedicion.valorMedido : indicador.lineaBase} / {indicador.meta} {indicador.unidadMedida}
                                            </span>
                                            <span className="font-medium text-neutral-900">{avance.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${avance >= 100 ? "bg-green-500" : avance >= 50 ? "bg-primary-500" : "bg-orange-500"}`}
                                                style={{ width: `${Math.min(avance, 100)}%` }}
                                            />
                                        </div>
                                        {ultimaMedicion && (
                                            <p className="text-xs text-neutral-400 mt-1">
                                                Última: {new Date(ultimaMedicion.fechaMedicion).toLocaleDateString("es-CL")}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openMedicionForm(indicador)}
                                            className="px-3 py-1.5 text-sm bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200"
                                        >
                                            + Medición
                                        </button>
                                        <button
                                            onClick={() => handleDelete(indicador.indicadorId)}
                                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
