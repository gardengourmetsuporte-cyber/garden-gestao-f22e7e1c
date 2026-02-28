import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";

export function AnimatedMockup() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 150);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#000000] overflow-hidden group font-sans">

            {/* Dynamic Background Glows inside the mockup - Much higher quality */}
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-emerald-500/20 blur-[100px] rounded-full mix-blend-screen opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[60%] bg-teal-500/15 blur-[80px] rounded-full mix-blend-screen opacity-40 group-hover:opacity-70 transition-opacity duration-1000 delay-100" />
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-screen opacity-30 animate-pulse" />

            {/* High-end micro dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }}
            />

            <div className="flex h-full w-full relative z-10 p-2 sm:p-4 gap-2 sm:gap-4">

                {/* Sidebar - Glassmorphic and floating */}
                <div className={`w-[15%] sm:w-[13%] rounded-2xl border border-white/5 bg-white/[0.01] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-3xl flex flex-col py-6 items-center transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white/10 to-white/0 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <AppIcon name="Orbit" size={16} className="text-emerald-400" />
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col items-center w-full px-2">
                        {[
                            { id: "overview", icon: "LayoutDashboard" },
                            { id: "sales", icon: "LineChart" },
                            { id: "orders", icon: "Clock" },
                            { id: "customers", icon: "Users" },
                            { id: "settings", icon: "Settings2" }
                        ].map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-500 hover:bg-white/5 ${activeTab === item.id
                                        ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10"
                                        : "text-white/30 border border-transparent hover:text-white/70"
                                    }`}
                                style={{ transitionDelay: `${200 + index * 100}ms` }}
                            >
                                <AppIcon name={item.icon} size={18} />
                            </div>
                        ))}
                    </div>

                    {/* User profile avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] mt-auto cursor-pointer">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                            BM
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 h-full flex flex-col space-y-2 sm:space-y-4 overflow-hidden relative">

                    {/* Top Navbar */}
                    <div className={`h-14 sm:h-16 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-3xl flex items-center justify-between px-4 sm:px-6 transition-all duration-1000 delay-200 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                <AppIcon name="Sparkles" size={14} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-xs sm:text-sm tracking-tight leading-none">Visão de Performance</h2>
                                <p className="text-white/40 text-[9px] sm:text-[10px] mt-1">Atualizado há 2 segundos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-white/60 text-[10px] font-medium">Conectado</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                                <AppIcon name="Bell" size={14} className="text-white/50" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 overflow-hidden">

                        {/* Left Column (Charts) */}
                        <div className="flex-1 flex flex-col gap-2 sm:gap-4 min-w-0">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                {[
                                    { label: "Receita (Hoje)", value: "R$ 4.250,00", trend: "+12.5%", color: "text-emerald-400" },
                                    { label: "Pedidos (Hoje)", value: "145", trend: "+5.2%", color: "text-white" }
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className={`relative p-4 sm:p-5 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-3xl overflow-hidden group/kpi transition-all duration-1000 delay-300 ease-out hover:border-white/10 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover/kpi:bg-white/10 transition-colors" />
                                        <div className="text-white/40 text-[10px] sm:text-xs font-medium mb-2 tracking-wide uppercase">{stat.label}</div>
                                        <div className="text-white font-extrabold text-lg sm:text-2xl tracking-tighter mb-2">{stat.value}</div>
                                        <div className={`text-[9px] sm:text-[10px] font-bold flex items-center gap-1 ${stat.color}`}>
                                            <AppIcon name="TrendingUp" size={12} />
                                            {stat.trend} <span className="text-white/30 font-medium ml-1">vs ontem</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Line Chart (SVG Animated) */}
                            <div className={`flex-1 rounded-2xl border border-white/5 bg-[#050505]/50 backdrop-blur-3xl p-4 sm:p-6 flex flex-col relative overflow-hidden transition-all duration-1000 delay-500 ease-out ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Volume Financeiro</div>
                                        <div className="text-white font-bold text-xl tracking-tight">R$ 28.450,00 <span className="text-emerald-400 text-sm ml-2">+18%</span></div>
                                    </div>
                                    <div className="flex gap-2">
                                        {["1D", "7D", "30D"].map(range => (
                                            <div key={range} className={`px-2 py-1 rounded-md text-[9px] font-bold cursor-pointer transition-colors ${range === "7D" ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>{range}</div>
                                        ))}
                                    </div>
                                </div>

                                {/* SVG Line Chart */}
                                <div className="flex-1 w-full relative mt-auto z-10">
                                    {/* Horizontal grid lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                                        {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-px border-t border-dashed border-white" />)}
                                    </div>

                                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        {/* Area gradient */}
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(156, 72%, 40%)" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="hsl(156, 72%, 40%)" stopOpacity="0" />
                                            </linearGradient>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="hsl(190, 90%, 50%)" />
                                                <stop offset="100%" stopColor="hsl(156, 72%, 40%)" />
                                            </linearGradient>
                                        </defs>

                                        {/* Shimmer/Pulse effect on area */}
                                        {isLoaded && (
                                            <path
                                                d="M0,80 C20,60 30,90 50,40 C70,-10 80,50 100,20 L100,100 L0,100 Z"
                                                fill="url(#areaGradient)"
                                                className="animate-[fade-in_2s_ease-out]"
                                            />
                                        )}

                                        {/* Animated Line */}
                                        <path
                                            d="M0,80 C20,60 30,90 50,40 C70,-10 80,50 100,20"
                                            fill="none"
                                            stroke="url(#lineGradient)"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                            style={{
                                                strokeDasharray: 400,
                                                strokeDashoffset: isLoaded ? 0 : 400,
                                                transition: 'stroke-dashoffset 2s cubic-bezier(0.22, 1, 0.36, 1)'
                                            }}
                                        />

                                        {/* Data Point Dots */}
                                        <circle cx="50" cy="40" r="3" fill="#000" stroke="#10b981" strokeWidth="2" className={`transition-all duration-700 delay-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                                        <circle cx="100" cy="20" r="4" fill="#fff" className={`transition-all duration-700 delay-[1200ms] shadow-[0_0_10px_white] ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Activity / Radar) */}
                        <div className={`hidden lg:flex w-1/3 flex-col gap-4 rounded-2xl border border-white/5 bg-[#050505]/50 backdrop-blur-3xl p-5 relative overflow-hidden transition-all duration-1000 delay-700 ease-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>

                            <div className="absolute top-0 right-0 w-full h-[30%] bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

                            <div className="text-white/80 font-bold text-sm mb-6 flex justify-between items-center z-10">
                                Transações Recentes
                                <AppIcon name="ArrowRight" size={14} className="text-white/30 hover:text-white/80 cursor-pointer" />
                            </div>

                            <div className="flex-1 flex flex-col gap-3 relative z-10">
                                {[
                                    { name: "Mesa 12", value: "R$ 145,90", items: "3 itens", time: "Agora" },
                                    { name: "iFood #482", value: "R$ 82,50", items: "1 item", time: "2 min atrás" },
                                    { name: "Balcão (João)", value: "R$ 45,00", items: "2 itens", time: "5 min atrás" },
                                    { name: "Mesa 04", value: "R$ 210,00", items: "5 itens", time: "12 min atrás" }
                                ].map((tx, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-all cursor-default flex justify-between items-center group/tx`}
                                        style={{ transitionDelay: `${900 + (i * 100)}ms`, opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(10px)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/tx:border-emerald-500/30 transition-colors">
                                                <AppIcon name="Receipt" size={12} className="text-white/50 group-hover/tx:text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-white text-xs font-bold leading-none mb-1">{tx.name}</div>
                                                <div className="text-white/30 text-[9px]">{tx.items} • <span className="text-white/20">{tx.time}</span></div>
                                            </div>
                                        </div>
                                        <div className="text-white font-mono text-xs font-bold">{tx.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Animated Ring Indicator at bottom */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                        <circle
                                            cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                            strokeDasharray="100"
                                            strokeDashoffset={isLoaded ? "25" : "100"}
                                            className="text-emerald-400 transition-all duration-[2s] ease-out drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                                        />
                                    </svg>
                                    <span className="text-white text-[9px] font-bold">75%</span>
                                </div>
                                <div>
                                    <div className="text-white text-xs font-bold">Meta Diária</div>
                                    <div className="text-emerald-400 text-[10px]">Falta R$ 1.250</div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
