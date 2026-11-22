import Nav from './components/Nav';
import Hero from './components/Hero';
import Games from './components/Games';
import About from './components/About';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="relative min-h-screen grain">
      <Nav />
      <main className="relative z-[2]">
        <Hero />
        <Games />
        <About />
      </main>
      <Footer />
    </div>
  );
}
