export default function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <a href="#top" className="font-display font-bold tracking-tight text-sand-50 text-sm md:text-base">
          SANDSTORM<span className="text-sand-300">.</span>GAME
        </a>
        <nav className="flex items-center gap-6 text-xs md:text-sm font-medium text-sand-100/70">
          <a href="#games" className="hover:text-sand-50 transition-colors">Games</a>
          <a href="#about" className="hover:text-sand-50 transition-colors">About</a>
          <a href="#contact" className="hover:text-sand-50 transition-colors">Contact</a>
        </nav>
      </div>
    </header>
  );
}
