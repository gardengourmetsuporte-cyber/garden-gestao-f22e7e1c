import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-lg hover:bg-secondary transition-all ${className}`}
      aria-label="Alternar tema"
    >
      <Sun className="w-5 h-5 hidden dark:block text-muted-foreground" />
      <Moon className="w-5 h-5 block dark:hidden text-muted-foreground" />
    </button>
  );
}
