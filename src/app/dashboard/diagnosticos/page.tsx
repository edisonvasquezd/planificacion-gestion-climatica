"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Factory,
    AlertTriangle,
    Target,
    Building2,
    Zap,
    Car,
    Trash2,
    Warehouse,
    Leaf,
    Plus,
    Save,
    X,
    Mountain,
    CloudRain,
    Bug,
    Flame,
    Users,
    Coins,
    HardHat,
    TreePine,
    FileText,
    MapPin,
    Gauge,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Plan {
    planId: string;
    nombrePlan: string;
    tipoPlan: string;
    estadoPlan: string;
}

interface Diagnostico {
    diagnosticoId: string;
    planId: string;
    descripcionGeneral: string;
    inventariosGei: any[];
    amenazas: any[];
    vulnerabilidades: any[];
    activosCriticos: any[];
}

export default function DiagnosticosPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
            <DiagnosticosContent />
        </Suspense>
    );
}

function DiagnosticosContent() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"gei" | "amenazas" | "vulnerabilidades" | "activos">("gei");

    useEffect(() => {
        if (token) {
            fetchPlanes();
        }
    }, [token]);

    useEffect(() => {
        // Auto-select plan from URL parameter
        const planIdFromUrl = searchParams.get("planId");
        if (planIdFromUrl && planes.length > 0) {
            const planExists = planes.find(p => p.planId === planIdFromUrl);
            if (planExists) {
                setSelectedPlan(planIdFromUrl);
            }
        }
    }, [searchParams, planes]);

    useEffect(() => {
        if (selectedPlan && token) {
            fetchDiagnostico(selectedPlan);
        }
    }, [selectedPlan, token]);

    const fetchPlanes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/planes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setPlanes(data.data);
                if (data.data.length > 0) {
                    setSelectedPlan(data.data[0].planId);
                }
            }
        } catch (error) {
            console.error("Error fetching planes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDiagnostico = async (planId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/diagnosticos/${planId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setDiagnostico(data.data);
            }
        } catch (error) {
            console.error("Error fetching diagnostico:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Diagnóstico Territorial
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        Inventario GEI, amenazas, vulnerabilidades y activos críticos
                    </p>
                </div>
            </div>

            {/* Plan Selector */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seleccionar Plan
                </label>
                <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="input-field max-w-md"
                >
                    {planes.map((plan) => (
                        <option key={plan.planId} value={plan.planId}>
                            {plan.nombrePlan} ({plan.tipoPlan})
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-neutral-200">
                <div className="border-b border-neutral-200">
                    <nav className="flex -mb-px">
                        {[
                            { id: "gei", label: "Inventario GEI", icon: Factory },
                            { id: "amenazas", label: "Amenazas", icon: AlertTriangle },
                            { id: "vulnerabilidades", label: "Vulnerabilidades", icon: Target },
                            { id: "activos", label: "Activos Críticos", icon: Building2 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? "border-primary-600 text-primary-600"
                                        : "border-transparent text-neutral-500 hover:text-neutral-700"
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === "gei" && (
                        <InventarioGeiTab
                            diagnosticoId={diagnostico?.diagnosticoId}
                            inventarios={diagnostico?.inventariosGei || []}
                            token={token}
                            onRefresh={() => fetchDiagnostico(selectedPlan)}
                        />
                    )}
                    {activeTab === "amenazas" && (
                        <AmenazasTab
                            diagnosticoId={diagnostico?.diagnosticoId}
                            amenazas={diagnostico?.amenazas || []}
                            token={token}
                            onRefresh={() => fetchDiagnostico(selectedPlan)}
                        />
                    )}
                    {activeTab === "vulnerabilidades" && (
                        <VulnerabilidadesTab
                            diagnosticoId={diagnostico?.diagnosticoId}
                            vulnerabilidades={diagnostico?.vulnerabilidades || []}
                            token={token}
                            onRefresh={() => fetchDiagnostico(selectedPlan)}
                        />
                    )}
                    {activeTab === "activos" && (
                        <ActivosCriticosTab
                            diagnosticoId={diagnostico?.diagnosticoId}
                            activos={diagnostico?.activosCriticos || []}
                            token={token}
                            onRefresh={() => fetchDiagnostico(selectedPlan)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Inventario GEI Tab
// ============================================================================

function InventarioGeiTab({
    diagnosticoId,
    inventarios,
    token,
    onRefresh,
}: {
    diagnosticoId?: string;
    inventarios: any[];
    token: string | null;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        anioLineaBase: new Date().getFullYear() - 1,
        totalTco2eq: 0,
        metodologia: "IPCC 2006",
        fuenteDatos: "",
        energia: 0,
        transporte: 0,
        residuos: 0,
        ippu: 0,
        afolu: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosticoId) return;

        setIsSubmitting(true);
        try {
            const emisionesSectoriales = {
                Energia: formData.energia,
                Transporte: formData.transporte,
                Residuos: formData.residuos,
                IPPU: formData.ippu,
                AFOLU: formData.afolu,
            };

            const total = Object.values(emisionesSectoriales).reduce((a, b) => a + b, 0);

            const res = await fetch(`${API_URL}/api/diagnosticos/${diagnosticoId}/inventario-gei`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    anioLineaBase: formData.anioLineaBase,
                    totalTco2eq: total,
                    emisionesSectoriales,
                    metodologia: formData.metodologia,
                    fuenteDatos: formData.fuenteDatos,
                }),
            });

            if (res.ok) {
                setShowForm(false);
                onRefresh();
            }
        } catch (error) {
            console.error("Error creating inventario:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SECTORES = [
        { key: "energia", label: "Energía", color: "#f59e0b", icon: "⚡" },
        { key: "transporte", label: "Transporte", color: "#3b82f6", icon: "🚗" },
        { key: "residuos", label: "Residuos", color: "#8b5cf6", icon: "🗑️" },
        { key: "ippu", label: "IPPU", color: "#6b7280", icon: "🏭" },
        { key: "afolu", label: "AFOLU", color: "#22c55e", icon: "🌱" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                    Inventario de Gases de Efecto Invernadero
                </h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center gap-2"
                    disabled={!diagnosticoId}
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Inventario
                </button>
            </div>

            {showForm && (
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-4">Registrar Inventario GEI</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Año Línea Base
                                </label>
                                <input
                                    type="number"
                                    value={formData.anioLineaBase}
                                    onChange={(e) =>
                                        setFormData({ ...formData, anioLineaBase: parseInt(e.target.value) })
                                    }
                                    className="input-field"
                                    min="2000"
                                    max="2030"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Metodología
                                </label>
                                <select
                                    value={formData.metodologia}
                                    onChange={(e) => setFormData({ ...formData, metodologia: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="IPCC 2006">IPCC 2006</option>
                                    <option value="GPC">GPC (Global Protocol for Cities)</option>
                                    <option value="ISO 14064">ISO 14064</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Fuente de Datos
                            </label>
                            <input
                                type="text"
                                value={formData.fuenteDatos}
                                onChange={(e) => setFormData({ ...formData, fuenteDatos: e.target.value })}
                                className="input-field"
                                placeholder="Ej: RETC, INE, Ministerio de Energía"
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h5 className="font-medium text-neutral-900 mb-3">
                                Emisiones por Sector (tCO2eq)
                            </h5>
                            <div className="grid grid-cols-5 gap-4">
                                {SECTORES.map((sector) => (
                                    <div key={sector.key}>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            <span className="mr-1">{sector.icon}</span>
                                            {sector.label}
                                        </label>
                                        <input
                                            type="number"
                                            value={formData[sector.key as keyof typeof formData] as number}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    [sector.key]: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="input-field"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-neutral-600">
                                Total: <strong>{(formData.energia + formData.transporte + formData.residuos + formData.ippu + formData.afolu).toLocaleString()} tCO2eq</strong>
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Inventario"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="btn-outline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de inventarios */}
            {inventarios.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <p className="text-4xl mb-2">🏭</p>
                    <p>No hay inventarios GEI registrados</p>
                    <p className="text-sm">Crea el primer inventario para este plan</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inventarios.map((inv) => {
                        const emisiones = typeof inv.emisionesSectoriales === "string"
                            ? JSON.parse(inv.emisionesSectoriales)
                            : inv.emisionesSectoriales;
                        return (
                            <div key={inv.inventarioId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-semibold">Año Base: {inv.anioLineaBase}</h4>
                                        <p className="text-sm text-neutral-600">
                                            Metodología: {inv.metodologia}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary-600">
                                            {inv.totalTco2eq?.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-neutral-600">tCO2eq totales</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {SECTORES.map((sector) => (
                                        <div
                                            key={sector.key}
                                            className="bg-neutral-50 rounded p-2 text-center"
                                        >
                                            <p className="text-xs text-neutral-600">{sector.icon} {sector.label}</p>
                                            <p className="font-semibold" style={{ color: sector.color }}>
                                                {(emisiones?.[sector.label] || emisiones?.[sector.key.charAt(0).toUpperCase() + sector.key.slice(1)] || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Amenazas Tab
// ============================================================================

function AmenazasTab({
    diagnosticoId,
    amenazas,
    token,
    onRefresh,
}: {
    diagnosticoId?: string;
    amenazas: any[];
    token: string | null;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tipoAmenaza: "Hidrometeorológica",
        nombreAmenaza: "",
        descripcionAmenaza: "",
        probabilidad: 0.5,
        intensidad: 0.5,
        fuenteDatos: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const TIPOS_AMENAZA = [
        { value: "Geofísica", label: "Geofísica", desc: "Sismos, tsunamis, volcanes", icon: "🌋" },
        { value: "Hidrometeorológica", label: "Hidrometeorológica", desc: "Inundaciones, sequías, tormentas", icon: "🌊" },
        { value: "Biológica", label: "Biológica", desc: "Plagas, epidemias", icon: "🦠" },
        { value: "Antrópica", label: "Antrópica", desc: "Incendios, contaminación", icon: "🔥" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosticoId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/diagnosticos/${diagnosticoId}/amenazas`, {
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
                    tipoAmenaza: "Hidrometeorológica",
                    nombreAmenaza: "",
                    descripcionAmenaza: "",
                    probabilidad: 0.5,
                    intensidad: 0.5,
                    fuenteDatos: "",
                });
                onRefresh();
            }
        } catch (error) {
            console.error("Error creating amenaza:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getNivelColor = (valor: number) => {
        if (valor < 0.3) return "bg-green-100 text-green-800";
        if (valor < 0.6) return "bg-yellow-100 text-yellow-800";
        if (valor < 0.8) return "bg-orange-100 text-orange-800";
        return "bg-red-100 text-red-800";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                    Registro de Amenazas
                </h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                    disabled={!diagnosticoId}
                >
                    + Nueva Amenaza
                </button>
            </div>

            {showForm && (
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-4">Registrar Amenaza</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Tipo de Amenaza
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {TIPOS_AMENAZA.map((tipo) => (
                                    <button
                                        key={tipo.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipoAmenaza: tipo.value })}
                                        className={`p-3 rounded-lg border text-left transition-colors ${
                                            formData.tipoAmenaza === tipo.value
                                                ? "border-primary-500 bg-primary-50"
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        <span className="text-xl">{tipo.icon}</span>
                                        <p className="font-medium text-sm mt-1">{tipo.label}</p>
                                        <p className="text-xs text-neutral-500">{tipo.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre de la Amenaza
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombreAmenaza}
                                    onChange={(e) => setFormData({ ...formData, nombreAmenaza: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Inundación fluvial río Mapocho"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Fuente de Datos
                                </label>
                                <input
                                    type="text"
                                    value={formData.fuenteDatos}
                                    onChange={(e) => setFormData({ ...formData, fuenteDatos: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: SENAPRED, SHOA, SERNAGEOMIN"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcionAmenaza}
                                onChange={(e) => setFormData({ ...formData, descripcionAmenaza: e.target.value })}
                                className="input-field"
                                rows={3}
                                placeholder="Describe las características de la amenaza..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Probabilidad (0-1)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={formData.probabilidad}
                                    onChange={(e) => setFormData({ ...formData, probabilidad: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-neutral-500">
                                    <span>Baja</span>
                                    <span className="font-medium">{formData.probabilidad}</span>
                                    <span>Alta</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Intensidad (0-1)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={formData.intensidad}
                                    onChange={(e) => setFormData({ ...formData, intensidad: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-neutral-500">
                                    <span>Baja</span>
                                    <span className="font-medium">{formData.intensidad}</span>
                                    <span>Alta</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Amenaza"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de amenazas */}
            {amenazas.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <p className="text-4xl mb-2">⚠️</p>
                    <p>No hay amenazas registradas</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {amenazas.map((amenaza) => {
                        const tipoInfo = TIPOS_AMENAZA.find((t) => t.value === amenaza.tipoAmenaza);
                        return (
                            <div key={amenaza.amenazaId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <span className="text-3xl">{tipoInfo?.icon || "⚠️"}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{amenaza.nombreAmenaza}</h4>
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-700">
                                                {amenaza.tipoAmenaza}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-2">
                                            {amenaza.descripcionAmenaza || "Sin descripción"}
                                        </p>
                                        <div className="flex gap-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded ${getNivelColor(amenaza.probabilidad || 0)}`}>
                                                Prob: {((amenaza.probabilidad || 0) * 100).toFixed(0)}%
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${getNivelColor(amenaza.intensidad || 0)}`}>
                                                Intens: {((amenaza.intensidad || 0) * 100).toFixed(0)}%
                                            </span>
                                            {amenaza.fuenteDatos && (
                                                <span className="text-neutral-500">
                                                    Fuente: {amenaza.fuenteDatos}
                                                </span>
                                            )}
                                        </div>
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

// ============================================================================
// Vulnerabilidades Tab
// ============================================================================

function VulnerabilidadesTab({
    diagnosticoId,
    vulnerabilidades,
    token,
    onRefresh,
}: {
    diagnosticoId?: string;
    vulnerabilidades: any[];
    token: string | null;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        dimensionVulnerabilidad: "Social",
        nombreVulnerabilidad: "",
        descripcion: "",
        indiceVulnerabilidad: 0.5,
        poblacionAfectada: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const DIMENSIONES = [
        { value: "Social", icon: "👥", color: "#3b82f6" },
        { value: "Económica", icon: "💰", color: "#f59e0b" },
        { value: "Infraestructural", icon: "🏗️", color: "#6b7280" },
        { value: "Ecosistémica", icon: "🌿", color: "#22c55e" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosticoId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/diagnosticos/${diagnosticoId}/vulnerabilidades`, {
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
                    dimensionVulnerabilidad: "Social",
                    nombreVulnerabilidad: "",
                    descripcion: "",
                    indiceVulnerabilidad: 0.5,
                    poblacionAfectada: "",
                });
                onRefresh();
            }
        } catch (error) {
            console.error("Error creating vulnerabilidad:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                    Análisis de Vulnerabilidades
                </h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                    disabled={!diagnosticoId}
                >
                    + Nueva Vulnerabilidad
                </button>
            </div>

            {showForm && (
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-4">Registrar Vulnerabilidad</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Dimensión
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {DIMENSIONES.map((dim) => (
                                    <button
                                        key={dim.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, dimensionVulnerabilidad: dim.value })}
                                        className={`p-3 rounded-lg border text-center transition-colors ${
                                            formData.dimensionVulnerabilidad === dim.value
                                                ? "border-primary-500 bg-primary-50"
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        <span className="text-2xl">{dim.icon}</span>
                                        <p className="font-medium text-sm mt-1">{dim.value}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre de la Vulnerabilidad
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombreVulnerabilidad}
                                    onChange={(e) => setFormData({ ...formData, nombreVulnerabilidad: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Viviendas en zonas de riesgo"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Población Afectada
                                </label>
                                <input
                                    type="text"
                                    value={formData.poblacionAfectada}
                                    onChange={(e) => setFormData({ ...formData, poblacionAfectada: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: 5,000 habitantes"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="input-field"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Índice de Vulnerabilidad (0-1)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={formData.indiceVulnerabilidad}
                                onChange={(e) => setFormData({ ...formData, indiceVulnerabilidad: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>Bajo</span>
                                <span className="font-medium">{formData.indiceVulnerabilidad}</span>
                                <span>Alto</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Vulnerabilidad"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista */}
            {vulnerabilidades.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <p className="text-4xl mb-2">🎯</p>
                    <p>No hay vulnerabilidades registradas</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {vulnerabilidades.map((vuln) => {
                        const dimInfo = DIMENSIONES.find((d) => d.value === vuln.dimensionVulnerabilidad);
                        return (
                            <div key={vuln.vulnerabilidadId} className="border rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-3xl">{dimInfo?.icon || "🎯"}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{vuln.nombreVulnerabilidad}</h4>
                                            <span
                                                className="px-2 py-0.5 text-xs rounded-full text-white"
                                                style={{ backgroundColor: dimInfo?.color }}
                                            >
                                                {vuln.dimensionVulnerabilidad}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-600 mb-2">{vuln.descripcion}</p>
                                        <div className="flex gap-4 text-sm">
                                            <span>Índice: <strong>{vuln.indiceVulnerabilidad}</strong></span>
                                            {vuln.poblacionAfectada && (
                                                <span>Población: {vuln.poblacionAfectada}</span>
                                            )}
                                        </div>
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

// ============================================================================
// Activos Críticos Tab
// ============================================================================

function ActivosCriticosTab({
    diagnosticoId,
    activos,
    token,
    onRefresh,
}: {
    diagnosticoId?: string;
    activos: any[];
    token: string | null;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        nombreActivo: "",
        tipoActivo: "Infraestructura Sanitaria",
        descripcion: "",
        ubicacion: "",
        capacidad: "",
        criticidad: "Alta",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const TIPOS_ACTIVO = [
        "Infraestructura Sanitaria",
        "Infraestructura Educacional",
        "Infraestructura de Salud",
        "Red Vial",
        "Red Eléctrica",
        "Red de Agua Potable",
        "Patrimonio Cultural",
        "Área Verde",
        "Otro",
    ];

    const CRITICIDADES = [
        { value: "Crítica", color: "bg-red-100 text-red-800" },
        { value: "Alta", color: "bg-orange-100 text-orange-800" },
        { value: "Media", color: "bg-yellow-100 text-yellow-800" },
        { value: "Baja", color: "bg-green-100 text-green-800" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosticoId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/diagnosticos/${diagnosticoId}/activos-criticos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    ubicacion: formData.ubicacion || JSON.stringify({ type: "Point", coordinates: [0, 0] }),
                }),
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({
                    nombreActivo: "",
                    tipoActivo: "Infraestructura Sanitaria",
                    descripcion: "",
                    ubicacion: "",
                    capacidad: "",
                    criticidad: "Alta",
                });
                onRefresh();
            }
        } catch (error) {
            console.error("Error creating activo:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                    Activos Críticos del Territorio
                </h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary"
                    disabled={!diagnosticoId}
                >
                    + Nuevo Activo
                </button>
            </div>

            {showForm && (
                <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-4">Registrar Activo Crítico</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre del Activo
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombreActivo}
                                    onChange={(e) => setFormData({ ...formData, nombreActivo: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Hospital Regional"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tipo de Activo
                                </label>
                                <select
                                    value={formData.tipoActivo}
                                    onChange={(e) => setFormData({ ...formData, tipoActivo: e.target.value })}
                                    className="input-field"
                                >
                                    {TIPOS_ACTIVO.map((tipo) => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="input-field"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Ubicación (dirección)
                                </label>
                                <input
                                    type="text"
                                    value={formData.ubicacion}
                                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                    className="input-field"
                                    placeholder="Av. Principal 123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Capacidad
                                </label>
                                <input
                                    type="text"
                                    value={formData.capacidad}
                                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: 500 camas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nivel de Criticidad
                                </label>
                                <select
                                    value={formData.criticidad}
                                    onChange={(e) => setFormData({ ...formData, criticidad: e.target.value })}
                                    className="input-field"
                                >
                                    {CRITICIDADES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Activo"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista */}
            {activos.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <p className="text-4xl mb-2">🏗️</p>
                    <p>No hay activos críticos registrados</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {activos.map((activo) => {
                        const critInfo = CRITICIDADES.find((c) => c.value === activo.criticidad);
                        return (
                            <div key={activo.activoId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold">{activo.nombreActivo}</h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${critInfo?.color}`}>
                                        {activo.criticidad}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-500 mb-2">{activo.tipoActivo}</p>
                                <p className="text-sm text-neutral-600">{activo.descripcion}</p>
                                {activo.capacidad && (
                                    <p className="text-sm text-neutral-500 mt-2">
                                        Capacidad: {activo.capacidad}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
