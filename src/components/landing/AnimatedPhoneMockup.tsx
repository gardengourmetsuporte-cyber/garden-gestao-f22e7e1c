import screenshotFinance from "@/assets/screenshot-finance.png";
import screenshotChecklist from "@/assets/screenshot-checklist.png";
import screenshotEstoque from "@/assets/screenshot-estoque.png";

interface Props {
  type: "finance" | "checklist" | "inventory";
}

const SCREENSHOTS: Record<Props["type"], string> = {
  finance: screenshotFinance,
  checklist: screenshotChecklist,
  inventory: screenshotEstoque,
};

export function AnimatedPhoneMockup({ type }: Props) {
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

        {/* Screenshot */}
        <img
          src={SCREENSHOTS[type]}
          alt={`Screenshot ${type}`}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-20" />
      </div>
    </div>
  );
}
