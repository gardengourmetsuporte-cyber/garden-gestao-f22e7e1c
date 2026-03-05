import mockupFinanceiro from "@/assets/mockup-financeiro.png";
import mockupChecklist from "@/assets/mockup-checklist.png";
import mockupPedidos from "@/assets/mockup-pedidos.png";

interface Props {
  type: "finance" | "checklist" | "inventory";
}

const MOCKUPS: Record<Props["type"], string> = {
  finance: mockupFinanceiro,
  checklist: mockupChecklist,
  inventory: mockupPedidos,
};

export function AnimatedPhoneMockup({ type }: Props) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <img
        src={MOCKUPS[type]}
        alt={`Mockup ${type}`}
        className="w-full h-auto object-contain drop-shadow-[0_20px_60px_rgba(16,185,129,0.15)]"
        loading="lazy"
      />
    </div>
  );
}
