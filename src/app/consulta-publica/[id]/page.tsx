"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Globe,
    ArrowLeft,
    Calendar,
    MapPin,
    Building2,
    FileText,
    AlertTriangle,
    Shield,
    Target,
    Zap,
    Users,
    MessageSquare,
    Send,
    CheckCircle2,
    Clock,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ConsultaDetalle {
    consultaId: string;
    planId: string;
    fechaInicio: string;
    fechaFin: string;
    estadoConsulta: string;
    totalObservaciones: number;
    diasRestantes: number;
    estaActiva: boolean;
    plan: {
        planId: string;
        nombrePlan: string;
        tipoPlan: string;
        version: string;
        responsablePlan: string;
        organizacion: {
            nombre: string;
            region: string;
            provincia: string;
        };
        diagnosticos: Array<{
            diagnosticoId: string;
            descripcionGeneral: string;
            inventariosGei: Array<{
                anioLineaBase: number;
                totalTco2eq: number;
                emisionesSectoriales: string;
            }>;
            amenazas: Array<{
                amenazaId: string;
                tipoAmenaza: string;
                nombreAmenaza: string;
                descripcionAmenaza: string;
                probabilidad: number;
                intensidad: number;
            }>;
            vulnerabilidades: Array<{
                vulnerabilidadId: string;
                dimensionVulnerabilidad: string;
                nombreVulnerabilidad: string;
                descripcion: string;
                indiceVulnerabilidad: number;
            }>;
            activosCriticos: Array<{
                activoId: string;
                nombreActivo: string;
                tipoActivo: string;
                criticidad: string;
            }>;
        }>;
    };
}

interface Observacion {
    observacionId: string;
    seccionPlan: string;
    contenidoObservacion: string;
    propuestaCiudadana: string;
    estadoObservacion: string;
    respuestaOrganizacion: string;
    createdAt: string;
}

const SECCIONES_PLAN = [
    "Información General",
    "Diagnóstico - Inventario GEI",
    "Diagnóstico - Amenazas",
    "Diagnóstico - Vulnerabilidades",
    "Diagnóstico - Activos Críticos",
    "Evaluación de Riesgos",
    "Cartera de Acciones",
    "Gobernanza",
    "Otro",
];

export default function ConsultaDetallePage() {
    const params = useParams();
    const router = useRouter();
    const consultaId = params.id as string;

    const [consulta, setConsulta] = useState<ConsultaDetalle | null>(null);
    const [misObservaciones, setMisObservaciones] = useState<Observacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        info: true,
        gei: false,
        amenazas: false,
        vulnerabilidades: false,
        activos: false,
    });

    // Observation form
    const [showObsForm, setShowObsForm] = useState(false);
    const [obsForm, setObsForm] = useState({
        seccionPlan: "",
        contenidoObservacion: "",
        propuestaCiudadana: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchConsulta();
    }, [consultaId]);

    const checkAuth = () => {
        const token = localStorage.getItem("auth_token");
        setIsAuthenticated(!!token);
        if (token) {
            fetchMisObservaciones();
        }
    };

    const fetchConsulta = async () => {
        try {
            const response = await fetch(`${API_URL}/api/participacion/consultas/${consultaId}`);
            const { data } = await response.json();
            setConsulta(data);
        } catch (error) {
            console.error("Error fetching consulta:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMisObservaciones = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/participacion/mis-observaciones`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            // Filter for this plan
            const filtered = data?.filter((o: any) => o.planId === consulta?.planId) || [];
            setMisObservaciones(filtered);
        } catch (error) {
            console.error("Error fetching observaciones:", error);
        }
    };

    const handleSubmitObservacion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            router.push(`/consulta-publica/registro?redirect=/consulta-publica/${consultaId}`);
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/participacion/observaciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planId: consulta?.planId,
                    ...obsForm,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al enviar observación");
            }

            setSubmitSuccess(true);
            setObsForm({ seccionPlan: "", contenidoObservacion: "", propuestaCiudadana: "" });
            fetchMisObservaciones();
            fetchConsulta(); // Refresh counter

            setTimeout(() => {
                setSubmitSuccess(false);
                setShowObsForm(false);
            }, 3000);
        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Cargando consulta...</p>
                </div>
            </div>
        );
    }

    if (!consulta) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Consulta no encontrada</h2>
                    <Link href="/consulta-publica" className="text-primary-600 hover:underline">
                        Volver a consultas
                    </Link>
                </div>
            </div>
        );
    }

    const plan = consulta.plan;
    const diagnostico = plan.diagnosticos?.[0];

    return (
        <main className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/consulta-publica" className="flex items-center gap-2 text-neutral-600 hover:text-primary-600">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver a Consultas</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2">
                        <Globe className="w-6 h-6 text-primary-600" />
                        <span className="font-bold text-primary-600">RESILIAI</span>
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            plan.tipoPlan === "PACCC" ? "bg-white/20" : "bg-orange-400/30"
                        }`}>
                            {plan.tipoPlan}
                        </span>
                        {consulta.estaActiva ? (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-400/30">
                                {consulta.diasRestantes} días restantes
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-400/30">
                                Consulta finalizada
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{plan.nombrePlan}</h1>
                    <p className="opacity-90 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {plan.organizacion.nombre}, {plan.organizacion.region}
                    </p>
                    <div className="flex items-center gap-6 mt-4 text-sm opacity-80">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(consulta.fechaInicio).toLocaleDateString("es-CL")} - {new Date(consulta.fechaFin).toLocaleDateString("es-CL")}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {consulta.totalObservaciones} observaciones
                        </span>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - Plan Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Info Section */}
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <button
                                onClick={() => toggleSection("info")}
                                className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
                            >
                                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                    Información General
                                </h2>
                                {expandedSections.info ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            {expandedSections.info && (
                                <div className="p-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-neutral-500">Tipo de Plan</p>
                                            <p className="font-medium">{plan.tipoPlan === "PACCC" ? "Plan de Acción Comunal de Cambio Climático" : "Plan de Gestión de Riesgo de Desastres"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">Versión</p>
                                            <p className="font-medium">{plan.version}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">Responsable</p>
                                            <p className="font-medium">{plan.responsablePlan}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">Ubicación</p>
                                            <p className="font-medium">{plan.organizacion.provincia}, {plan.organizacion.region}</p>
                                        </div>
                                    </div>
                                    {diagnostico?.descripcionGeneral && (
                                        <div>
                                            <p className="text-sm text-neutral-500 mb-1">Descripción del Diagnóstico</p>
                                            <p className="text-neutral-700">{diagnostico.descripcionGeneral}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* GEI Section */}
                        {diagnostico?.inventariosGei?.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection("gei")}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-600" />
                                        Inventario de Emisiones GEI
                                    </h2>
                                    {expandedSections.gei ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedSections.gei && (
                                    <div className="p-6">
                                        {diagnostico.inventariosGei.map((inv, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-amber-700">Año Base: {inv.anioLineaBase}</p>
                                                        <p className="text-2xl font-bold text-amber-900">{inv.totalTco2eq.toLocaleString()} tCO2eq</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Amenazas Section */}
                        {diagnostico?.amenazas?.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection("amenazas")}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        Amenazas Identificadas ({diagnostico.amenazas.length})
                                    </h2>
                                    {expandedSections.amenazas ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedSections.amenazas && (
                                    <div className="p-6 space-y-4">
                                        {diagnostico.amenazas.map((amenaza) => (
                                            <div key={amenaza.amenazaId} className="p-4 bg-red-50 rounded-lg border border-red-100">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="text-xs text-red-600 uppercase">{amenaza.tipoAmenaza}</span>
                                                        <h4 className="font-semibold text-red-900">{amenaza.nombreAmenaza}</h4>
                                                    </div>
                                                </div>
                                                {amenaza.descripcionAmenaza && (
                                                    <p className="text-sm text-red-800">{amenaza.descripcionAmenaza}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Vulnerabilidades Section */}
                        {diagnostico?.vulnerabilidades?.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection("vulnerabilidades")}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-orange-600" />
                                        Vulnerabilidades ({diagnostico.vulnerabilidades.length})
                                    </h2>
                                    {expandedSections.vulnerabilidades ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedSections.vulnerabilidades && (
                                    <div className="p-6 space-y-4">
                                        {diagnostico.vulnerabilidades.map((vuln) => (
                                            <div key={vuln.vulnerabilidadId} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                                <span className="text-xs text-orange-600 uppercase">{vuln.dimensionVulnerabilidad}</span>
                                                <h4 className="font-semibold text-orange-900">{vuln.nombreVulnerabilidad}</h4>
                                                {vuln.descripcion && (
                                                    <p className="text-sm text-orange-800 mt-1">{vuln.descripcion}</p>
                                                )}
                                                <div className="mt-2">
                                                    <span className="text-xs text-orange-700">Índice: {vuln.indiceVulnerabilidad}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activos Críticos Section */}
                        {diagnostico?.activosCriticos?.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection("activos")}
                                    className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                >
                                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        Activos Críticos ({diagnostico.activosCriticos.length})
                                    </h2>
                                    {expandedSections.activos ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedSections.activos && (
                                    <div className="p-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {diagnostico.activosCriticos.map((activo) => (
                                                <div key={activo.activoId} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                    <span className="text-xs text-blue-600 uppercase">{activo.tipoActivo}</span>
                                                    <h4 className="font-semibold text-blue-900">{activo.nombreActivo}</h4>
                                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                                                        activo.criticidad === "Alta" ? "bg-red-100 text-red-700" :
                                                        activo.criticidad === "Media" ? "bg-amber-100 text-amber-700" :
                                                        "bg-green-100 text-green-700"
                                                    }`}>
                                                        Criticidad: {activo.criticidad}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Observations */}
                    <div className="space-y-6">
                        {/* Submit Observation CTA */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-6">
                            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-secondary-600" />
                                Enviar Observación
                            </h3>

                            {!consulta.estaActiva ? (
                                <div className="p-4 bg-neutral-100 rounded-lg text-center">
                                    <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-neutral-600 text-sm">El período de consulta ha finalizado</p>
                                </div>
                            ) : !isAuthenticated ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-neutral-600">
                                        Para enviar una observación debes registrarte o iniciar sesión.
                                    </p>
                                    <Link
                                        href={`/consulta-publica/registro?redirect=/consulta-publica/${consultaId}`}
                                        className="block w-full py-3 bg-secondary-600 text-white rounded-lg font-medium text-center hover:bg-secondary-700 transition-colors"
                                    >
                                        Registrarse para Participar
                                    </Link>
                                    <Link
                                        href={`/auth/login?redirect=/consulta-publica/${consultaId}`}
                                        className="block w-full py-2 text-center text-secondary-600 hover:underline text-sm"
                                    >
                                        Ya tengo cuenta
                                    </Link>
                                </div>
                            ) : submitSuccess ? (
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-green-700 font-medium">Observación enviada exitosamente</p>
                                </div>
                            ) : showObsForm ? (
                                <form onSubmit={handleSubmitObservacion} className="space-y-4">
                                    {submitError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {submitError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Sección del Plan *
                                        </label>
                                        <select
                                            required
                                            value={obsForm.seccionPlan}
                                            onChange={(e) => setObsForm({ ...obsForm, seccionPlan: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 text-sm"
                                        >
                                            <option value="">Seleccione...</option>
                                            {SECCIONES_PLAN.map((seccion) => (
                                                <option key={seccion} value={seccion}>{seccion}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Observación *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={obsForm.contenidoObservacion}
                                            onChange={(e) => setObsForm({ ...obsForm, contenidoObservacion: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 text-sm"
                                            placeholder="Describa su observación..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Propuesta (opcional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={obsForm.propuestaCiudadana}
                                            onChange={(e) => setObsForm({ ...obsForm, propuestaCiudadana: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 text-sm"
                                            placeholder="¿Tiene alguna propuesta alternativa?"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowObsForm(false)}
                                            className="flex-1 py-2 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-50 text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? "Enviando..." : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Enviar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowObsForm(true)}
                                    className="w-full py-3 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Escribir Observación
                                </button>
                            )}
                        </div>

                        {/* My Observations */}
                        {isAuthenticated && misObservaciones.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 p-6">
                                <h3 className="font-semibold text-neutral-900 mb-4">
                                    Mis Observaciones ({misObservaciones.length})
                                </h3>
                                <div className="space-y-3">
                                    {misObservaciones.map((obs) => (
                                        <div key={obs.observacionId} className="p-3 bg-neutral-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-neutral-500">{obs.seccionPlan}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    obs.estadoObservacion === "Recibida" ? "bg-blue-100 text-blue-700" :
                                                    obs.estadoObservacion === "En análisis" ? "bg-amber-100 text-amber-700" :
                                                    obs.estadoObservacion === "Incorporada" ? "bg-green-100 text-green-700" :
                                                    "bg-neutral-100 text-neutral-600"
                                                }`}>
                                                    {obs.estadoObservacion}
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-700 line-clamp-2">{obs.contenidoObservacion}</p>
                                            {obs.respuestaOrganizacion && (
                                                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                                                    <strong>Respuesta:</strong> {obs.respuestaOrganizacion}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                            <h4 className="font-semibold text-blue-900 mb-2">Sobre la Consulta Pública</h4>
                            <p className="text-sm text-blue-700">
                                Según la Ley 21.455, todas las observaciones deben ser respondidas con justificación.
                                Su participación es fundamental para mejorar los planes de gestión climática.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
