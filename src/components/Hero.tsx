export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-end overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(1200px 600px at 70% 10%, rgba(197,160,92,0.18), transparent 60%),
                            radial-gradient(900px 500px at 10% 90%, rgba(168,129,69,0.15), transparent 55%),
                            linear-gradient(180deg, #0a0a0a 0%, #121212 60%, #1a1a1a 100%)`,
        }}
      />
      <div className="absolute inset-0 -z-10 opacity-40"
           style={{ backgroundImage: 'radial-gradient(#242424 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
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
          <span className="block text-sand-300">Game</span>
        </h1>
        <p className="mt-6 md:mt-10 max-w-xl text-sand-100/70 text-base md:text-lg leading-relaxed">
          Small team. Hand-crafted worlds. Games that are a little rough around the edges, on purpose.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#games"
             className="inline-flex items-center gap-2 bg-sand-300 hover:bg-sand-200 text-ink-950 font-semibold px-5 py-3 rounded-full text-sm transition-colors">
            See the games
            <span aria-hidden>→</span>
          </a>
          <a href="#about"
             className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-sand-50 px-5 py-3 rounded-full text-sm transition-colors">
            About the studio
          </a>
        </div>
      </div>
    </section>
  );
}
