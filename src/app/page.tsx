import Link from "next/link";
import { Globe, ClipboardList, Search, AlertTriangle, Target, BarChart3, Building2, Users, Map, Leaf, Check, Thermometer, Siren, Sprout } from "lucide-react";

export default function HomePage() {
    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <Globe className="w-8 h-8 text-primary-600" />
                            <div className="flex flex-col">
                                <span className="font-heading font-bold text-xl text-primary-600">
                                    PGRC Platform
                                </span>
                                <span className="text-[10px] text-neutral-500 -mt-1">by CHUCAW + JHEDAI</span>
                            </div>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="#caracteristicas" className="text-neutral-600 hover:text-primary-600 transition-colors">
                                Características
                            </Link>
                            <Link href="#marco-legal" className="text-neutral-600 hover:text-primary-600 transition-colors">
                                Marco Legal
                            </Link>
                            <Link href="/consulta-publica" className="text-neutral-600 hover:text-primary-600 transition-colors">
                                Consulta Pública
                            </Link>
                        </nav>
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login" className="btn-ghost hidden sm:inline-flex">
                                Iniciar Sesión
                            </Link>
                            <Link href="/auth/register" className="btn-primary">
                                Registrarse
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-secondary-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-secondary-300 text-sm font-medium mb-6">
                        Sector Público y Privado • Ley 21.455 • Ley 21.364
                    </span>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
                        Plataforma de Gestión de{" "}
                        <span className="text-gradient bg-gradient-to-r from-secondary-400 to-accent-400 bg-clip-text text-transparent">
                            Riesgos Climáticos
                        </span>{" "}
                        y Desastres
                    </h1>
                    <p className="text-xl text-neutral-300 max-w-2xl mx-auto mb-10">
                        Sistema integral para organizaciones públicas y privadas. Gestiona Planes de Acción
                        de Cambio Climático (PACCC) y Planes de Gestión de Riesgo de Desastres (PGRD).
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/register" className="btn-primary px-8 py-3 text-lg">
                            Comenzar Ahora →
                        </Link>
                        <Link href="/consulta-publica" className="btn-outline border-white text-white hover:bg-white/10 px-8 py-3 text-lg">
                            Participación Ciudadana
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "500+", label: "Organizaciones Activas" },
                            { value: "120", label: "Planes PACCC Activos" },
                            { value: "180", label: "Planes PGRD Activos" },
                            { value: "3,200+", label: "Acciones Registradas" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-primary-600">{stat.value}</p>
                                <p className="text-neutral-600 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="caracteristicas" className="py-20 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-neutral-900 mb-4">
                            Módulos Integrados
                        </h2>
                        <p className="text-neutral-600 max-w-2xl mx-auto">
                            Una plataforma completa que unifica la gestión de cambio climático y
                            reducción de riesgo de desastres para el sector público y privado.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: ClipboardList, title: "Gestión de Planes", desc: "PACCC y PGRD con versionado y trazabilidad", color: "text-primary-600" },
                            { icon: Search, title: "Diagnóstico", desc: "Inventario GEI, amenazas y vulnerabilidades", color: "text-blue-600" },
                            { icon: AlertTriangle, title: "Matriz de Riesgos", desc: "Análisis cruzado y priorización", color: "text-orange-600" },
                            { icon: Target, title: "Cartera de Acciones", desc: "Con verificador SbN-UICN integrado", color: "text-secondary-600" },
                            { icon: BarChart3, title: "Indicadores", desc: "Monitoreo de impacto y co-beneficios", color: "text-purple-600" },
                            { icon: Building2, title: "Gobernanza", desc: "COGRID y actores multiescala", color: "text-indigo-600" },
                            { icon: Users, title: "Participación", desc: "Consulta pública según Ley 21.455", color: "text-teal-600" },
                            { icon: Map, title: "Visor SIG", desc: "Capas georreferenciadas integradas", color: "text-emerald-600" },
                        ].map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group bg-white rounded-xl p-6 border border-neutral-200
                             hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className={`mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                                        <Icon className="w-10 h-10" />
                                    </div>
                                    <h3 className="font-semibold text-neutral-900 mb-2">{feature.title}</h3>
                                    <p className="text-sm text-neutral-600">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* SbN Section */}
            <section className="py-20 bg-gradient-to-r from-secondary-600 to-emerald-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                                <Leaf className="w-4 h-4" />
                                Soluciones basadas en la Naturaleza
                            </span>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                                Verificador SbN con Estándar Global UICN
                            </h2>
                            <p className="text-lg opacity-90 mb-6">
                                Todas las acciones tipo SbN son verificadas contra los 8 criterios del
                                Estándar Global de UICN, garantizando soluciones efectivas que benefician
                                tanto a las personas como a la naturaleza.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    "Desafío Social",
                                    "Escala Paisaje",
                                    "Biodiversidad",
                                    "Viabilidad Económica",
                                    "Gobernanza",
                                    "Trade-offs",
                                    "Monitoreo",
                                    "Sostenibilidad",
                                ].map((criterio, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-300" />
                                        <span className="text-sm">{criterio}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <Sprout className="w-16 h-16 text-emerald-300" />
                                </div>
                                <p className="text-2xl font-bold mb-2">34%</p>
                                <p className="opacity-90">de las acciones registradas son SbN</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Legal Framework */}
            <section id="marco-legal" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-neutral-900 mb-4">
                            Marco Legal y Normativo
                        </h2>
                        <p className="text-neutral-600 max-w-2xl mx-auto">
                            Diseñado en cumplimiento con la legislación chilena vigente
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                    <Thermometer className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-900 text-lg">Ley 21.455</h3>
                                    <p className="text-primary-700">Marco de Cambio Climático</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-primary-800">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Planes de Acción Comunal obligatorios</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Consulta pública mínimo 30 días</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Participación ciudadana vinculante</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Reporte anual de indicadores</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center text-white">
                                    <Siren className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-orange-900 text-lg">Ley 21.364</h3>
                                    <p className="text-orange-700">Sistema Nacional de Emergencias</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-orange-800">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>SENAPRED como ente rector</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>COGRID a nivel comunal</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Ciclo de gestión de riesgo integrado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Activos críticos identificados</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-neutral-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
                        Comienza a Gestionar Tus Planes Hoy
                    </h2>
                    <p className="text-neutral-400 text-lg mb-8">
                        Únete a las organizaciones públicas y privadas que ya están usando la plataforma
                        para gestionar sus riesgos climáticos de forma eficiente.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/register" className="btn-primary px-8 py-3 text-lg">
                            Crear Cuenta Organizacional
                        </Link>
                        <Link href="/consulta-publica" className="btn-ghost text-white border border-white/30 px-8 py-3 text-lg">
                            Participación Ciudadana
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-neutral-950 text-neutral-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-6 h-6 text-primary-400" />
                                <span className="font-heading font-bold text-white">PGRC Platform</span>
                            </div>
                            <p className="text-sm mb-3">
                                Plataforma integrada para la gestión de riesgos climáticos
                                y desastres para el sector público y privado.
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-neutral-500">Desarrollado por</span>
                                <span className="font-semibold text-white">CHUCAW</span>
                                <span className="text-neutral-500">+</span>
                                <span className="font-semibold text-white">JHEDAI</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Plataforma</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/auth/login" className="hover:text-white">Acceso Organizacional</Link></li>
                                <li><Link href="/consulta-publica" className="hover:text-white">Consulta Pública</Link></li>
                                <li><Link href="#" className="hover:text-white">Documentación</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Marco Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Ley 21.455</a></li>
                                <li><a href="#" className="hover:text-white">Ley 21.364</a></li>
                                <li><a href="#" className="hover:text-white">Estándar UICN SbN</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Soporte</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Mesa de Ayuda</a></li>
                                <li><a href="#" className="hover:text-white">Capacitaciones</a></li>
                                <li><a href="#" className="hover:text-white">Contacto</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p>© 2026 CHUCAW. Todos los derechos reservados.</p>
                        <p className="text-neutral-500">Partner tecnológico: JHEDAI</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
