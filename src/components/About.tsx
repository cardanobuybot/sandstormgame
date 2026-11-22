export default function About() {
  return (
    <section id="about" className="relative py-24 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <p className="text-xs uppercase tracking-[0.3em] text-sand-300/80 mb-3">About</p>
          <h2 className="font-display font-bold text-sand-50 text-3xl md:text-5xl tracking-tight leading-tight">
            A small studio with a loud brain.
          </h2>
        </div>
        <div className="md:col-span-7 space-y-5 text-sand-100/70 text-base md:text-lg leading-relaxed">
          <p>
            Sandstorm Game is a one-person studio for now. We build games that feel like old
            field recordings — warm, grainy, unfinished in all the right ways.
          </p>
          <p>
            No publishers, no roadmap meetings. Just ideas, builds, feedback, and whatever the
            next iteration demands. Expect short projects, weird mechanics, and the occasional
            full-length experiment.
          </p>
        </div>
      </div>
    </section>
  );
}
