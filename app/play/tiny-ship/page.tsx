export const metadata = { title: "Tiny Ship" };

export default function TinyShipPage() {
  return (
    <div className="w-full">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Tiny Ship</h1>
      <div className="overflow-hidden rounded-md border border-border bg-card lcd-bezel">
        <iframe
          src="https://itch.io/embed-upload/20224955?color=1f1c3e"
          title="Tiny Ship"
          allowFullScreen
          className="block aspect-[640/380] w-full"
        >
          <a href="https://eggsdee99.itch.io/tiny-ship">Play Tiny Ship on itch.io</a>
        </iframe>
      </div>
    </div>
  );
}
