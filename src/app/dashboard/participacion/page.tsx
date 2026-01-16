"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    MessageSquare,
    Users,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText,
    Plus,
    Send,
    X,
    ChevronRight,
    Scale,
    FileCheck,
    Download,
    Building2,
    CalendarDays,
    MessagesSquare,
    CircleDot,
    CheckCheck,
    XCircle,
    HelpCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Plan {
    planId: string;
    nombrePlan: string;
    tipoPlan: string;
}

interface Consulta {
    consultaId: string;
    planId: string;
    fechaInicio: string;
    fechaFin: string;
    estadoConsulta: string;
    totalParticipantes: number;
    totalObservaciones: number;
    plan?: { nombrePlan: string; tipoPlan: string; organizacion?: { nombre: string } };
}

interface Observacion {
    observacionId: string;
    seccionPlan: string;
    contenidoObservacion: string;
    propuestaCiudadana: string | null;
    estadoObservacion: string;
    esAnonimo: boolean;
    organizacionRepresentada: string | null;
    respuestaOrganizacion: string | null;
    justificacionRespuesta: string | null;
    createdAt: string;
}

export default function ParticipacionPage() {
    const { token } = useAuth();
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [observaciones, setObservaciones] = useState<Observacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showNewConsulta, setShowNewConsulta] = useState(false);
    const [showResponder, setShowResponder] = useState(false);
    const [selectedObservacion, setSelectedObservacion] = useState<Observacion | null>(null);
    const [showInforme, setShowInforme] = useState(false);

    // Form states
    const [newConsulta, setNewConsulta] = useState({
        planId: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: "",
    });

    const [respuestaForm, setRespuestaForm] = useState({
        estadoObservacion: "En análisis",
        respuestaOrganizacion: "",
        justificacionRespuesta: "",
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchConsultas();
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
        }
    };

    const fetchConsultas = async () => {
        try {
            const response = await fetch(`${API_URL}/api/participacion/consultas`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setConsultas(data || []);
        } catch (error) {
            console.error("Error fetching consultas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchObservaciones = async (planId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/participacion/observaciones/${planId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setObservaciones(data || []);
        } catch (error) {
            console.error("Error fetching observaciones:", error);
        }
    };

    const handleCreateConsulta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConsulta.planId || !newConsulta.fechaFin) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/participacion/consultas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...newConsulta,
                    estadoConsulta: "Activa",
                }),
            });

            if (response.ok) {
                await fetchConsultas();
                setShowNewConsulta(false);
                setNewConsulta({
                    planId: "",
                    fechaInicio: new Date().toISOString().split("T")[0],
                    fechaFin: "",
                });
            }
        } catch (error) {
            console.error("Error creating consulta:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResponderObservacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedObservacion || !respuestaForm.respuestaOrganizacion) return;

        setSubmitting(true);
        try {
            const response = await fetch(
                `${API_URL}/api/participacion/observaciones/${selectedObservacion.observacionId}/responder`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(respuestaForm),
                }
            );

            if (response.ok) {
                if (selectedConsulta) {
                    await fetchObservaciones(selectedConsulta.planId);
                }
                setShowResponder(false);
                setSelectedObservacion(null);
                setRespuestaForm({
                    estadoObservacion: "En análisis",
                    respuestaOrganizacion: "",
                    justificacionRespuesta: "",
                });
            }
        } catch (error) {
            console.error("Error responding to observacion:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalizarConsulta = async () => {
        if (!selectedConsulta) return;

        setSubmitting(true);
        try {
            const response = await fetch(
                `${API_URL}/api/participacion/consultas/${selectedConsulta.consultaId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ estadoConsulta: "Finalizada" }),
                }
            );

            if (response.ok) {
                await fetchConsultas();
                setSelectedConsulta(null);
            }
        } catch (error) {
            console.error("Error finalizando consulta:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const calcularDiasRestantes = (fechaFin: string) => {
        const fin = new Date(fechaFin);
        const hoy = new Date();
        return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    };

    const calcularDiasTotales = (fechaInicio: string, fechaFin: string) => {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            Recibida: "bg-gray-100 text-gray-700",
            "En análisis": "bg-blue-100 text-blue-700",
            Incorporada: "bg-green-100 text-green-700",
            "Parcialmente incorporada": "bg-yellow-100 text-yellow-700",
            "No incorporada": "bg-red-100 text-red-700",
        };
        return colors[estado] || "bg-gray-100 text-gray-700";
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case "Incorporada":
                return <CheckCircle2 className="w-4 h-4" />;
            case "Parcialmente incorporada":
                return <CircleDot className="w-4 h-4" />;
            case "No incorporada":
                return <XCircle className="w-4 h-4" />;
            case "En análisis":
                return <Clock className="w-4 h-4" />;
            default:
                return <HelpCircle className="w-4 h-4" />;
        }
    };

    const getEstadoConsultaColor = (estado: string) => {
        const colors: Record<string, string> = {
            Activa: "bg-green-100 text-green-700",
            Finalizada: "bg-blue-100 text-blue-700",
            Cerrada: "bg-gray-100 text-gray-700",
        };
        return colors[estado] || "bg-gray-100 text-gray-700";
    };

    const getMinFechaFin = () => {
        const inicio = new Date(newConsulta.fechaInicio);
        inicio.setDate(inicio.getDate() + 30);
        return inicio.toISOString().split("T")[0];
    };

    const getInformeStats = () => {
        const total = observaciones.length;
        const incorporadas = observaciones.filter(o => o.estadoObservacion === "Incorporada").length;
        const parciales = observaciones.filter(o => o.estadoObservacion === "Parcialmente incorporada").length;
        const noIncorporadas = observaciones.filter(o => o.estadoObservacion === "No incorporada").length;
        const pendientes = observaciones.filter(o => o.estadoObservacion === "Recibida" || o.estadoObservacion === "En análisis").length;

        const porSeccion = observaciones.reduce((acc, obs) => {
            acc[obs.seccionPlan] = (acc[obs.seccionPlan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total, incorporadas, parciales, noIncorporadas, pendientes, porSeccion };
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Participación Ciudadana
                    </h1>
                    <p className="text-neutral-600 mt-1 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Consulta pública obligatoria (Ley 21.455, Art. 4 y 5)
                    </p>
                </div>
                <button
                    onClick={() => setShowNewConsulta(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Consulta
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <Scale className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-800">Requisitos Legales</h3>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                            <li className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Plazo mínimo de consulta: <strong>30 días</strong>
                            </li>
                            <li className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Todas las observaciones deben ser respondidas con justificación
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Informe de consulta publicado en máximo 15 días post-cierre
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Consultas List */}
                <div className="lg:col-span-1">
                    <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Consultas Públicas
                    </h2>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : consultas.length === 0 ? (
                        <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center text-neutral-500">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                            No hay consultas públicas
                            <button
                                onClick={() => setShowNewConsulta(true)}
                                className="block w-full mt-3 text-primary-600 hover:underline text-sm"
                            >
                                Crear primera consulta
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {consultas.map((consulta) => {
                                const diasRestantes = calcularDiasRestantes(consulta.fechaFin);
                                const isActive = consulta.estadoConsulta === "Activa" && diasRestantes > 0;

                                return (
                                    <button
                                        key={consulta.consultaId}
                                        onClick={() => {
                                            setSelectedConsulta(consulta);
                                            fetchObservaciones(consulta.planId);
                                        }}
                                        className={`w-full text-left bg-white rounded-xl p-4 border transition-all ${selectedConsulta?.consultaId === consulta.consultaId
                                                ? "border-primary-500 ring-2 ring-primary-200"
                                                : "border-neutral-200 hover:border-primary-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getEstadoConsultaColor(consulta.estadoConsulta)}`}>
                                                {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {consulta.estadoConsulta}
                                            </span>
                                            {isActive && (
                                                <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {diasRestantes} días restantes
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-neutral-900 text-sm">
                                            {consulta.plan?.nombrePlan || "Plan sin nombre"}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {consulta.plan?.tipoPlan}
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {consulta.totalParticipantes}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {consulta.totalObservaciones}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Observaciones Panel */}
                <div className="lg:col-span-2">
                    {selectedConsulta ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                                    <MessagesSquare className="w-5 h-5" />
                                    Observaciones Ciudadanas
                                </h2>
                                <div className="flex gap-2">
                                    {selectedConsulta.estadoConsulta === "Activa" && (
                                        <button
                                            onClick={handleFinalizarConsulta}
                                            disabled={submitting}
                                            className="px-3 py-1.5 text-sm border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Finalizar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowInforme(true)}
                                        className="btn-primary text-sm flex items-center gap-1"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Ver Informe
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="bg-white rounded-lg p-3 border border-neutral-200 text-center">
                                    <p className="text-2xl font-bold text-neutral-900">{observaciones.length}</p>
                                    <p className="text-xs text-neutral-500">Total</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                                    <p className="text-2xl font-bold text-green-700">
                                        {observaciones.filter(o => o.estadoObservacion === "Incorporada").length}
                                    </p>
                                    <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Incorporadas
                                    </p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {observaciones.filter(o => o.estadoObservacion === "Parcialmente incorporada").length}
                                    </p>
                                    <p className="text-xs text-yellow-600 flex items-center justify-center gap-1">
                                        <CircleDot className="w-3 h-3" />
                                        Parciales
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                                    <p className="text-2xl font-bold text-blue-700">
                                        {observaciones.filter(o => o.estadoObservacion === "Recibida" || o.estadoObservacion === "En análisis").length}
                                    </p>
                                    <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Pendientes
                                    </p>
                                </div>
                            </div>

                            {/* Observaciones List */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {observaciones.length === 0 ? (
                                    <div className="bg-white rounded-xl p-8 border border-neutral-200 text-center text-neutral-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                                        <p>No hay observaciones para esta consulta</p>
                                        <p className="text-sm mt-2">Las observaciones ciudadanas aparecerán aquí</p>
                                    </div>
                                ) : (
                                    observaciones.map((obs) => (
                                        <div
                                            key={obs.observacionId}
                                            className="bg-white rounded-xl p-4 border border-neutral-200"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getEstadoColor(obs.estadoObservacion)}`}>
                                                            {getEstadoIcon(obs.estadoObservacion)}
                                                            {obs.estadoObservacion}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            {obs.seccionPlan}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-neutral-700">{obs.contenidoObservacion}</p>
                                                    {obs.propuestaCiudadana && (
                                                        <p className="text-sm text-primary-600 mt-2 flex items-start gap-1">
                                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            Propuesta: {obs.propuestaCiudadana}
                                                        </p>
                                                    )}

                                                    {obs.respuestaOrganizacion && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                                <Building2 className="w-3 h-3" />
                                                                Respuesta Organizacional:
                                                            </p>
                                                            <p className="text-sm text-gray-700">{obs.respuestaOrganizacion}</p>
                                                            {obs.justificacionRespuesta && (
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    <strong>Justificación:</strong> {obs.justificacionRespuesta}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-4 mt-2 text-xs text-neutral-400">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {obs.esAnonimo ? "Anónimo" : obs.organizacionRepresentada || "Ciudadano"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(obs.createdAt).toLocaleDateString("es-CL")}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!obs.respuestaOrganizacion && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedObservacion(obs);
                                                            setRespuestaForm({
                                                                estadoObservacion: "En análisis",
                                                                respuestaOrganizacion: "",
                                                                justificacionRespuesta: "",
                                                            });
                                                            setShowResponder(true);
                                                        }}
                                                        className="text-primary-600 hover:underline text-sm whitespace-nowrap flex items-center gap-1"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        Responder
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-xl p-8 border border-neutral-200 text-center text-neutral-500">
                            <FileCheck className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                            <p>Selecciona una consulta para ver las observaciones</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Nueva Consulta */}
            {showNewConsulta && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Nueva Consulta Pública
                                </h2>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Crear un proceso de participación ciudadana
                                </p>
                            </div>
                            <button onClick={() => setShowNewConsulta(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateConsulta} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    Plan a Consultar *
                                </label>
                                <select
                                    value={newConsulta.planId}
                                    onChange={(e) => setNewConsulta({ ...newConsulta, planId: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    required
                                >
                                    <option value="">Seleccionar plan...</option>
                                    {planes.map((plan) => (
                                        <option key={plan.planId} value={plan.planId}>
                                            {plan.nombrePlan} ({plan.tipoPlan})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Fecha Inicio *
                                    </label>
                                    <input
                                        type="date"
                                        value={newConsulta.fechaInicio}
                                        onChange={(e) => setNewConsulta({ ...newConsulta, fechaInicio: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                                        <CalendarDays className="w-4 h-4" />
                                        Fecha Fin *
                                    </label>
                                    <input
                                        type="date"
                                        value={newConsulta.fechaFin}
                                        onChange={(e) => setNewConsulta({ ...newConsulta, fechaFin: e.target.value })}
                                        min={getMinFechaFin()}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                        required
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Mínimo 30 días (Ley 21.455)
                                    </p>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <p className="text-sm text-yellow-700">
                                    <strong>Recordatorio:</strong> La consulta debe permanecer abierta mínimo 30 días.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewConsulta(false)}
                                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>Creando...</>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Crear Consulta
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Responder Observación */}
            {showResponder && selectedObservacion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Responder Observación
                                </h2>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Respuesta fundamentada según Ley 21.455
                                </p>
                            </div>
                            <button onClick={() => { setShowResponder(false); setSelectedObservacion(null); }} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 border-b border-neutral-200">
                            <h3 className="text-sm font-medium text-neutral-600 mb-2 flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                Observación Original:
                            </h3>
                            <p className="text-neutral-800">{selectedObservacion.contenidoObservacion}</p>
                            {selectedObservacion.propuestaCiudadana && (
                                <p className="text-primary-600 mt-2 text-sm flex items-start gap-1">
                                    <AlertCircle className="w-4 h-4 mt-0.5" />
                                    Propuesta: {selectedObservacion.propuestaCiudadana}
                                </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {selectedObservacion.seccionPlan}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {selectedObservacion.esAnonimo ? "Anónimo" : selectedObservacion.organizacionRepresentada || "Ciudadano"}
                                </span>
                            </p>
                        </div>

                        <form onSubmit={handleResponderObservacion} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Estado de la Observación *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "Incorporada", label: "Incorporada", color: "border-green-500 bg-green-50 text-green-700", icon: CheckCircle2 },
                                        { value: "Parcialmente incorporada", label: "Parcialmente incorporada", color: "border-yellow-500 bg-yellow-50 text-yellow-700", icon: CircleDot },
                                        { value: "No incorporada", label: "No incorporada", color: "border-red-500 bg-red-50 text-red-700", icon: XCircle },
                                        { value: "En análisis", label: "En análisis", color: "border-blue-500 bg-blue-50 text-blue-700", icon: Clock },
                                    ].map((estado) => (
                                        <button
                                            key={estado.value}
                                            type="button"
                                            onClick={() => setRespuestaForm({ ...respuestaForm, estadoObservacion: estado.value })}
                                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                                respuestaForm.estadoObservacion === estado.value
                                                    ? estado.color
                                                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                            }`}
                                        >
                                            <estado.icon className="w-4 h-4" />
                                            {estado.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    Respuesta Organizacional *
                                </label>
                                <textarea
                                    value={respuestaForm.respuestaOrganizacion}
                                    onChange={(e) => setRespuestaForm({ ...respuestaForm, respuestaOrganizacion: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="Explique la decisión tomada respecto a esta observación..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                                    <Scale className="w-4 h-4" />
                                    Justificación Técnica *
                                </label>
                                <textarea
                                    value={respuestaForm.justificacionRespuesta}
                                    onChange={(e) => setRespuestaForm({ ...respuestaForm, justificacionRespuesta: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="Proporcione la justificación técnica o legal..."
                                    required
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    Según Ley 21.455, todas las observaciones deben ser respondidas con justificación
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResponder(false);
                                        setSelectedObservacion(null);
                                    }}
                                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>Guardando...</>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Guardar Respuesta
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Informe de Consulta */}
            {showInforme && selectedConsulta && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Informe de Consulta Pública
                                </h2>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {selectedConsulta.plan?.nombrePlan}
                                </p>
                            </div>
                            <button onClick={() => setShowInforme(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Resumen General */}
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <MessagesSquare className="w-5 h-5" />
                                    Resumen General
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-neutral-900">{getInformeStats().total}</p>
                                        <p className="text-sm text-neutral-600">Total</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-green-700">{getInformeStats().incorporadas}</p>
                                        <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Incorporadas
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-yellow-700">{getInformeStats().parciales}</p>
                                        <p className="text-sm text-yellow-600 flex items-center justify-center gap-1">
                                            <CircleDot className="w-4 h-4" />
                                            Parciales
                                        </p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-4 text-center">
                                        <p className="text-3xl font-bold text-red-700">{getInformeStats().noIncorporadas}</p>
                                        <p className="text-sm text-red-600 flex items-center justify-center gap-1">
                                            <XCircle className="w-4 h-4" />
                                            No Incorporadas
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Período de Consulta */}
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5" />
                                    Período de Consulta
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-neutral-500">Fecha Inicio</p>
                                            <p className="font-medium">{new Date(selectedConsulta.fechaInicio).toLocaleDateString("es-CL")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">Fecha Fin</p>
                                            <p className="font-medium">{new Date(selectedConsulta.fechaFin).toLocaleDateString("es-CL")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-500">Duración</p>
                                            <p className="font-medium">{calcularDiasTotales(selectedConsulta.fechaInicio, selectedConsulta.fechaFin)} días</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participación */}
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Participación
                                </h3>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-3xl font-bold text-blue-700">{selectedConsulta.totalParticipantes}</p>
                                            <p className="text-sm text-blue-600">Participantes Totales</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-blue-700">{selectedConsulta.totalObservaciones}</p>
                                            <p className="text-sm text-blue-600">Observaciones Recibidas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Por Sección */}
                            <div>
                                <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Por Sección del Plan
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(getInformeStats().porSeccion).map(([seccion, count]) => (
                                        <div key={seccion} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <span className="text-neutral-700 flex items-center gap-2">
                                                <ChevronRight className="w-4 h-4" />
                                                {seccion}
                                            </span>
                                            <span className="font-semibold text-neutral-900">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(getInformeStats().porSeccion).length === 0 && (
                                        <p className="text-neutral-500 text-center py-4">Sin datos de secciones</p>
                                    )}
                                </div>
                            </div>

                            {getInformeStats().pendientes > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <p className="text-yellow-800">
                                        <strong>Atención:</strong> Hay {getInformeStats().pendientes} observaciones
                                        pendientes de respuesta. Todas deben ser respondidas antes de publicar el informe final.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                                <button
                                    type="button"
                                    onClick={() => setShowInforme(false)}
                                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => {
                                        alert("Funcionalidad de exportación PDF próximamente");
                                    }}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
