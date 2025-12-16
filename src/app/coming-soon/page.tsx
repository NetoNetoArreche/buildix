import { getMaintenanceStatus } from "@/lib/maintenance";
import { CosmosLogo } from "@/components/shared/cosmos-logo";

export default async function ComingSoonPage() {
  const status = await getMaintenanceStatus();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-600/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-600/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo - CosmosLogo */}
        <div className="mb-8 inline-flex items-center justify-center">
          <CosmosLogo className="w-24 h-24 md:w-32 md:h-32" />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          {status.title}
        </h1>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-600" />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-600" />
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-zinc-400 mb-4">
          Em Construção
        </p>

        {/* Message */}
        <p className="text-lg text-zinc-500 mb-12">
          {status.message}
        </p>

        {/* Loading animation */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-zinc-600">
          <p>Estamos preparando algo incrível para você.</p>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
    </div>
  );
}
