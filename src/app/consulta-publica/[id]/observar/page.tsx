"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, ArrowLeft, Info, Send } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export default function EnviarObservacionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        seccionPlan: "",
        contenidoObservacion: "",
        propuestaCiudadana: "",
        esAnonimo: false,
        organizacionRepresentada: "",
    });
    const [consulta, setConsulta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchConsulta();
    }, [params.id]);

    const fetchConsulta = async () => {
        try {
            const response = await fetch(`${API_URL}/api/participacion/consultas/${params.id}`);
            const result = await response.json() as { data: any };
            const { data } = result;
            setConsulta(data);
        } catch (error) {
            console.error("Error fetching consulta:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/participacion/observaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: consulta.planId,
                    ...formData,
                }),
            });

            const result = await response.json() as { error?: string };

            if (!response.ok) {
                throw new Error(result.error || "Error al enviar observación");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
                        ¡Observación Enviada!
                    </h1>
                    <p className="text-neutral-600 mb-6">
                        Tu observación ha sido registrada exitosamente.
                        El municipio tiene la obligación de responderla con justificación.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href={`/consulta-publica/${params.id}`}
                            className="block btn-primary w-full"
                        >
                            Ver Plan
                        </Link>
                        <Link
                            href="/consulta-publica"
                            className="block text-primary-600 hover:underline"
                        >
                            ← Volver a Consultas
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <Link href="/consulta-publica" className="text-primary-600 hover:underline text-sm">
                        ← Volver a Consultas Públicas
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200">
                    <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
                        Enviar Observación Ciudadana
                    </h1>
                    <p className="text-neutral-600 mb-6">
                        {consulta?.plan?.nombrePlan}
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sección */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Sección del Plan *
                            </label>
                            <select
                                value={formData.seccionPlan}
                                onChange={(e) => setFormData({ ...formData, seccionPlan: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="">Selecciona una sección</option>
                                <option value="Diagnóstico General">Diagnóstico General</option>
                                <option value="Inventario GEI">Inventario GEI</option>
                                <option value="Amenazas">Amenazas</option>
                                <option value="Vulnerabilidades">Vulnerabilidades</option>
                                <option value="Riesgos">Evaluación de Riesgos</option>
                                <option value="Acciones">Cartera de Acciones</option>
                                <option value="Indicadores">Indicadores</option>
                                <option value="Gobernanza">Gobernanza</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {/* Observación */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Tu Observación *
                            </label>
                            <textarea
                                value={formData.contenidoObservacion}
                                onChange={(e) => setFormData({ ...formData, contenidoObservacion: e.target.value })}
                                className="input-field min-h-[150px]"
                                placeholder="Describe tu observación, comentario o sugerencia..."
                                required
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Mínimo 10 caracteres
                            </p>
                        </div>

                        {/* Propuesta */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Propuesta (opcional)
                            </label>
                            <textarea
                                value={formData.propuestaCiudadana}
                                onChange={(e) => setFormData({ ...formData, propuestaCiudadana: e.target.value })}
                                className="input-field min-h-[100px]"
                                placeholder="Si tienes una propuesta concreta, descríbela aquí..."
                            />
                        </div>

                        {/* Organización */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                ¿Representas a alguna organización? (opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.organizacionRepresentada}
                                onChange={(e) => setFormData({ ...formData, organizacionRepresentada: e.target.value })}
                                className="input-field"
                                placeholder="Ej: Junta de Vecinos, ONG, etc."
                            />
                        </div>

                        {/* Anónimo */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="esAnonimo"
                                checked={formData.esAnonimo}
                                onChange={(e) => setFormData({ ...formData, esAnonimo: e.target.checked })}
                                className="w-4 h-4 rounded border-neutral-300"
                            />
                            <label htmlFor="esAnonimo" className="text-sm text-neutral-700">
                                Enviar de forma anónima
                            </label>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                                <Info className="w-4 h-4" />
                                Importante
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Tu observación será revisada por el equipo municipal</li>
                                <li>• Recibirás una respuesta oficial con justificación</li>
                                <li>• Todas las observaciones se incluyen en el informe de consulta</li>
                            </ul>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 btn-primary py-3 disabled:opacity-50"
                            >
                                {isSubmitting ? "Enviando..." : "Enviar Observación"}
                            </button>
                            <Link
                                href="/consulta-publica"
                                className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
