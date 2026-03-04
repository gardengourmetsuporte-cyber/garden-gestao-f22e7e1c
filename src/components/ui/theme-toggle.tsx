import { useTheme } from "next-themes";
import { AppIcon } from "@/components/ui/app-icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center justify-center transition-all ${className}`}
      aria-label="Alternar tema"
    >
      <AppIcon name={isDark ? "Sun" : "Moon"} size={18} />
    </button>
  );
}
