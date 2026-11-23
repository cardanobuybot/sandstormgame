export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="relative z-[2] border-t border-white/5 bg-ink-900/70">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-6">
          <p className="text-xs uppercase tracking-[0.3em] text-sand-300/80 mb-3">Contact</p>
          <h3 className="font-display font-bold text-sand-50 text-3xl md:text-4xl tracking-tight leading-tight">
            Want to say hi?<br />Playtest, press, or just ideas.
          </h3>
          <a
            href="mailto:duneofclash@gmail.com"
            className="inline-block mt-6 [overflow-wrap:anywhere] font-display text-2xl md:text-3xl text-sand-300 hover:text-sand-200 underline underline-offset-4 decoration-sand-300/40 hover:decoration-sand-200/70 transition-colors"
          >
            duneofclash@gmail.com
          </a>
        </div>
        <div className="md:col-span-6 md:pl-10 flex flex-col justify-between gap-6">
          <ul className="space-y-2 text-sand-100/70 text-sm">
            <li>
              <a href="#" className="hover:text-sand-50 transition-colors">Twitter / X</a>
            </li>
            <li>
              <a href="#" className="hover:text-sand-50 transition-colors">YouTube</a>
            </li>
            <li>
              <a href="#" className="hover:text-sand-50 transition-colors">itch.io</a>
            </li>
          </ul>
          <div className="text-xs text-sand-100/40 flex items-center justify-between">
            <span>© {year} Sandstorm Game</span>
            <span>Made in a sandstorm.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
