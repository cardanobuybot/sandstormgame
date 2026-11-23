interface Game {
  title: string;
  tag: string;
  year: string;
  status: 'in development' | 'coming soon' | 'released';
  blurb: string;
}

const games: Game[] = [
  {
    title: 'Untitled Desert Project',
    tag: 'Prototype',
    year: '2026',
    status: 'in development',
    blurb: 'A survival-exploration game set in a slowly consuming dune sea. Currently in internal playtest.',
  },
];

function StatusChip({ status }: { status: Game['status'] }) {
  const map = {
    'in development': 'bg-sand-300/15 text-sand-200 border-sand-300/30',
    'coming soon':    'bg-white/5 text-sand-100 border-white/15',
    'released':       'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {status}
    </span>
  );
}

export default function Games() {
  return (
    <section id="games" className="relative py-24 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <h2 className="font-display font-bold text-sand-50 text-3xl md:text-5xl tracking-tight">
            Games
          </h2>
          <p className="text-sand-100/50 text-sm hidden md:block">01 — playtest in progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {games.map((g) => (
            <article key={g.title}
              className="group relative rounded-2xl overflow-hidden border border-white/5 bg-ink-800/60 hover:bg-ink-700/70 transition-colors">
              <div className="aspect-[16/10] relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #9a4a22 0%, #2a1c10 100%)' }}>
                <div className="absolute inset-0 opacity-30"
                     style={{ backgroundImage: 'radial-gradient(#0e0905 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <StatusChip status={g.status} />
                  <span className="text-[10px] uppercase tracking-widest text-sand-50/60">{g.year}</span>
                </div>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.25em] text-sand-300/70">{g.tag}</p>
                <h3 className="mt-1.5 font-display font-semibold text-xl md:text-2xl text-sand-50">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm text-sand-100/60 leading-relaxed">{g.blurb}</p>
              </div>
            </article>
          ))}

          {/* Placeholder for upcoming titles */}
          <article className="relative rounded-2xl border border-dashed border-white/10 bg-transparent p-5 md:p-6 flex items-center justify-center min-h-[280px]">
            <p className="text-sand-100/40 text-sm text-center">
              More experiments brewing.<br />Follow along for drops.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
