"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Users, Building2, UserPlus, FileText, Trash2, Mail, Phone, User, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Actor {
    actorId: string;
    nombreActor: string;
    tipoActor: string;
    rolEnPlan: string;
    contactoNombre: string | null;
    contactoEmail: string | null;
    contactoTelefono: string | null;
    actasReunion: string;
}

interface ResumenGobernanza {
    total: number;
    porTipo: Record<string, number>;
    porRol: Record<string, number>;
    totalActas: number;
}

export default function ActoresPage() {
    const { token } = useAuth();
    const [actores, setActores] = useState<Actor[]>([]);
    const [resumen, setResumen] = useState<ResumenGobernanza | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ tipo: "", rol: "" });
    const [showForm, setShowForm] = useState(false);
    const [showActaForm, setShowActaForm] = useState(false);
    const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
    const [showActas, setShowActas] = useState(false);

    const [formData, setFormData] = useState({
        nombreActor: "",
        tipoActor: "Organismo Público",
        rolEnPlan: "Coordinador",
        contactoNombre: "",
        contactoEmail: "",
        contactoTelefono: "",
    });

    const [actaData, setActaData] = useState({
        fecha: new Date().toISOString().split("T")[0],
        titulo: "",
        descripcion: "",
        participantes: "",
        acuerdos: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchActores();
        fetchResumen();
    }, [token]);

    const fetchActores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/actores`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setActores(data || []);
        } catch (error) {
            console.error("Error fetching actores:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchResumen = async () => {
        try {
            const response = await fetch(`${API_URL}/api/actores/resumen/gobernanza`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data } = await response.json();
            setResumen(data);
        } catch (error) {
            console.error("Error fetching resumen:", error);
        }
    };

    const handleCreateActor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/api/actores`, {
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
                    nombreActor: "",
                    tipoActor: "Organismo Público",
                    rolEnPlan: "Coordinador",
                    contactoNombre: "",
                    contactoEmail: "",
                    contactoTelefono: "",
                });
                fetchActores();
                fetchResumen();
            }
        } catch (error) {
            console.error("Error creating actor:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddActa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActor) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/actores/${selectedActor.actorId}/actas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(actaData),
            });

            if (res.ok) {
                setShowActaForm(false);
                setActaData({
                    fecha: new Date().toISOString().split("T")[0],
                    titulo: "",
                    descripcion: "",
                    participantes: "",
                    acuerdos: "",
                });
                fetchActores();
                fetchResumen();
            }
        } catch (error) {
            console.error("Error adding acta:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (actorId: string) => {
        if (!confirm("¿Eliminar este actor?")) return;

        try {
            await fetch(`${API_URL}/api/actores/${actorId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchActores();
            fetchResumen();
        } catch (error) {
            console.error("Error deleting actor:", error);
        }
    };

    const openActas = (actor: Actor) => {
        setSelectedActor(actor);
        setShowActas(true);
    };

    const openActaForm = (actor: Actor) => {
        setSelectedActor(actor);
        setShowActaForm(true);
    };

    const getActas = (actor: Actor) => {
        try {
            return JSON.parse(actor.actasReunion || "[]");
        } catch {
            return [];
        }
    };

    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            "Organismo Público": "bg-blue-100 text-blue-700",
            "Privado": "bg-purple-100 text-purple-700",
            "Sociedad Civil": "bg-green-100 text-green-700",
            "Academia": "bg-orange-100 text-orange-700",
        };
        return colors[tipo] || "bg-gray-100 text-gray-700";
    };

    const getRolColor = (rol: string) => {
        const colors: Record<string, string> = {
            "Coordinador": "bg-primary-100 text-primary-700",
            "Implementador": "bg-secondary-100 text-secondary-700",
            "Fiscalizador": "bg-red-100 text-red-700",
            "Consultivo": "bg-yellow-100 text-yellow-700",
        };
        return colors[rol] || "bg-gray-100 text-gray-700";
    };

    const filteredActores = actores.filter((actor) => {
        if (filter.tipo && actor.tipoActor !== filter.tipo) return false;
        if (filter.rol && actor.rolEnPlan !== filter.rol) return false;
        return true;
    });

    const TIPOS_ACTOR = ["Organismo Público", "Privado", "Sociedad Civil", "Academia"];
    const ROLES = ["Coordinador", "Implementador", "Fiscalizador", "Consultivo"];

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-neutral-900">
                        Gobernanza y Actores
                    </h1>
                    <p className="text-neutral-600 mt-1">
                        COGRID (Ley 21.364) y Comité Ambiental Comunal
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                    + Nuevo Actor
                </button>
            </div>

            {/* Form Nuevo Actor */}
            {showForm && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Registrar Nuevo Actor</h3>
                    <form onSubmit={handleCreateActor} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre del Actor / Organización *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombreActor}
                                    onChange={(e) => setFormData({ ...formData, nombreActor: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Municipalidad de Santiago, CONAF, Universidad de Chile"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Tipo de Actor
                                    </label>
                                    <select
                                        value={formData.tipoActor}
                                        onChange={(e) => setFormData({ ...formData, tipoActor: e.target.value })}
                                        className="input-field"
                                    >
                                        {TIPOS_ACTOR.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Rol en el Plan
                                    </label>
                                    <select
                                        value={formData.rolEnPlan}
                                        onChange={(e) => setFormData({ ...formData, rolEnPlan: e.target.value })}
                                        className="input-field"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Nombre Contacto
                                </label>
                                <input
                                    type="text"
                                    value={formData.contactoNombre}
                                    onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                                    className="input-field"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Email Contacto
                                </label>
                                <input
                                    type="email"
                                    value={formData.contactoEmail}
                                    onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
                                    className="input-field"
                                    placeholder="contacto@org.cl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.contactoTelefono}
                                    onChange={(e) => setFormData({ ...formData, contactoTelefono: e.target.value })}
                                    className="input-field"
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Crear Actor"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Form Nueva Acta */}
            {showActaForm && selectedActor && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mb-6">
                    <h3 className="font-semibold text-amber-900 mb-2">
                        Nueva Acta de Reunión
                    </h3>
                    <p className="text-sm text-amber-700 mb-4">Actor: {selectedActor.nombreActor}</p>
                    <form onSubmit={handleAddActa} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Fecha de Reunión *
                                </label>
                                <input
                                    type="date"
                                    value={actaData.fecha}
                                    onChange={(e) => setActaData({ ...actaData, fecha: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Título / Tema *
                                </label>
                                <input
                                    type="text"
                                    value={actaData.titulo}
                                    onChange={(e) => setActaData({ ...actaData, titulo: e.target.value })}
                                    className="input-field"
                                    placeholder="Ej: Sesión ordinaria COGRID"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Participantes
                            </label>
                            <input
                                type="text"
                                value={actaData.participantes}
                                onChange={(e) => setActaData({ ...actaData, participantes: e.target.value })}
                                className="input-field"
                                placeholder="Nombres de los participantes separados por coma"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Descripción / Resumen
                            </label>
                            <textarea
                                value={actaData.descripcion}
                                onChange={(e) => setActaData({ ...actaData, descripcion: e.target.value })}
                                className="input-field"
                                rows={3}
                                placeholder="Resumen de los temas tratados..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Acuerdos / Compromisos
                            </label>
                            <textarea
                                value={actaData.acuerdos}
                                onChange={(e) => setActaData({ ...actaData, acuerdos: e.target.value })}
                                className="input-field"
                                rows={2}
                                placeholder="Lista de acuerdos tomados..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Acta"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowActaForm(false);
                                    setSelectedActor(null);
                                }}
                                className="btn-outline"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Ver Actas */}
            {showActas && selectedActor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-neutral-900">
                                    Actas de Reunión
                                </h3>
                                <p className="text-sm text-neutral-600">{selectedActor.nombreActor}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowActas(false);
                                    setSelectedActor(null);
                                }}
                                className="text-neutral-500 hover:text-neutral-700"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {getActas(selectedActor).length === 0 ? (
                                <p className="text-center text-neutral-500 py-8">
                                    No hay actas registradas para este actor
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {getActas(selectedActor).map((acta: any, idx: number) => (
                                        <div key={idx} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium">{acta.titulo}</h4>
                                                <span className="text-sm text-neutral-500">
                                                    {new Date(acta.fecha).toLocaleDateString("es-CL")}
                                                </span>
                                            </div>
                                            {acta.participantes && (
                                                <p className="text-sm text-neutral-600 mb-2">
                                                    <strong>Participantes:</strong> {acta.participantes}
                                                </p>
                                            )}
                                            {acta.descripcion && (
                                                <p className="text-sm text-neutral-600 mb-2">{acta.descripcion}</p>
                                            )}
                                            {acta.acuerdos && (
                                                <div className="bg-amber-50 rounded p-2 text-sm">
                                                    <strong className="text-amber-800">Acuerdos:</strong>
                                                    <p className="text-amber-700">{acta.acuerdos}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => {
                                    setShowActas(false);
                                    openActaForm(selectedActor);
                                }}
                                className="btn-primary w-full"
                            >
                                + Agregar Nueva Acta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen */}
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Total Actores</p>
                        <p className="text-2xl font-bold text-neutral-900">{resumen.total}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-blue-600">Organismos Públicos</p>
                        <p className="text-2xl font-bold text-blue-700">{resumen.porTipo["Organismo Público"] || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-sm text-green-600">Sociedad Civil</p>
                        <p className="text-2xl font-bold text-green-700">{resumen.porTipo["Sociedad Civil"] || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-neutral-200">
                        <p className="text-sm text-neutral-500">Actas Registradas</p>
                        <p className="text-2xl font-bold text-neutral-900">{resumen.totalActas}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-neutral-200">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tipo de Actor
                        </label>
                        <select
                            value={filter.tipo}
                            onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
                            className="input-field w-48"
                        >
                            <option value="">Todos</option>
                            {TIPOS_ACTOR.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Rol
                        </label>
                        <select
                            value={filter.rol}
                            onChange={(e) => setFilter({ ...filter, rol: e.target.value })}
                            className="input-field w-40"
                        >
                            <option value="">Todos</option>
                            {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Actores Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredActores.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                    <div className="flex justify-center mb-3">
                        <Users className="w-12 h-12 text-neutral-300" />
                    </div>
                    <p className="text-neutral-500">No hay actores registrados</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredActores.map((actor) => {
                        const actas = getActas(actor);
                        return (
                            <div
                                key={actor.actorId}
                                className="bg-white rounded-xl p-5 border border-neutral-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(actor.tipoActor)}`}>
                                        {actor.tipoActor}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRolColor(actor.rolEnPlan)}`}>
                                        {actor.rolEnPlan}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-neutral-900 mb-2">{actor.nombreActor}</h3>

                                {actor.contactoNombre && (
                                    <p className="text-sm text-neutral-600">
                                        {actor.contactoNombre}
                                    </p>
                                )}
                                {actor.contactoEmail && (
                                    <p className="text-sm text-neutral-500">
                                        {actor.contactoEmail}
                                    </p>
                                )}
                                {actor.contactoTelefono && (
                                    <p className="text-sm text-neutral-500">
                                        {actor.contactoTelefono}
                                    </p>
                                )}

                                <div className="mt-3 text-sm text-neutral-500">
                                    {actas.length} acta(s) registrada(s)
                                </div>

                                <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2">
                                    <button
                                        onClick={() => openActas(actor)}
                                        className="text-sm text-primary-600 hover:underline"
                                    >
                                        Ver actas
                                    </button>
                                    <span className="text-neutral-300">|</span>
                                    <button
                                        onClick={() => openActaForm(actor)}
                                        className="text-sm text-secondary-600 hover:underline"
                                    >
                                        + Acta
                                    </button>
                                    <span className="text-neutral-300">|</span>
                                    <button
                                        onClick={() => handleDelete(actor.actorId)}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
