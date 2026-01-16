"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
    LayoutDashboard,
    FileText,
    Search,
    AlertTriangle,
    Target,
    BarChart3,
    Building2,
    Users,
    Map,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Globe,
    Shield,
    UserCog,
    User,
} from "lucide-react";

// Base navigation for all organizational users
const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Planes", href: "/dashboard/planes", icon: FileText },
    { name: "Diagnóstico", href: "/dashboard/diagnosticos", icon: Search },
    { name: "Riesgos", href: "/dashboard/riesgos", icon: AlertTriangle },
    { name: "Acciones", href: "/dashboard/acciones", icon: Target },
    { name: "Indicadores", href: "/dashboard/indicadores", icon: BarChart3 },
    { name: "Gobernanza", href: "/dashboard/actores", icon: Building2 },
    { name: "Participación", href: "/dashboard/participacion", icon: Users },
    { name: "Mapa", href: "/dashboard/mapa", icon: Map },
];

// Admin-only navigation items
const adminNavigation = [
    { name: "Usuarios", href: "/dashboard/usuarios", icon: UserCog },
];

// Super admin link
const superAdminLink = { name: "Panel Admin", href: "/admin", icon: Shield };

// Function to get navigation based on user role
const getNavigation = (rol: string | undefined) => {
    const nav = [...baseNavigation];

    // Add user management for admins (both org and platform)
    if (rol === "Administrador" || rol === "Administrador Plataforma") {
        nav.push(...adminNavigation);
    }

    // Add super admin panel link
    if (rol === "Administrador Plataforma") {
        nav.push(superAdminLink);
    }

    return nav;
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user, logout, impersonatingOrg, stopImpersonation } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const handleStopImpersonation = async () => {
        setIsExiting(true);
        await stopImpersonation();
        window.location.href = "/admin/organizaciones";
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar - Material Design Navigation Rail/Drawer */}
            <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200">
                {/* Logo Header */}
                <div className="flex items-center h-16 px-6">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="font-heading font-medium text-neutral-900 text-lg block leading-tight">
                                RESILIAI
                            </span>
                            <span className="text-xs text-neutral-500">
                                Resiliencia Climática Inteligente
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto">
                    <div className="space-y-1">
                        {getNavigation(user?.rol).map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const isAdminLink = item.href === "/admin";

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                                        isAdminLink
                                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            : isActive
                                            ? "bg-primary-100 text-primary-700"
                                            : "text-neutral-700 hover:bg-neutral-100"
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isAdminLink ? "text-amber-600" : isActive ? "text-primary-600" : "text-neutral-500"}`} />
                                    <span className="flex-1">{item.name}</span>
                                    {isActive && !isAdminLink && <ChevronRight className="w-4 h-4 text-primary-400" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-neutral-100">
                    <Link
                        href="/dashboard/perfil"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                            {user?.nombreCompleto?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                                {user?.nombreCompleto}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                                {user?.rol}
                            </p>
                        </div>
                        <User className="w-4 h-4 text-neutral-400" />
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="mt-2 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-danger-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-elevation-1">
                <div className="flex items-center justify-between h-14 px-4">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="btn-icon"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading font-medium text-neutral-900">RESILIAI</span>
                    </Link>
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
                        {user?.nombreCompleto?.charAt(0) || "U"}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-dialog animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-heading font-medium text-neutral-900">RESILIAI</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="btn-icon"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="px-3 py-4 overflow-y-auto">
                            {getNavigation(user?.rol).map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                const isAdminLink = item.href === "/admin";

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium mb-1 ${
                                            isAdminLink
                                                ? "bg-amber-50 text-amber-700"
                                                : isActive
                                                ? "bg-primary-100 text-primary-700"
                                                : "text-neutral-700 hover:bg-neutral-100"
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isAdminLink ? "text-amber-600" : isActive ? "text-primary-600" : "text-neutral-500"}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100 bg-white">
                            <Link
                                href="/dashboard/perfil"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-neutral-50"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                    {user?.nombreCompleto?.charAt(0) || "U"}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-900">{user?.nombreCompleto}</p>
                                    <p className="text-xs text-neutral-500">{user?.rol}</p>
                                </div>
                                <User className="w-4 h-4 text-neutral-400" />
                            </Link>
                            <button
                                onClick={() => { logout(); setMobileMenuOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-danger-600 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 lg:ml-72">
                {/* Impersonation Banner */}
                {impersonatingOrg && (
                    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            <span className="font-medium">
                                Viendo como: {impersonatingOrg.nombre}
                            </span>
                        </div>
                        <button
                            onClick={handleStopImpersonation}
                            disabled={isExiting}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                            {isExiting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <X className="w-4 h-4" />
                            )}
                            Salir
                        </button>
                    </div>
                )}
                <div className={`${impersonatingOrg ? 'pt-14 lg:pt-0' : 'pt-14 lg:pt-0'} min-h-screen`}>
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
