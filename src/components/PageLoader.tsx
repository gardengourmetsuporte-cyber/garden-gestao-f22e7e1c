import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
      </div>
    </div>
  );
}
