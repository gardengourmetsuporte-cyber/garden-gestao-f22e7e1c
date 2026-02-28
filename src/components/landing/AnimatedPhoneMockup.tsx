import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";

interface Props {
    type: "finance" | "checklist" | "inventory";
}

export function AnimatedPhoneMockup({ type }: Props) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 150);
        return () => clearTimeout(timer);
    }, [type]);

    const renderContent = () => {
        switch (type) {
            case "checklist":
                return (
                    <div className="flex flex-col h-full p-4 gap-3">
                        <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Rotina Diária</div>
                            <div className="text-white text-lg font-bold leading-none">Fechamento</div>
                        </div>

                        <div className="flex gap-2">
                            <div className={`flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col justify-between transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                                <AppIcon name="CheckCircle2" size={14} className="text-emerald-400 mb-2" />
                                <div className="text-white font-bold text-sm">14/15</div>
                                <div className="text-emerald-400 text-[9px] font-medium">Concluídas</div>
                            </div>
                            <div className={`flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                                <AppIcon name="Flame" size={14} className="text-orange-400 mb-2" />
                                <div className="text-white font-bold text-sm">3 Dias</div>
                                <div className="text-white/40 text-[9px] font-medium">Ofensiva</div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 mt-2">
                            {[
                                { label: "Limpar Chapa", user: "Maria Silva", status: "done", time: "22:15" },
                                { label: "Contar Caixa", user: "João P.", status: "done", time: "22:40" },
                                { label: "Lavar Salão", user: "Pendente", status: "pending", time: "Hoje" }
                            ].map((task, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${task.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'} transition-all duration-700 delay-${600 + i * 100} ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-[11px] font-bold ${task.status === 'done' ? 'text-emerald-400' : 'text-white'}`}>{task.label}</div>
                                        {task.status === 'done' ? (
                                            <AppIcon name="CheckCircle2" size={12} className="text-emerald-500" />
                                        ) : (
                                            <div className="w-3 h-3 rounded-full border border-white/20" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-white/40">{task.user}</span>
                                        <span className="text-white/20">{task.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "finance":
                return (
                    <div className="flex flex-col h-full p-4 gap-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                                <AppIcon name="User" size={12} className="text-white/60" />
                            </div>
                            <div className="px-2 py-1 rounded-full bg-white/5 border border-white/5 text-white/60 text-[9px] flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ao vivo
                            </div>
                        </div>

                        <div className={`my-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="text-white/40 text-[10px] text-center mb-1">Saldo Atual</div>
                            <div className="text-white font-extrabold text-2xl text-center tracking-tight">R$ 14.850<span className="text-white/30 text-lg">,00</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className={`p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <AppIcon name="ArrowDownLeft" size={14} className="text-emerald-400 mb-1" />
                                <div className="text-white/60 text-[9px]">Entradas</div>
                                <div className="text-emerald-400 text-xs font-bold mt-0.5">R$ 4.250</div>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <AppIcon name="ArrowUpRight" size={14} className="text-rose-400 mb-1" />
                                <div className="text-white/60 text-[9px]">Saídas</div>
                                <div className="text-rose-400 text-xs font-bold mt-0.5">R$ 1.120</div>
                            </div>
                        </div>

                        <div className="flex-1 bg-white/5 border border-white/5 rounded-t-2xl mt-4 px-4 py-3 relative overflow-hidden">
                            <div className="text-white text-[10px] font-bold mb-3">Últimas Transações</div>
                            <div className="space-y-3">
                                {[
                                    { title: "iFood repasse", val: "+ R$ 850,00", type: "in" },
                                    { title: "Fornecedor Carne", val: "- R$ 450,00", type: "out" },
                                ].map((t, i) => (
                                    <div key={i} className={`flex justify-between items-center transition-all duration-700 delay-${700 + i * 100} ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${t.type === 'in' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                                <AppIcon name={t.type === 'in' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={10} className={t.type === 'in' ? 'text-emerald-400' : 'text-rose-400'} />
                                            </div>
                                            <span className="text-white text-[10px]">{t.title}</span>
                                        </div>
                                        <span className={`text-[10px] font-mono font-bold ${t.type === 'in' ? 'text-emerald-400' : 'text-white'}`}>{t.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "inventory":
                return (
                    <div className="flex flex-col h-full p-4 gap-3">
                        <div className="text-white/80 font-bold text-xs mb-2">Visão do Estoque</div>

                        {/* Progress / Health bar */}
                        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 mb-2 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="flex justify-between text-[9px] text-white/60 mb-1.5">
                                <span>Saúde do Estoque</span>
                                <span className="text-emerald-400">Excelente</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500 w-[70%]" />
                                <div className="h-full bg-amber-400 w-[20%]" />
                                <div className="h-full bg-rose-500 w-[10%]" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            {[
                                { item: "Pão Brioche", qty: "145 un", status: "ok", val: "ok" },
                                { item: "Blend Costela", qty: "12 kg", status: "warning", val: "Baixo" },
                                { item: "Queijo Cheddar", qty: "2 kg", status: "critical", val: "Acabando" },
                                { item: "Bacon Fatiado", qty: "8 kg", status: "ok", val: "ok" },
                            ].map((prod, i) => (
                                <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-700 delay-${400 + i * 100} ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <AppIcon name="Package" size={12} className="text-white/40" />
                                        </div>
                                        <div>
                                            <div className="text-white text-[10px] font-bold">{prod.item}</div>
                                            <div className="text-white/40 text-[9px] mt-0.5">{prod.qty} disponíveis</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[8px] font-bold ${prod.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' :
                                            prod.status === 'warning' ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                        {prod.val === 'ok' ? <AppIcon name="Check" size={10} /> : prod.val}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="relative w-full aspect-[9/19] max-w-[280px] mx-auto bg-[#000] rounded-[2rem] sm:rounded-[2.5rem] p-1.5 shadow-2xl border border-[#333]">
            {/* Outer Phone Bezel glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-cyan-500/20 blur-xl -z-10 rounded-[3rem]" />

            {/* Phone Screen Container */}
            <div className="relative w-full h-full bg-[#0a0a0a] rounded-[1.75rem] sm:rounded-[2.25rem] overflow-hidden border border-white/5">

                {/* Dynamic Island Mock */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                </div>

                {/* Screen Content Gradient Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/20 blur-[60px] rounded-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Content Render */}
                <div className="relative z-10 w-full h-full pt-8 pb-4">
                    {renderContent()}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-20" />
            </div>
        </div>
    );
}
