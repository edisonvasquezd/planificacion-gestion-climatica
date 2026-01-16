"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);

export default function MapaPage() {
    const [mounted, setMounted] = useState(false);
    const [layers, setLayers] = useState({
        amenazas: true,
        vulnerabilidades: true,
        riesgos: true,
        acciones: false,
        activos: true,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="p-6 lg:p-8">
                <div className="bg-neutral-100 rounded-xl h-[600px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-neutral-600">Cargando mapa...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-heading font-bold text-neutral-900">
                            Visor SIG
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Sistema de Información Geográfica integrado
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                            📤 Exportar
                        </button>
                        <button className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium">
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-neutral-200 p-4 overflow-y-auto">
                    <h3 className="font-semibold text-neutral-900 mb-3">Capas</h3>

                    <div className="space-y-2">
                        {[
                            { key: "amenazas", label: "Amenazas", color: "bg-red-500" },
                            { key: "vulnerabilidades", label: "Vulnerabilidades", color: "bg-orange-500" },
                            { key: "riesgos", label: "Polígonos de Riesgo", color: "bg-yellow-500" },
                            { key: "activos", label: "Activos Críticos", color: "bg-blue-500" },
                            { key: "acciones", label: "Acciones", color: "bg-green-500" },
                        ].map((layer) => (
                            <label
                                key={layer.key}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={layers[layer.key as keyof typeof layers]}
                                    onChange={(e) =>
                                        setLayers({ ...layers, [layer.key]: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-neutral-300"
                                />
                                <div className={`w-3 h-3 rounded-full ${layer.color}`}></div>
                                <span className="text-sm text-neutral-700">{layer.label}</span>
                            </label>
                        ))}
                    </div>

                    <hr className="my-4" />

                    <h3 className="font-semibold text-neutral-900 mb-3">Capas Base</h3>
                    <div className="space-y-2">
                        {[
                            { label: "División Comunal", icon: "🗺️" },
                            { label: "Red Vial", icon: "🛣️" },
                            { label: "Hidrografía", icon: "💧" },
                            { label: "Uso de Suelo", icon: "🌾" },
                            { label: "Áreas Protegidas", icon: "🌲" },
                        ].map((base, idx) => (
                            <label
                                key={idx}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                            >
                                <input type="checkbox" className="w-4 h-4 rounded border-neutral-300" />
                                <span>{base.icon}</span>
                                <span className="text-sm text-neutral-700">{base.label}</span>
                            </label>
                        ))}
                    </div>

                    <hr className="my-4" />

                    <h3 className="font-semibold text-neutral-900 mb-3">Fuentes Externas</h3>
                    <div className="space-y-2 text-sm">
                        <button className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
                            🌡️ ARClim (Proyecciones)
                        </button>
                        <button className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
                            🚨 SENAPRED (Alertas)
                        </button>
                        <button className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 text-neutral-600">
                            🗺️ IDE Chile (WMS)
                        </button>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={[-33.45, -70.65]}
                        zoom={10}
                        className="h-full w-full"
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </MapContainer>

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-white rounded-xl p-4 shadow-lg border border-neutral-200 z-[1000]">
                        <h4 className="font-semibold text-sm text-neutral-900 mb-2">Leyenda</h4>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
                                <span>Riesgo Crítico</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-orange-500 rounded opacity-60"></div>
                                <span>Riesgo Alto</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded opacity-60"></div>
                                <span>Riesgo Medio</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded opacity-60"></div>
                                <span>Riesgo Bajo</span>
                            </div>
                        </div>
                    </div>

                    {/* Coordinates */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-neutral-600 z-[1000]">
                        📍 -33.4500, -70.6500
                    </div>
                </div>
            </div>
        </div>
    );
}
