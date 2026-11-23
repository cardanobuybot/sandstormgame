export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-end overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(1200px 600px at 70% 10%, rgba(240,166,78,0.15), transparent 60%),
                            radial-gradient(900px 500px at 10% 90%, rgba(228,138,58,0.13), transparent 55%),
                            linear-gradient(180deg, #0e0905 0%, #150e08 60%, #1e140b 100%)`,
        }}
      />
      <div className="absolute inset-0 -z-10 opacity-40"
           style={{ backgroundImage: 'radial-gradient(#2a1c10 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pb-16 md:pb-24 pt-32 w-full">
        <img
          src="/logo-mark.svg"
          alt="Sandstorm Game logo"
          width={128}
          height={128}
          className="block w-24 h-24 md:w-32 md:h-32 mb-5 md:mb-8 drop-shadow-[0_0_28px_rgba(246,196,108,0.22)]"
        />
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-sand-300/80 mb-4 md:mb-6">
          Independent game studio
        </p>
        <h1
          className="font-display font-bold tracking-tight leading-[0.95] text-sand-50"
          style={{ fontSize: 'clamp(2.5rem, 11vw, 8.5rem)' }}
        >
          <span className="block">Sandstorm</span>
          <span className="block bg-gradient-to-b from-sand-200 via-sand-300 to-sand-500 bg-clip-text text-transparent">Game</span>
        </h1>
        <p className="mt-6 md:mt-10 max-w-xl text-sand-100/70 text-base md:text-lg leading-relaxed">
          Small team. Hand-crafted worlds. Games that are a little rough around the edges, on purpose.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#games"
             className="inline-flex items-center gap-2 bg-gradient-to-b from-sand-200 to-sand-400 hover:from-sand-100 hover:to-sand-300 text-ink-950 font-semibold shadow-[0_6px_24px_-8px_rgba(228,138,58,0.6)] px-5 py-3 rounded-full text-sm transition-colors">
            See the games
            <span aria-hidden>→</span>
          </a>
          <a href="#about"
             className="inline-flex items-center gap-2 border border-sand-300/30 hover:border-sand-300/60 text-sand-50 px-5 py-3 rounded-full text-sm transition-colors">
            About the studio
          </a>
        </div>
      </div>
    </section>
  );
}
