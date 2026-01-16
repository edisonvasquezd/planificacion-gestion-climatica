"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Shield,
    Building2,
    Users,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface User {
    id: string;
    email: string;
    nombreCompleto: string;
    rol: string;
}

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/organizaciones", label: "Organizaciones", icon: Building2 },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/planes", label: "Planes", icon: FileText },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            router.push("/auth/login?redirect=/admin");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Not authenticated");
            }

            const { data } = await response.json();

            // Check if user is platform admin
            if (data.rol !== "Administrador Plataforma") {
                router.push("/dashboard");
                return;
            }

            setUser(data);
        } catch {
            localStorage.removeItem("auth_token");
            router.push("/auth/login?redirect=/admin");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-neutral-600">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-100">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-neutral-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-4 border-b border-neutral-700">
                    <div className="flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="w-8 h-8 text-amber-500" />
                            <div>
                                <span className="font-bold text-lg">Panel Admin</span>
                                <p className="text-xs text-neutral-400">RESILIAI</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-neutral-800 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                    isActive
                                        ? "bg-primary-600 text-white"
                                        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-700">
                    <div className="mb-3">
                        <p className="text-sm font-medium text-white truncate">
                            {user.nombreCompleto}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            Super Admin
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span>Panel de Administración de Plataforma</span>
                        </div>
                        <Link
                            href="/dashboard"
                            className="text-sm text-primary-600 hover:underline"
                        >
                            Ir al Dashboard →
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
