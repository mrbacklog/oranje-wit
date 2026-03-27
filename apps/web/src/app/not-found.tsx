export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-500">404</h1>
        <p className="mt-4 text-lg text-neutral-400">Pagina niet gevonden</p>
        <a href="/" className="text-ow-oranje mt-6 inline-block text-sm hover:underline">
          Terug naar portaal
        </a>
      </div>
    </div>
  );
}
