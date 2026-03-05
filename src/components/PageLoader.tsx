export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <video
        src="/loading-animation.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-48 h-48 object-contain"
      />
    </div>
  );
}
