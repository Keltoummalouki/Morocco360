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
    <div style={{ background: "var(--background)", color: "var(--foreground)" }} className="min-h-screen">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="fixed top-0 left-0 right-0 z-50"
        aria-label="Main navigation"
      >
        <div
          style={{ background: "rgba(250,250,248,0.94)", backdropFilter: "blur(12px)" }}
          className="max-w-7xl mx-auto px-8 flex items-center justify-between h-16"
        >
          <Link
            href="/"
            style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700 }}
          >
            Morocco<span style={{ color: "var(--primary)" }}>360</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {["Experiences", "Destinations", "Gallery", "About"].map((item) => (
              <Link
                key={item}
                href="#"
                className="link-underline"
                style={{ fontSize: "0.8125rem", color: "var(--muted)", letterSpacing: "0.04em" }}
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="link-underline"
              style={{ fontSize: "0.8125rem", color: "var(--muted)" }}
            >
              Sign in
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: "9px 22px" }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="min-h-screen pt-16 flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">

            {/* Left content */}
            <div className="lg:col-span-3">
              <p
                className="anim-fade-up"
                style={{
                  fontSize: "0.6875rem",
                  letterSpacing: "0.22em",
                  color: "var(--primary)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                Panoramic Experiences
              </p>

              <h1 className="anim-fade-up delay-100" style={{ fontFamily: "var(--font-playfair)", lineHeight: 1.03 }}>
                <span style={{ fontSize: "clamp(2.75rem, 7vw, 6.5rem)", display: "block" }}>
                  Discover
                </span>
                <span
                  style={{
                    fontSize: "clamp(3.5rem, 11vw, 9.5rem)",
                    display: "block",
                    color: "var(--primary)",
                    lineHeight: 0.95,
                  }}
                >
                  Morocco
                </span>
                <span
                  style={{
                    fontSize: "clamp(1.75rem, 4.5vw, 4rem)",
                    display: "block",
                    fontWeight: 400,
                    marginTop: "8px",
                  }}
                >
                  through 360°
                </span>
              </h1>

              <p
                className="anim-fade-up delay-300"
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--muted)",
                  lineHeight: 1.8,
                  maxWidth: "460px",
                  marginTop: "28px",
                  marginBottom: "40px",
                }}
              >
                Step inside the ancient medinas, golden deserts, and coastal cities
                of Morocco. Immersive panoramic journeys, from anywhere in the world.
              </p>

              <div className="anim-fade-up delay-400 flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary">Start Exploring</Link>
                <Link href="#experiences" className="btn-outline">View Experiences</Link>
              </div>

              {/* Stats */}
              <div
                className="anim-fade-up delay-500 flex gap-12 mt-16 pt-10"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {[["240+", "Panoramas"], ["18", "Cities"], ["50K+", "Explorers"]].map(
                  ([num, label]) => (
                    <div key={label}>
                      <p style={{ fontFamily: "var(--font-playfair)", fontSize: "2.25rem", fontWeight: 700 }}>
                        {num}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px" }}>
                        {label}
                      </p>
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
                    className="card-hover"
                    style={{
                      background: dest.dark ? "var(--foreground)" : "var(--surface)",
                      color: dest.dark ? "var(--background)" : "var(--foreground)",
                      padding: "24px",
                      aspectRatio: "1",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "0.625rem", letterSpacing: "0.18em", opacity: 0.45, textTransform: "uppercase" }}>
                      {dest.region}
                    </span>
                    <div>
                      <span style={{ fontSize: "2.75rem", opacity: 0.08, fontFamily: "var(--font-playfair)", fontWeight: 800, display: "block", lineHeight: 1 }}>
                        {dest.num}
                      </span>
                      <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.125rem", fontWeight: 600, marginTop: "6px" }}>
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
      <div
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0",
          overflow: "hidden",
        }}
      >
        <div className="marquee-track flex whitespace-nowrap" style={{ width: "max-content" }}>
          {[...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.6875rem",
                letterSpacing: "0.22em",
                color: "var(--muted)",
                textTransform: "uppercase",
                padding: "0 24px",
              }}
            >
              {city}
              <span style={{ color: "var(--primary)", marginLeft: "24px" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────── */}
      <section id="experiences" className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p style={{ fontSize: "0.6875rem", letterSpacing: "0.22em", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>
                Why Morocco360
              </p>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.15, maxWidth: "420px" }}>
                A new way to experience the kingdom
              </h2>
            </div>
            <Link href="/register" className="link-underline" style={{ fontSize: "0.8125rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
              See all experiences
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1px", background: "var(--border)" }}>
            {FEATURES.map((feat) => (
              <div key={feat.title} className="card-hover" style={{ background: "var(--background)", padding: "48px 40px" }}>
                <span style={{ fontSize: "1.375rem", display: "block", marginBottom: "28px", color: "var(--primary)" }}>
                  {feat.symbol}
                </span>
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.375rem", fontWeight: 600, marginBottom: "14px" }}>
                  {feat.title}
                </h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "0.9375rem" }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations grid ──────────────────────────── */}
      <section style={{ background: "var(--surface)" }} className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 3vw, 2.75rem)", lineHeight: 1.2 }}>
              Popular destinations
            </h2>
            <Link href="/register" className="btn-outline" style={{ alignSelf: "flex-start" }}>
              Explore All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Marrakech",  "240 panoramas"],
              ["Fez Medina", "118 panoramas"],
              ["Sahara Erg", "96 panoramas" ],
              ["Essaouira",  "74 panoramas" ],
            ].map(([name, count]) => (
              <div
                key={name}
                className="card-hover"
                style={{ border: "1px solid var(--border)", background: "var(--background)", padding: "32px 24px" }}
              >
                <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>
                  {name}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section style={{ background: "var(--foreground)", color: "var(--background)" }} className="py-32">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p style={{ fontSize: "0.6875rem", letterSpacing: "0.22em", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", marginBottom: "20px" }}>
            Begin your journey
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 1.12, marginBottom: "24px" }}>
            Morocco awaits you
          </h2>
          <p style={{ color: "#A8A29E", fontSize: "1.0625rem", maxWidth: "440px", margin: "0 auto 48px", lineHeight: 1.8 }}>
            Create a free account and unlock hundreds of panoramic experiences across the Kingdom of Morocco.
          </p>
          <Link href="/register" className="btn-primary" style={{ background: "var(--primary)" }}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)" }} className="py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.125rem", fontWeight: 700 }}>
            Morocco<span style={{ color: "var(--primary)" }}>360</span>
          </Link>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            2026 Morocco360. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <Link key={item} href="#" className="link-underline" style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
