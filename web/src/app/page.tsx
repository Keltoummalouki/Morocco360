import Link from "next/link";

const DESTINATIONS = [
  { city: "Marrakech",   region: "South",     num: "01", dark: true  },
  { city: "Chefchaouen", region: "North",     num: "02", dark: false },
  { city: "Sahara",      region: "Southeast", num: "03", dark: false },
  { city: "Fez",         region: "Central",   num: "04", dark: true  },
];

const FEATURES = [
  {
    symbol: "◎",
    title: "Immersive 360°",
    desc: "Full spherical panoramas captured with professional equipment across Morocco's most breathtaking locations.",
  },
  {
    symbol: "◈",
    title: "Curated Routes",
    desc: "Expert-designed virtual tours connecting medinas, kasbahs, and natural landscapes in meaningful sequences.",
  },
  {
    symbol: "◇",
    title: "Live Guides",
    desc: "Join live sessions with local Moroccan guides who share stories, history, and hidden secrets of each place.",
  },
];

const MARQUEE_CITIES = [
  "MARRAKECH", "FEZ", "CHEFCHAOUEN", "SAHARA DESERT",
  "ATLAS MOUNTAINS", "ESSAOUIRA", "CASABLANCA", "RABAT",
  "MEKNES", "AGADIR", "OUARZAZATE", "TANGIER",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border" aria-label="Main navigation">
        <div className="nav-bar max-w-7xl mx-auto px-8 flex items-center justify-between h-16">
          <Link href="/" className="font-playfair text-xl font-bold">
            Morocco<span className="text-primary">360</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {["Experiences", "Destinations", "Gallery", "About"].map((item) => (
              <Link key={item} href="#" className="link-underline nav-link">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="link-underline nav-link">Sign in</Link>
            <Link href="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="min-h-screen pt-16 flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">

            {/* Left content */}
            <div className="lg:col-span-3">
              <p className="anim-fade-up label-caps text-primary mb-7">
                Panoramic Experiences
              </p>

              <h1 className="anim-fade-up delay-100 font-playfair leading-[1.03]">
                <span className="block text-[clamp(2.75rem,7vw,6.5rem)]">Discover</span>
                <span className="block text-[clamp(3.5rem,11vw,9.5rem)] text-primary leading-[0.95]">
                  Morocco
                </span>
                <span className="block text-[clamp(1.75rem,4.5vw,4rem)] font-normal mt-2">
                  through 360°
                </span>
              </h1>

              <p className="anim-fade-up delay-300 text-muted text-[1.0625rem] leading-[1.8] max-w-[460px] mt-7 mb-10">
                Step inside the ancient medinas, golden deserts, and coastal cities
                of Morocco. Immersive panoramic journeys, from anywhere in the world.
              </p>

              <div className="anim-fade-up delay-400 flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary">Start Exploring</Link>
                <Link href="#experiences" className="btn-outline">View Experiences</Link>
              </div>

              {/* Stats */}
              <div className="anim-fade-up delay-500 flex gap-12 mt-16 pt-10 border-t border-border">
                {[["240+", "Panoramas"], ["18", "Cities"], ["50K+", "Explorers"]].map(
                  ([num, label]) => (
                    <div key={label}>
                      <p className="font-playfair text-[2.25rem] font-bold">{num}</p>
                      <p className="label-small text-muted mt-1">{label}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right — destination tiles */}
            <div className="lg:col-span-2 anim-slide-left delay-200">
              <div className="grid grid-cols-2 gap-3">
                {DESTINATIONS.map((dest) => (
                  <div
                    key={dest.city}
                    className={`card-hover p-6 aspect-square flex flex-col justify-between ${
                      dest.dark
                        ? "bg-foreground text-background"
                        : "bg-surface text-foreground"
                    }`}
                  >
                    <span className="text-[0.625rem] tracking-[0.18em] opacity-45 uppercase">
                      {dest.region}
                    </span>
                    <div>
                      <span className="font-playfair text-[2.75rem] opacity-[0.08] font-extrabold block leading-none">
                        {dest.num}
                      </span>
                      <p className="font-playfair text-[1.125rem] font-semibold mt-1.5">
                        {dest.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee strip ──────────────────────────────── */}
      <div className="border-y border-border py-3.5 overflow-hidden">
        <div className="marquee-track flex whitespace-nowrap w-max">
          {[...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => (
            <span key={i} className="marquee-item">
              {city}
              <span className="text-primary ml-6">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────── */}
      <section id="experiences" className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="label-caps text-primary mb-3">Why Morocco360</p>
              <h2 className="font-playfair text-[clamp(2rem,4vw,3.25rem)] leading-[1.15] max-w-[420px]">
                A new way to experience the kingdom
              </h2>
            </div>
            <Link href="/register" className="link-underline nav-link whitespace-nowrap">
              See all experiences
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="card-hover bg-background px-10 py-12">
                <span className="text-[1.375rem] block mb-7 text-primary">{feat.symbol}</span>
                <h3 className="font-playfair text-[1.375rem] font-semibold mb-3.5">{feat.title}</h3>
                <p className="text-muted leading-[1.8] text-[0.9375rem]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations grid ──────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
            <h2 className="font-playfair text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.2]">
              Popular destinations
            </h2>
            <Link href="/register" className="btn-outline self-start">Explore All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Marrakech",  "240 panoramas"],
              ["Fez Medina", "118 panoramas"],
              ["Sahara Erg", "96 panoramas" ],
              ["Essaouira",  "74 panoramas" ],
            ].map(([name, count]) => (
              <div key={name} className="card-hover border border-border bg-background px-6 py-8">
                <p className="font-playfair text-[1.25rem] font-semibold mb-2">{name}</p>
                <p className="text-[0.8125rem] text-muted">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="bg-foreground text-background py-32">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="label-caps text-primary mb-5">Begin your journey</p>
          <h2 className="font-playfair text-[clamp(2.25rem,5vw,4rem)] leading-[1.12] mb-6">
            Morocco awaits you
          </h2>
          <p className="text-[#A8A29E] text-[1.0625rem] max-w-[440px] mx-auto mb-12 leading-[1.8]">
            Create a free account and unlock hundreds of panoramic experiences across the Kingdom of Morocco.
          </p>
          <Link href="/register" className="btn-primary btn-cta">Create Free Account</Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="font-playfair text-[1.125rem] font-bold">
            Morocco<span className="text-primary">360</span>
          </Link>
          <p className="text-[0.8125rem] text-muted">
            2026 Morocco360. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <Link key={item} href="#" className="link-underline nav-link">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
