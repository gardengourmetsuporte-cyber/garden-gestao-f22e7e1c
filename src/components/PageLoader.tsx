export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain"
        src="/loading-animation.mp4"
      />
    </div>
  );
}
