"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
    fechaAprobacion: string | null;
    fechaVigenciaInicio: string | null;
    fechaVigenciaFin: string | null;
    linkDocumentoPublico: string | null;
    createdAt: string;
    organizacion?: { nombre: string };
    diagnosticos?: any[];
    consultasPublicas?: any[];
}

export default function PlanDetailPage() {
    const params = useParams();
    const { token } = useAuth();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showConsultaModal, setShowConsultaModal] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchPlan();
        }
    }, [params.id, token]);

    const fetchPlan = async () => {
        try {
            const response = await fetch(`${API_URL}/api/planes/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setPlan(data);
        } catch (error) {
            console.error("Error fetching plan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const iniciarConsulta = async (dias: number) => {
        try {
            const response = await fetch(`${API_URL}/api/planes/${params.id}/iniciar-consulta`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dias }),
            });

            if (response.ok) {
                fetchPlan();
                setShowConsultaModal(false);
            }
        } catch (error) {
            console.error("Error iniciando consulta:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="p-8 text-center">
                <p className="text-neutral-500">Plan no encontrado</p>
            </div>
        );
    }

    const diagnostico = plan.diagnosticos?.[0];
    const consultaActiva = plan.consultasPublicas?.find(c => c.estadoConsulta === "Activa");

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/planes" className="text-primary-600 hover:underline text-sm mb-2 inline-block">
                    ← Volver a Planes
                </Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.tipoPlan === "PACCC" ? "bg-secondary-100 text-secondary-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                {plan.tipoPlan}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.estadoPlan === "Vigente" ? "bg-green-100 text-green-700" :
                                    plan.estadoPlan === "En consulta pública" ? "bg-blue-100 text-blue-700" :
                                        "bg-gray-100 text-gray-700"
                                }`}>
                                {plan.estadoPlan}
                            </span>
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-neutral-900">
                            {plan.nombrePlan}
                        </h1>
                        <p className="text-neutral-600 mt-1">Versión {plan.version}</p>
                    </div>

                    <div className="flex gap-2">
                        {plan.estadoPlan === "En elaboración" && (
                            <button
                                onClick={() => setShowConsultaModal(true)}
                                className="btn-primary"
                            >
                                🗣️ Iniciar Consulta Pública
                            </button>
                        )}
                        <Link
                            href={`/dashboard/planes/${plan.planId}/editar`}
                            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                            ✏️ Editar
                        </Link>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-500">Responsable</p>
                    <p className="font-medium text-neutral-900">{plan.responsablePlan}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-500">Fecha Creación</p>
                    <p className="font-medium text-neutral-900">
                        {new Date(plan.createdAt).toLocaleDateString("es-CL")}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-500">Organización</p>
                    <p className="font-medium text-neutral-900">{plan.organizacion?.nombre || "—"}</p>
                </div>
            </div>

            {/* Active Consultation Banner */}
            {consultaActiva && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-blue-800">📢 Consulta Pública Activa</h3>
                            <p className="text-sm text-blue-700">
                                Finaliza: {new Date(consultaActiva.fechaFin).toLocaleDateString("es-CL")}
                            </p>
                        </div>
                        <Link
                            href={`/dashboard/participacion/consulta/${consultaActiva.consultaId}`}
                            className="btn-primary bg-blue-600 hover:bg-blue-700"
                        >
                            Ver Observaciones ({consultaActiva.totalObservaciones})
                        </Link>
                    </div>
                </div>
            )}

            {/* Modules */}
            <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
                Componentes del Plan
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                    href={`/dashboard/diagnosticos?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">🔍</div>
                    <h3 className="font-semibold text-neutral-900">Diagnóstico</h3>
                    <p className="text-sm text-neutral-500 mt-1">GEI, Amenazas, Vulnerabilidades</p>
                </Link>

                <Link
                    href={`/dashboard/riesgos?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">⚠️</div>
                    <h3 className="font-semibold text-neutral-900">Matriz de Riesgos</h3>
                    <p className="text-sm text-neutral-500 mt-1">Análisis y priorización</p>
                </Link>

                <Link
                    href={`/dashboard/acciones?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">🎯</div>
                    <h3 className="font-semibold text-neutral-900">Cartera de Acciones</h3>
                    <p className="text-sm text-neutral-500 mt-1">Implementación y SbN</p>
                </Link>

                <Link
                    href={`/dashboard/indicadores?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold text-neutral-900">Indicadores</h3>
                    <p className="text-sm text-neutral-500 mt-1">Monitoreo y mediciones</p>
                </Link>

                <Link
                    href={`/dashboard/actores?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">🏛️</div>
                    <h3 className="font-semibold text-neutral-900">Gobernanza</h3>
                    <p className="text-sm text-neutral-500 mt-1">Actores y COGRID</p>
                </Link>

                <Link
                    href={`/dashboard/mapa?planId=${plan.planId}`}
                    className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                >
                    <div className="text-3xl mb-3">🗺️</div>
                    <h3 className="font-semibold text-neutral-900">Visor SIG</h3>
                    <p className="text-sm text-neutral-500 mt-1">Mapas y capas</p>
                </Link>
            </div>

            {/* Consulta Modal */}
            {showConsultaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-heading font-bold text-neutral-900 mb-4">
                            Iniciar Consulta Pública
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            Según la Ley 21.455, la consulta pública debe tener un plazo mínimo de <strong>30 días</strong>.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => iniciarConsulta(30)}
                                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                30 días (mínimo legal)
                            </button>
                            <button
                                onClick={() => iniciarConsulta(45)}
                                className="w-full py-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                            >
                                45 días (recomendado)
                            </button>
                            <button
                                onClick={() => iniciarConsulta(60)}
                                className="w-full py-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                            >
                                60 días
                            </button>
                        </div>
                        <button
                            onClick={() => setShowConsultaModal(false)}
                            className="w-full mt-4 py-2 text-neutral-600 hover:text-neutral-800"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
