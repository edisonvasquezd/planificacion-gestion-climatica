"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Leaf, Star, ArrowLeft, Trash2, CheckCircle2, Check, Circle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const CRITERIOS_SBN = [
    { key: "criterio1DesafioSocial", nombre: "Desafío Social" },
    { key: "criterio2EscalaPaisaje", nombre: "Escala Paisaje" },
    { key: "criterio3GananciaBiodiversidad", nombre: "Ganancia Biodiversidad" },
    { key: "criterio4ViabilidadEconomica", nombre: "Viabilidad Económica" },
    { key: "criterio5GobernanzaInclusiva", nombre: "Gobernanza Inclusiva" },
    { key: "criterio6GestionTradeoffs", nombre: "Gestión Tradeoffs" },
    { key: "criterio7MonitoreoAdaptativo", nombre: "Monitoreo Adaptativo" },
    { key: "criterio8Sostenibilidad", nombre: "Sostenibilidad" },
];

export default function AccionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [accion, setAccion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showGestionForm, setShowGestionForm] = useState(false);
    const [gestionData, setGestionData] = useState({
        estadoImplementacion: "Diseño",
        presupuestoAsignadoClp: 0,
        presupuestoEjecutadoClp: 0,
        fechaInicioProgramada: "",
        fechaFinProgramada: "",
        observaciones: "",
    });

    useEffect(() => {
        if (params.id) fetchAccion();
    }, [params.id, token]);

    const fetchAccion = async () => {
        try {
            const res = await fetch(`${API_URL}/api/acciones/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setAccion(data.data);
                if (data.data.gestiones?.[0]) {
                    setGestionData(data.data.gestiones[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching accion:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateGestion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/acciones/${params.id}/gestion`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(gestionData),
            });

            if (res.ok) {
                setShowGestionForm(false);
                fetchAccion();
            }
        } catch (error) {
            console.error("Error updating gestion:", error);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar esta acción?")) return;

        try {
            const res = await fetch(`${API_URL}/api/acciones/${params.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                router.push("/dashboard/acciones");
            }
        } catch (error) {
            console.error("Error deleting accion:", error);
        }
    };

    const formatCLP = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!accion) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Acción no encontrada</p>
                <Link href="/dashboard/acciones" className="text-primary-600 hover:underline">
                    Volver a la lista
                </Link>
            </div>
        );
    }

    const verificadorSbn = accion.verificadorSbn ? JSON.parse(accion.verificadorSbn) : null;
    const criteriosCumplidos = verificadorSbn
        ? Object.values(verificadorSbn).filter(Boolean).length
        : 0;
    const gestion = accion.gestiones?.[0];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Link href="/dashboard/acciones" className="text-primary-600 hover:underline text-sm">
                    ← Volver a Cartera de Acciones
                </Link>
            </div>

            {/* Header */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-sm font-medium flex items-center gap-1 ${
                                accion.tipoSolucion === "SbN"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : accion.tipoSolucion === "Verde"
                                    ? "bg-green-100 text-green-700"
                                    : accion.tipoSolucion === "Híbrida"
                                    ? "bg-teal-100 text-teal-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}>
                                {accion.tipoSolucion === "SbN" && <Leaf className="w-3.5 h-3.5" />}
                                {accion.tipoSolucion}
                            </span>
                            {accion.pilarPaccc !== "N/A" && (
                                <span className="px-2 py-0.5 rounded text-sm bg-primary-100 text-primary-700">
                                    {accion.pilarPaccc}
                                </span>
                            )}
                            {accion.faseCicloRiesgo !== "N/A" && (
                                <span className="px-2 py-0.5 rounded text-sm bg-orange-100 text-orange-700">
                                    {accion.faseCicloRiesgo}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-neutral-900">
                            {accion.nombreAccion}
                        </h1>
                        <p className="text-neutral-600 mt-2">
                            {accion.descripcionAccion || "Sin descripción"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-neutral-500">Responsable</p>
                        <p className="font-medium">{accion.responsableImplementacion}</p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Prioridad</p>
                        <p className="font-medium flex items-center gap-0.5">
                            {Array.from({ length: accion.prioridad || 0 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Costo Estimado</p>
                        <p className="font-medium">{formatCLP(accion.costoEstimado || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Estado de Gestión */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        Estado de Implementación
                    </h2>
                    <button
                        onClick={() => setShowGestionForm(!showGestionForm)}
                        className="text-sm text-primary-600 hover:underline"
                    >
                        {showGestionForm ? "Cancelar" : "Actualizar Estado"}
                    </button>
                </div>

                {showGestionForm ? (
                    <form onSubmit={handleUpdateGestion} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={gestionData.estadoImplementacion}
                                    onChange={(e) => setGestionData({ ...gestionData, estadoImplementacion: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Diseño">Diseño</option>
                                    <option value="Licitación">Licitación</option>
                                    <option value="En Ejecución">En Ejecución</option>
                                    <option value="Finalizada">Finalizada</option>
                                    <option value="Pausada">Pausada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Presupuesto Asignado (CLP)
                                </label>
                                <input
                                    type="number"
                                    value={gestionData.presupuestoAsignadoClp}
                                    onChange={(e) => setGestionData({ ...gestionData, presupuestoAsignadoClp: parseInt(e.target.value) || 0 })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Presupuesto Ejecutado (CLP)
                                </label>
                                <input
                                    type="number"
                                    value={gestionData.presupuestoEjecutadoClp}
                                    onChange={(e) => setGestionData({ ...gestionData, presupuestoEjecutadoClp: parseInt(e.target.value) || 0 })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Fecha Inicio Programada
                                </label>
                                <input
                                    type="date"
                                    value={gestionData.fechaInicioProgramada?.split("T")[0] || ""}
                                    onChange={(e) => setGestionData({ ...gestionData, fechaInicioProgramada: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Fecha Fin Programada
                                </label>
                                <input
                                    type="date"
                                    value={gestionData.fechaFinProgramada?.split("T")[0] || ""}
                                    onChange={(e) => setGestionData({ ...gestionData, fechaFinProgramada: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Observaciones
                            </label>
                            <textarea
                                value={gestionData.observaciones || ""}
                                onChange={(e) => setGestionData({ ...gestionData, observaciones: e.target.value })}
                                className="input-field"
                                rows={2}
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Guardar Cambios
                        </button>
                    </form>
                ) : gestion ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-neutral-500">Estado</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                                gestion.estadoImplementacion === "Finalizada"
                                    ? "bg-green-100 text-green-700"
                                    : gestion.estadoImplementacion === "En Ejecución"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : gestion.estadoImplementacion === "Pausada"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}>
                                {gestion.estadoImplementacion}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Presupuesto Asignado</p>
                            <p className="font-semibold text-lg">{formatCLP(gestion.presupuestoAsignadoClp)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Presupuesto Ejecutado</p>
                            <p className="font-semibold text-lg">{formatCLP(gestion.presupuestoEjecutadoClp)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Avance Presupuestario</p>
                            <div className="mt-1">
                                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-600 rounded-full"
                                        style={{
                                            width: `${Math.min(100, gestion.presupuestoAsignadoClp > 0
                                                ? (gestion.presupuestoEjecutadoClp / gestion.presupuestoAsignadoClp) * 100
                                                : 0)}%`
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {gestion.presupuestoAsignadoClp > 0
                                        ? Math.round((gestion.presupuestoEjecutadoClp / gestion.presupuestoAsignadoClp) * 100)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-neutral-500">Sin información de gestión</p>
                )}
            </div>

            {/* Verificador SbN */}
            {accion.tipoSolucion === "SbN" && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-emerald-900">
                            Verificación SbN - Criterios UICN
                        </h2>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-700">
                                {criteriosCumplidos}/8
                            </p>
                            <p className="text-sm text-emerald-600 flex items-center justify-end gap-1">
                                {criteriosCumplidos === 8 ? <><Check className="w-4 h-4" /> Cumple estándar</> : "Criterios pendientes"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CRITERIOS_SBN.map((criterio) => {
                            const cumple = verificadorSbn?.[criterio.key];
                            return (
                                <div
                                    key={criterio.key}
                                    className={`p-3 rounded-lg border ${
                                        cumple
                                            ? "bg-emerald-100 border-emerald-300"
                                            : "bg-white border-neutral-200"
                                    }`}
                                >
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        {cumple ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-neutral-400" />}
                                        {criterio.nombre}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Indicadores */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        Indicadores Asociados
                    </h2>
                    <Link
                        href={`/dashboard/indicadores/nuevo?accionId=${params.id}`}
                        className="text-sm text-primary-600 hover:underline"
                    >
                        + Agregar Indicador
                    </Link>
                </div>

                {accion.indicadores?.length > 0 ? (
                    <div className="space-y-3">
                        {accion.indicadores.map((ind: any) => {
                            const ultimaMedicion = ind.mediciones?.[ind.mediciones.length - 1];
                            const progreso = ind.meta > 0
                                ? Math.round(((ultimaMedicion?.valorMedido || ind.lineaBase) / ind.meta) * 100)
                                : 0;
                            return (
                                <div key={ind.indicadorId} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium">{ind.nombreIndicador}</h4>
                                            <p className="text-sm text-neutral-500">
                                                {ind.tipoIndicador} | {ind.unidadMedida}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold">{progreso}%</p>
                                            <p className="text-xs text-neutral-500">
                                                Meta: {ind.meta} {ind.unidadMedida}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                progreso >= 100 ? "bg-green-500" :
                                                progreso >= 50 ? "bg-primary-500" :
                                                "bg-orange-500"
                                            }`}
                                            style={{ width: `${Math.min(100, progreso)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-neutral-500 text-center py-8">
                        No hay indicadores asociados a esta acción
                    </p>
                )}
            </div>
        </div>
    );
}
