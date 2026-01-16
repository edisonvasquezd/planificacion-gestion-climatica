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
} from "lucide-react";

const navigation = [
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                                PGRC
                            </span>
                            <span className="text-xs text-neutral-500">
                                Gestión de Riesgos Climáticos
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                            ? "bg-primary-100 text-primary-700"
                                            : "text-neutral-700 hover:bg-neutral-100"
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-neutral-500"}`} />
                                    <span className="flex-1">{item.name}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 text-primary-400" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
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
                    </div>
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
                        <span className="font-heading font-medium text-neutral-900">PGRC</span>
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
                                <span className="font-heading font-medium text-neutral-900">PGRC</span>
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
                            {navigation.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium mb-1 ${isActive
                                                ? "bg-primary-100 text-primary-700"
                                                : "text-neutral-700 hover:bg-neutral-100"
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-neutral-500"}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100 bg-white">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                    {user?.nombreCompleto?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900">{user?.nombreCompleto}</p>
                                    <p className="text-xs text-neutral-500">{user?.rol}</p>
                                </div>
                            </div>
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
                <div className="pt-14 lg:pt-0 min-h-screen">
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
