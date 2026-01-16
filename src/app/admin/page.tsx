"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Building2,
    Users,
    FileText,
    MessageSquare,
    TrendingUp,
    Activity,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Stats {
    totalOrganizaciones: number;
    totalUsuarios: number;
    usuariosActivos: number;
    totalPlanes: number;
    consultasActivas: number;
    planesPorEstado: Record<string, number>;
    usuariosPorRol: Record<string, number>;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setIsLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Error al cargar estadísticas");
            }

            const { data } = await response.json();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({
        title,
        value,
        icon: Icon,
        color,
        href,
        subtext,
    }: {
        title: string;
        value: number | string;
        icon: any;
        color: string;
        href?: string;
        subtext?: string;
    }) => (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-neutral-500 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-neutral-900">{value}</p>
                    {subtext && (
                        <p className="text-sm text-neutral-500 mt-1">{subtext}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {href && (
                <Link
                    href={href}
                    className="mt-4 inline-flex items-center text-sm text-primary-600 hover:underline"
                >
                    Ver detalles <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 mb-4">{error}</p>
                <button
                    onClick={fetchStats}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">
                        Dashboard de Administración
                    </h1>
                    <p className="text-neutral-600">
                        Vista general de la plataforma RESILIAI
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Organizaciones"
                    value={stats?.totalOrganizaciones || 0}
                    icon={Building2}
                    color="bg-blue-500"
                    href="/admin/organizaciones"
                />
                <StatCard
                    title="Usuarios Totales"
                    value={stats?.totalUsuarios || 0}
                    icon={Users}
                    color="bg-green-500"
                    href="/admin/usuarios"
                    subtext={`${stats?.usuariosActivos || 0} activos`}
                />
                <StatCard
                    title="Planes"
                    value={stats?.totalPlanes || 0}
                    icon={FileText}
                    color="bg-purple-500"
                    href="/admin/planes"
                />
                <StatCard
                    title="Consultas Activas"
                    value={stats?.consultasActivas || 0}
                    icon={MessageSquare}
                    color="bg-amber-500"
                />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plans by Status */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        Planes por Estado
                    </h3>
                    {stats?.planesPorEstado && Object.keys(stats.planesPorEstado).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(stats.planesPorEstado).map(([estado, count]) => (
                                <div key={estado} className="flex items-center justify-between">
                                    <span className="text-neutral-600">{estado}</span>
                                    <span className="font-semibold text-neutral-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-500 text-sm">No hay planes registrados</p>
                    )}
                </div>

                {/* Users by Role */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Usuarios por Rol
                    </h3>
                    {stats?.usuariosPorRol && Object.keys(stats.usuariosPorRol).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(stats.usuariosPorRol).map(([rol, count]) => (
                                <div key={rol} className="flex items-center justify-between">
                                    <span className="text-neutral-600">{rol}</span>
                                    <span className="font-semibold text-neutral-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-500 text-sm">No hay usuarios registrados</p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/admin/organizaciones"
                        className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <Building2 className="w-8 h-8 text-blue-500" />
                        <div>
                            <p className="font-medium text-neutral-900">Gestionar Organizaciones</p>
                            <p className="text-sm text-neutral-500">Ver, crear y editar</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/usuarios"
                        className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <Users className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="font-medium text-neutral-900">Gestionar Usuarios</p>
                            <p className="text-sm text-neutral-500">Roles y permisos</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/planes"
                        className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <FileText className="w-8 h-8 text-purple-500" />
                        <div>
                            <p className="font-medium text-neutral-900">Ver Todos los Planes</p>
                            <p className="text-sm text-neutral-500">Monitoreo global</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
