import { useTheme } from "next-themes";
import { AppIcon } from "@/components/ui/app-icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-lg hover:bg-secondary transition-all ${className}`}
      aria-label="Alternar tema"
    >
      <AppIcon name="Sun" size={20} className="hidden dark:block" />
      <AppIcon name="Moon" size={20} className="block dark:hidden" />
    </button>
  );
}
