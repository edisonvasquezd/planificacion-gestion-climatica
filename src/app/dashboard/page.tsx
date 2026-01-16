"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    FileText,
    Search,
    AlertTriangle,
    Target,
    BarChart3,
    Building2,
    Users,
    Map,
    Plus,
    FileBarChart,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const modules = [
        {
            title: "Planes",
            description: "Gestión de PACCC y PGRD",
            href: "/dashboard/planes",
            icon: FileText,
            color: "bg-primary-600",
        },
        {
            title: "Diagnóstico",
            description: "GEI, Amenazas, Vulnerabilidades",
            href: "/dashboard/diagnosticos",
            icon: Search,
            color: "bg-blue-600",
        },
        {
            title: "Matriz de Riesgos",
            description: "Análisis y priorización",
            href: "/dashboard/riesgos",
            icon: AlertTriangle,
            color: "bg-orange-500",
        },
        {
            title: "Acciones",
            description: "Cartera y verificador SbN",
            href: "/dashboard/acciones",
            icon: Target,
            color: "bg-secondary-600",
        },
        {
            title: "Indicadores",
            description: "Monitoreo y mediciones",
            href: "/dashboard/indicadores",
            icon: BarChart3,
            color: "bg-purple-600",
        },
        {
            title: "Gobernanza",
            description: "Actores y COGRID",
            href: "/dashboard/actores",
            icon: Building2,
            color: "bg-teal-600",
        },
        {
            title: "Participación",
            description: "Consulta pública",
            href: "/dashboard/participacion",
            icon: Users,
            color: "bg-pink-600",
        },
        {
            title: "Mapa",
            description: "Visor geoespacial",
            href: "/dashboard/mapa",
            icon: Map,
            color: "bg-emerald-600",
        },
    ];

    const stats = [
        { label: "Planes Activos", value: "3", trend: "+1", positive: true, icon: FileText },
        { label: "Acciones en Ejecución", value: "12", trend: "+4", positive: true, icon: Activity },
        { label: "Riesgos Críticos", value: "2", trend: "-1", positive: true, icon: AlertTriangle },
        { label: "Observaciones Pendientes", value: "8", trend: "+3", positive: false, icon: Clock },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-medium text-neutral-900">
                    Bienvenido, {user.nombreCompleto.split(" ")[0]}
                </h1>
                <p className="text-neutral-600 mt-1">
                    Panel de control de la Plataforma de Gestión de Riesgos Climáticos
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-lg p-5 shadow-elevation-1"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-neutral-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${
                                stat.positive ? "text-secondary-600" : "text-danger-600"
                            }`}>
                                {stat.positive ? (
                                    <TrendingUp className="w-4 h-4" />
                                ) : (
                                    <TrendingDown className="w-4 h-4" />
                                )}
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-3xl font-normal text-neutral-900">{stat.value}</p>
                        <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Modules Grid */}
            <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                    Módulos del Sistema
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {modules.map((module) => (
                        <Link
                            key={module.title}
                            href={module.href}
                            className="group bg-white rounded-lg p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200"
                        >
                            <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                                <module.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-neutral-500 mt-1">{module.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-elevation-1 p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Acciones Rápidas</h3>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/planes/nuevo"
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Plan
                    </Link>
                    <Link
                        href="/dashboard/acciones/nueva"
                        className="btn-outline"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Acción
                    </Link>
                    <Link
                        href="/dashboard/indicadores"
                        className="btn-outline"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Registrar Medición
                    </Link>
                    <Link
                        href="/dashboard/participacion"
                        className="btn-ghost"
                    >
                        <FileBarChart className="w-4 h-4" />
                        Ver Reportes
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-elevation-1">
                <div className="px-6 py-4 border-b border-neutral-100">
                    <h3 className="font-medium text-neutral-900">Actividad Reciente</h3>
                </div>
                <div className="divide-y divide-neutral-100">
                    {[
                        { icon: CheckCircle2, color: "text-secondary-600", text: "Plan PACCC actualizado", time: "Hace 2 horas" },
                        { icon: AlertCircle, color: "text-accent-600", text: "Nueva observación ciudadana recibida", time: "Hace 4 horas" },
                        { icon: Target, color: "text-primary-600", text: "Acción de mitigación completada", time: "Hace 1 día" },
                        { icon: BarChart3, color: "text-purple-600", text: "Medición de indicador registrada", time: "Hace 2 días" },
                    ].map((activity, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                            <div className={`w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center ${activity.color}`}>
                                <activity.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-neutral-900">{activity.text}</p>
                                <p className="text-xs text-neutral-500">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
