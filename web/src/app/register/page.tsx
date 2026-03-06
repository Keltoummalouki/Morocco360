import Link from "next/link";
import { Suspense } from "react";
import RegisterForm from "@/components/RegisterForm";

const PERKS = [
  "Unlimited 360° panoramas",
  "Curated city routes",
  "Live guide sessions",
  "Offline access",
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>

      {/* ── Left panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14"
        style={{ background: "var(--surface)" }}
      >
        <Link
          href="/"
          style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700 }}
        >
          Morocco<span style={{ color: "var(--primary)" }}>360</span>
        </Link>

        <div>
          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.22em",
              color: "var(--primary)",
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Join the community
          </p>
          <h2
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.625rem, 2.5vw, 2.25rem)",
              lineHeight: 1.3,
              fontWeight: 600,
              marginBottom: "36px",
            }}
          >
            Unlock 240+ immersive experiences
          </h2>

          <div className="flex flex-col gap-5">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-4">
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "1.5px solid var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: "8px", height: "8px", background: "var(--primary)" }} />
                </div>
                <span style={{ fontSize: "0.9375rem", color: "var(--muted)" }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ border: "1px solid var(--border)", padding: "24px", background: "var(--background)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.75 }}>
            &ldquo;Morocco360 completely changed how I prepare for travel. I visited
            every place virtually before setting foot there.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--primary)",
              }}
            >
              S
            </div>
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Sarah M.</p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Paris, France</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16">

        {/* Mobile logo */}
        <div className="lg:hidden mb-12">
          <Link
            href="/"
            style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700 }}
          >
            Morocco<span style={{ color: "var(--primary)" }}>360</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="w-full max-w-md" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Loading…
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
