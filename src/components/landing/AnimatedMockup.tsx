import mockupDashboard from "@/assets/mockup-dashboard-desktop.png";

export function AnimatedMockup() {
  return (
    <div className="relative w-full bg-[#000000] overflow-hidden">
      <img
        src={mockupDashboard}
        alt="Dashboard Garden Gestão"
        className="w-full h-auto object-cover"
        loading="eager"
      />
    </div>
  );
}
