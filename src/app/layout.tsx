import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "RESILIAI - Resiliencia Climática Inteligente",
        template: "%s | RESILIAI",
    },
    description:
        "Plataforma integral para la gestión coordinada de Planes de Acción Comunal de Cambio Climático (PACCC) y Planes de Gestión de Riesgo de Desastres (PGRD).",
    keywords: [
        "cambio climático",
        "gestión de riesgo",
        "desastres",
        "municipalidad",
        "PACCC",
        "PGRD",
        "resiliencia climática",
        "RESILIAI",
    ],
    openGraph: {
        type: "website",
        locale: "es_CL",
        siteName: "RESILIAI",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
            <body className="min-h-screen bg-neutral-50 font-sans antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
