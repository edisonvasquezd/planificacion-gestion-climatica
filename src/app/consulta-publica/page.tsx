"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, Megaphone, MapPin, Calendar, MessageSquare, PenLine, FileText, Search, Send, CheckCircle2, ClipboardList } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Consulta {
    consultaId: string;
    planId: string;
    fechaInicio: string;
    fechaFin: string;
    estadoConsulta: string;
    totalObservaciones: number;
    plan?: {
        nombrePlan: string;
        tipoPlan: string;
        organizacion?: { nombre: string; region: string }
    };
}

export default function ConsultaPublicaPage() {
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchConsultas();
    }, []);

    const fetchConsultas = async () => {
        try {
            const response = await fetch(`${API_URL}/api/participacion/consultas`);
            const { data } = await response.json();
            setConsultas(data || []);
        } catch (error) {
            console.error("Error fetching consultas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const calcularDiasRestantes = (fechaFin: string) => {
        const fin = new Date(fechaFin);
        const hoy = new Date();
        return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Globe className="w-7 h-7 text-primary-600" />
                        <span className="font-heading font-bold text-primary-600 text-xl">
                            RESILIAI
                        </span>
                    </Link>
                    <Link
                        href="/auth/login"
                        className="text-sm text-neutral-600 hover:text-primary-600"
                    >
                        Acceso Organizacional →
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                        Consulta Pública Ciudadana
                    </h1>
                    <p className="text-xl opacity-90 max-w-2xl mx-auto">
                        Participa en los Planes de Cambio Climático y Gestión de Riesgo de Desastres de tu comuna.
                        Tu opinión es importante.
                    </p>
                </div>
            </section>

            {/* Info */}
            <section className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Megaphone className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-800 text-lg">
                                Derecho a Participación Ciudadana
                            </h3>
                            <p className="text-blue-700">
                                Según la <strong>Ley 21.455</strong> (Marco de Cambio Climático), los planes comunales
                                deben someterse a consulta pública por un mínimo de <strong>30 días</strong>.
                                Todas las observaciones deben ser respondidas con justificación.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Consultas Activas */}
                <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
                    Consultas Públicas Activas
                </h2>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600">Cargando consultas...</p>
                    </div>
                ) : consultas.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200">
                        <div className="flex justify-center mb-4">
                            <ClipboardList className="w-12 h-12 text-neutral-300" />
                        </div>
                        <p className="text-neutral-600 text-lg">
                            No hay consultas públicas activas en este momento.
                        </p>
                        <p className="text-neutral-500 text-sm mt-2">
                            Vuelve pronto para participar en los próximos procesos.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {consultas.map((consulta) => {
                            const diasRestantes = calcularDiasRestantes(consulta.fechaFin);

                            return (
                                <div
                                    key={consulta.consultaId}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${consulta.plan?.tipoPlan === "PACCC"
                                                ? "bg-secondary-100 text-secondary-700"
                                                : "bg-orange-100 text-orange-700"
                                            }`}>
                                            {consulta.plan?.tipoPlan}
                                        </span>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {diasRestantes} días restantes
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                                        {consulta.plan?.nombrePlan}
                                    </h3>

                                    <p className="text-neutral-600 mb-4 flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {consulta.plan?.organizacion?.nombre}, {consulta.plan?.organizacion?.region}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(consulta.fechaInicio).toLocaleDateString("es-CL")} - {new Date(consulta.fechaFin).toLocaleDateString("es-CL")}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-4 h-4" />
                                            {consulta.totalObservaciones} observaciones
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            href={`/consulta-publica/${consulta.consultaId}`}
                                            className="flex-1 btn-primary text-center"
                                        >
                                            Ver Plan y Participar
                                        </Link>
                                        <Link
                                            href={`/consulta-publica/${consulta.consultaId}/observar`}
                                            className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 flex items-center gap-1"
                                        >
                                            <PenLine className="w-4 h-4" />
                                            Enviar Observación
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* How it Works */}
            <section className="max-w-6xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-8 text-center">
                    ¿Cómo Participar?
                </h2>
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { step: "1", title: "Revisa el Plan", desc: "Lee el documento del plan y sus componentes" },
                        { step: "2", title: "Identifica", desc: "Encuentra la sección que quieres comentar" },
                        { step: "3", title: "Escribe", desc: "Redacta tu observación con propuesta" },
                        { step: "4", title: "Envía", desc: "Tu observación será respondida oficialmente" },
                    ].map((item) => (
                        <div key={item.step} className="text-center">
                            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                                {item.step}
                            </div>
                            <h3 className="font-semibold text-neutral-900 mb-1">{item.title}</h3>
                            <p className="text-sm text-neutral-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-neutral-900 text-neutral-400 py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-sm">
                        © 2026 RESILIAI • Resiliencia Climática Inteligente
                    </p>
                    <p className="text-xs mt-2">
                        Ley 21.455 (Cambio Climático) • Ley 21.364 (Gestión de Riesgo de Desastres)
                    </p>
                </div>
            </footer>
        </main>
    );
}
