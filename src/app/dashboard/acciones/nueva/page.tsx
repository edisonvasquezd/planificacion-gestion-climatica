"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Leaf, Star, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const CRITERIOS_SBN = [
    { key: "criterio1DesafioSocial", nombre: "Desafío Social", desc: "La SbN responde efectivamente a desafíos sociales" },
    { key: "criterio2EscalaPaisaje", nombre: "Escala Paisaje", desc: "El diseño considera el paisaje más amplio" },
    { key: "criterio3GananciaBiodiversidad", nombre: "Ganancia Biodiversidad", desc: "Resulta en ganancia neta de biodiversidad" },
    { key: "criterio4ViabilidadEconomica", nombre: "Viabilidad Económica", desc: "Es económicamente viable a largo plazo" },
    { key: "criterio5GobernanzaInclusiva", nombre: "Gobernanza Inclusiva", desc: "Se basa en procesos de gobernanza inclusivos" },
    { key: "criterio6GestionTradeoffs", nombre: "Gestión Tradeoffs", desc: "Equilibra trade-offs entre objetivos" },
    { key: "criterio7MonitoreoAdaptativo", nombre: "Monitoreo Adaptativo", desc: "Se gestiona de forma adaptativa con base en evidencia" },
    { key: "criterio8Sostenibilidad", nombre: "Sostenibilidad", desc: "Es sostenible y se integra al marco institucional" },
];

export default function NuevaAccionPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [planes, setPlanes] = useState<any[]>([]);
    const [riesgos, setRiesgos] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        nombreAccion: "",
        descripcionAccion: "",
        responsableImplementacion: "",
        pilarPaccc: "N/A",
        faseCicloRiesgo: "N/A",
        tipoSolucion: "Gris",
        costoEstimado: 0,
        prioridad: 3,
        relacionPlanIds: [] as string[],
        relacionRiesgoIds: [] as string[],
        relacionGeiSectores: [] as string[],
        verificadorSbn: {
            criterio1DesafioSocial: false,
            criterio2EscalaPaisaje: false,
            criterio3GananciaBiodiversidad: false,
            criterio4ViabilidadEconomica: false,
            criterio5GobernanzaInclusiva: false,
            criterio6GestionTradeoffs: false,
            criterio7MonitoreoAdaptativo: false,
            criterio8Sostenibilidad: false,
        },
    });

    useEffect(() => {
        fetchPlanes();
        fetchRiesgos();
    }, [token]);

    const fetchPlanes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/planes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setPlanes(data.data);
        } catch (err) {
            console.error("Error fetching planes:", err);
        }
    };

    const fetchRiesgos = async () => {
        try {
            const res = await fetch(`${API_URL}/api/riesgos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setRiesgos(data.data);
        } catch (err) {
            console.error("Error fetching riesgos:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const payload: any = { ...formData };

            // Solo incluir verificadorSbn si es tipo SbN
            if (formData.tipoSolucion !== "SbN") {
                delete payload.verificadorSbn;
            }

            const res = await fetch(`${API_URL}/api/acciones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al crear acción");
            }

            router.push("/dashboard/acciones");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const criteriosCumplidos = Object.values(formData.verificadorSbn).filter(Boolean).length;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Link href="/dashboard/acciones" className="text-primary-600 hover:underline text-sm">
                    ← Volver a Cartera de Acciones
                </Link>
                <h1 className="text-2xl font-heading font-bold text-neutral-900 mt-2">
                    Nueva Acción
                </h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                        Información de la Acción
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Nombre de la Acción *
                            </label>
                            <input
                                type="text"
                                value={formData.nombreAccion}
                                onChange={(e) => setFormData({ ...formData, nombreAccion: e.target.value })}
                                className="input-field"
                                placeholder="Ej: Restauración de humedal urbano sector norte"
                                required
                                minLength={5}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcionAccion}
                                onChange={(e) => setFormData({ ...formData, descripcionAccion: e.target.value })}
                                className="input-field"
                                rows={3}
                                placeholder="Describe los objetivos, alcance y beneficios esperados..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Responsable de Implementación *
                                </label>
                                <input
                                    type="text"
                                    value={formData.responsableImplementacion}
                                    onChange={(e) => setFormData({ ...formData, responsableImplementacion: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: SECPLA, Dirección de Medio Ambiente"
                                    required
                                    minLength={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Costo Estimado (CLP)
                                </label>
                                <input
                                    type="number"
                                    value={formData.costoEstimado}
                                    onChange={(e) => setFormData({ ...formData, costoEstimado: parseInt(e.target.value) || 0 })}
                                    className="input-field"
                                    min={0}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Prioridad
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, prioridad: p })}
                                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-0.5 ${
                                            formData.prioridad === p
                                                ? "bg-primary-100 border-primary-500 text-primary-700"
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        {Array.from({ length: p }).map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${formData.prioridad === p ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
                                        ))}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clasificación */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                        Clasificación
                    </h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Tipo de Solución *
                            </label>
                            <select
                                value={formData.tipoSolucion}
                                onChange={(e) => setFormData({ ...formData, tipoSolucion: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="Gris">Gris (Infraestructura tradicional)</option>
                                <option value="Verde">Verde (Basada en ecosistemas)</option>
                                <option value="Híbrida">Híbrida (Combinación)</option>
                                <option value="SbN">SbN (Solución basada en Naturaleza)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Pilar PACCC
                            </label>
                            <select
                                value={formData.pilarPaccc}
                                onChange={(e) => setFormData({ ...formData, pilarPaccc: e.target.value })}
                                className="input-field"
                            >
                                <option value="N/A">No aplica</option>
                                <option value="Mitigación">Mitigación</option>
                                <option value="Adaptación">Adaptación</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Fase Ciclo de Riesgo
                            </label>
                            <select
                                value={formData.faseCicloRiesgo}
                                onChange={(e) => setFormData({ ...formData, faseCicloRiesgo: e.target.value })}
                                className="input-field"
                            >
                                <option value="N/A">No aplica</option>
                                <option value="Prevención">Prevención</option>
                                <option value="Mitigación (de Riesgo)">Mitigación (de Riesgo)</option>
                                <option value="Preparación">Preparación</option>
                                <option value="Respuesta">Respuesta</option>
                                <option value="Recuperación">Recuperación</option>
                            </select>
                        </div>
                    </div>

                    {/* Sectores GEI relacionados */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Sectores GEI Relacionados
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Energía", "Transporte", "Residuos", "IPPU", "AFOLU"].map((sector) => (
                                <label
                                    key={sector}
                                    className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                                        formData.relacionGeiSectores.includes(sector)
                                            ? "bg-primary-100 border-primary-500 text-primary-700"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.relacionGeiSectores.includes(sector)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({
                                                    ...formData,
                                                    relacionGeiSectores: [...formData.relacionGeiSectores, sector],
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    relacionGeiSectores: formData.relacionGeiSectores.filter((s) => s !== sector),
                                                });
                                            }
                                        }}
                                    />
                                    {sector}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Verificador SbN (solo si tipo es SbN) */}
                {formData.tipoSolucion === "SbN" && (
                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-emerald-900">
                                    Verificación SbN - Criterios UICN
                                </h2>
                                <p className="text-sm text-emerald-700">
                                    Verifica el cumplimiento de los 8 criterios del estándar global de SbN
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-700">{criteriosCumplidos}/8</p>
                                <p className="text-sm text-emerald-600">criterios cumplidos</p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {CRITERIOS_SBN.map((criterio) => (
                                <label
                                    key={criterio.key}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        formData.verificadorSbn[criterio.key as keyof typeof formData.verificadorSbn]
                                            ? "bg-emerald-100 border-emerald-400"
                                            : "bg-white border-neutral-200 hover:border-emerald-300"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.verificadorSbn[criterio.key as keyof typeof formData.verificadorSbn]}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                verificadorSbn: {
                                                    ...formData.verificadorSbn,
                                                    [criterio.key]: e.target.checked,
                                                },
                                            })
                                        }
                                        className="mt-1 h-4 w-4 text-emerald-600 rounded"
                                    />
                                    <div>
                                        <p className="font-medium text-neutral-900">{criterio.nombre}</p>
                                        <p className="text-sm text-neutral-600">{criterio.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {criteriosCumplidos < 8 && (
                            <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Para ser considerada una SbN válida, se deben cumplir los 8 criterios UICN.
                                    Actualmente faltan {8 - criteriosCumplidos} criterios.
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Vinculaciones */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                        Vinculaciones
                    </h2>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Planes Relacionados
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {planes.map((plan) => (
                                    <label
                                        key={plan.planId}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-neutral-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.relacionPlanIds.includes(plan.planId)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        relacionPlanIds: [...formData.relacionPlanIds, plan.planId],
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        relacionPlanIds: formData.relacionPlanIds.filter((id) => id !== plan.planId),
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <span className="text-sm">{plan.nombrePlan}</span>
                                        <span className="text-xs text-neutral-500">({plan.tipoPlan})</span>
                                    </label>
                                ))}
                                {planes.length === 0 && (
                                    <p className="text-sm text-neutral-500 p-2">No hay planes disponibles</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Riesgos que Atiende
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {riesgos.map((riesgo) => (
                                    <label
                                        key={riesgo.riesgoId}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-neutral-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.relacionRiesgoIds.includes(riesgo.riesgoId)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        relacionRiesgoIds: [...formData.relacionRiesgoIds, riesgo.riesgoId],
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        relacionRiesgoIds: formData.relacionRiesgoIds.filter((id) => id !== riesgo.riesgoId),
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <span className="text-sm">{riesgo.nombreRiesgo}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            riesgo.nivelRiesgoCalculado === "Crítico" ? "bg-red-100 text-red-700" :
                                            riesgo.nivelRiesgoCalculado === "Alto" ? "bg-orange-100 text-orange-700" :
                                            riesgo.nivelRiesgoCalculado === "Medio" ? "bg-yellow-100 text-yellow-700" :
                                            "bg-green-100 text-green-700"
                                        }`}>
                                            {riesgo.nivelRiesgoCalculado}
                                        </span>
                                    </label>
                                ))}
                                {riesgos.length === 0 && (
                                    <p className="text-sm text-neutral-500 p-2">No hay riesgos registrados</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-8"
                    >
                        {isSubmitting ? "Guardando..." : "Crear Acción"}
                    </button>
                    <Link href="/dashboard/acciones" className="btn-outline">
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
}
