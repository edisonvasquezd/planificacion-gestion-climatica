import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCLP(value: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    }).format(value);
}

export function formatDate(date: Date | string | null): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
}

export function getRiskColor(nivel: string): string {
    const colors: Record<string, string> = {
        Bajo: "text-green-600 bg-green-100",
        Medio: "text-yellow-600 bg-yellow-100",
        Alto: "text-orange-600 bg-orange-100",
        Crítico: "text-red-600 bg-red-100",
    };
    return colors[nivel] || "text-gray-600 bg-gray-100";
}

export function getEstadoPlanColor(estado: string): string {
    const colors: Record<string, string> = {
        "En elaboración": "text-gray-600 bg-gray-100",
        "En consulta pública": "text-blue-600 bg-blue-100",
        "Vigente": "text-green-600 bg-green-100",
        "Archivado": "text-gray-500 bg-gray-50",
    };
    return colors[estado] || "text-gray-600 bg-gray-100";
}

export function calcPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

export function generateId(): string {
    return crypto.randomUUID();
}
