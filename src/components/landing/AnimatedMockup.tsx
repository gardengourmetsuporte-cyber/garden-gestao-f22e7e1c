import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";

export function AnimatedMockup() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        // Trigger entrance animations after a tiny delay
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#050505] overflow-hidden group font-sans">

            {/* Dynamic Background Glows inside the mockup */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-emerald-500/10 blur-[80px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[50%] bg-cyan-500/10 blur-[60px] rounded-full mix-blend-screen opacity-30 group-hover:opacity-60 transition-opacity duration-1000 delay-100" />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="flex h-full w-full relative z-10">

                {/* Sidebar */}
                <div className="w-[18%] sm:w-[15%] h-full border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col py-4 px-2 items-center sm:items-stretch">

                    <div className="mb-8 px-2 flex items-center justify-center sm:justify-start gap-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                            <AppIcon name="Leaf" size={12} className="text-white" />
                        </div>
                        <span className={`text-white font-bold text-xs hidden sm:block transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>Garden</span>
                    </div>

                    <div className="space-y-2 flex-1 w-full">
                        {[
                            { id: "overview", icon: "LayoutDashboard", label: "Dashboard" },
                            { id: "sales", icon: "TrendingUp", label: "Vendas" },
                            { id: "orders", icon: "ShoppingCart", label: "Pedidos" },
                            { id: "customers", icon: "Users", label: "Clientes" }
                        ].map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-center sm:justify-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-500 hover:bg-white/5 ${activeTab === item.id
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-white/40 border border-transparent"
                                    } ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                style={{ transitionDelay: `${150 + index * 50}ms` }}
                            >
                                <AppIcon name={item.icon} size={14} />
                                <span className="text-[10px] font-medium hidden sm:block">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* User profile mock at bottom */}
                    <div className={`mt-auto w-full p-2 flex items-center justify-center sm:justify-start gap-2 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                            <AppIcon name="User" size={12} className="text-white/60" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-[9px] text-white/80 font-medium">B. Momesso</div>
                            <div className="text-[8px] text-emerald-500">Admin</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden relative">

                    <div className="flex justify-between items-center mb-6">
                        <div className={`transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg tracking-tight">Visão Geral</h2>
                            <p className="text-white/40 text-[9px] sm:text-[10px] mt-0.5">Acompanhe seus resultados em tempo real</p>
                        </div>

                        <div className={`p-1.5 rounded-lg border border-white/10 bg-white/5 flex items-center gap-2 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-white/60 text-[9px] font-medium mr-1">Ao vivo</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: "Receita Hoje", value: "R$ 4.250,00", trend: "+12.5%", isUp: true },
                            { label: "Pedidos", value: "145", trend: "+5.2%", isUp: true },
                            { label: "Ticket Médio", value: "R$ 65,90", trend: "-1.4%", isUp: false },
                            { label: "Clientes Novos", value: "28", trend: "+18.2%", isUp: true }
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`p-3 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-700 ease-out hover:bg-white/5 hover:border-white/10 group/card ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${300 + i * 100}ms` }}
                            >
                                <div className="text-white/40 text-[9px] sm:text-[10px] mb-1.5">{stat.label}</div>
                                <div className="text-white font-bold text-xs sm:text-sm lg:text-base tracking-tight">{stat.value}</div>
                                <div className={`text-[8px] sm:text-[9px] font-medium mt-1.5 flex items-center gap-0.5 ${stat.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    <AppIcon name={stat.isUp ? 'TrendingUp' : 'TrendingDown'} size={10} />
                                    {stat.trend} <span className="text-white/30 font-normal ml-0.5">vs ontem</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3">

                        {/* Chart Area */}
                        <div
                            className={`lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 flex flex-col relative overflow-hidden transition-all duration-1000 delay-500 ease-out ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'}`}
                        >
                            <div className="text-white/60 text-[10px] sm:text-xs font-medium mb-4 flex items-center justify-between">
                                <span>Faturamento Semanal</span>
                                <AppIcon name="MoreHorizontal" size={14} className="text-white/20" />
                            </div>

                            <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 pb-2">
                                {[45, 65, 30, 80, 50, 95, 60].map((height, i) => (
                                    <div key={i} className="relative flex-1 flex flex-col justify-end items-center group/bar h-full">
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-6 bg-[#1a1a1a] text-white text-[8px] py-1 px-2 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl border border-white/10">
                                            R$ {(height * 75).toFixed(2)}
                                        </div>
                                        {/* The bar */}
                                        <div
                                            className="w-full max-w-[24px] sm:max-w-[32px] rounded-t-sm transition-all duration-[1.5s] ease-[cubic-bezier(0.22,1,0.36,1)] relative overflow-hidden"
                                            style={{
                                                height: isLoaded ? `${height}%` : '0%',
                                                background: i === 5 ? 'linear-gradient(to top, hsl(142 71% 45%), hsl(142 76% 60%))' : 'hsl(0 0% 100% / 0.1)'
                                            }}
                                        >
                                            {/* Shine effect on tallest bar */}
                                            {i === 5 && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent -translate-y-full group-hover:animate-[shimmer_1s_infinite]" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* List Area */}
                        <div
                            className={`rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-3 sm:p-4 flex flex-col transition-all duration-1000 delay-700 ease-out hidden lg:flex ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                        >
                            <div className="text-white/60 text-xs font-medium mb-3">Últimas Vendas</div>
                            <div className="space-y-2 flex-1 relative">
                                {/* Fade out mask at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />

                                {[
                                    { id: 1042, user: "Maria S.", val: "R$ 145,90", stat: "success" },
                                    { id: 1043, user: "João P.", val: "R$ 82,50", stat: "success" },
                                    { id: 1044, user: "Ana C.", val: "R$ 45,00", stat: "warning" },
                                    { id: 1045, user: "Carlos S.", val: "R$ 210,00", stat: "success" },
                                    { id: 1046, user: "Bruno M.", val: "R$ 65,90", stat: "success" },
                                ].map((order, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 transition-all duration-500 ease-out hover:bg-white/10 hover:border-white/10 cursor-default ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                        style={{ transitionDelay: `${800 + i * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/60 font-medium">
                                                {order.user.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white text-[10px] font-medium leading-none">{order.user}</div>
                                                <div className="text-white/40 text-[8px] mt-0.5">Pedido #{order.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-white text-[10px] font-medium font-mono tracking-tight">{order.val}</div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${order.stat === 'success' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
