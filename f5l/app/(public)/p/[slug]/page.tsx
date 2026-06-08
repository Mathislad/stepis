import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicLandingPage } from "@/lib/landing-page/page";
import { LeadForm } from "./LeadForm";

function clean(value: string, max = 155): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicLandingPage(slug);
  if (!data) return { title: "Page introuvable" };
  return {
    title: data.org.name,
    description: clean(data.page.hero.subtitle || `Page officielle de ${data.org.name}.`),
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicLandingPage(slug);
  if (!data) notFound();
  const { org, page } = data;

  return (
    <article style={{ background: "#fff" }}>
      {/* En-tête */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-lg font-semibold text-zinc-900">{org.name}</p>
            {org.sector && <p className="text-xs text-zinc-500">{org.sector}</p>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {page.info.phone && (
              <a
                href={`tel:${page.info.phone.replace(/\s/g, "")}`}
                className="hidden text-zinc-700 sm:inline"
              >
                📞 {page.info.phone}
              </a>
            )}
            <a
              href="#contact"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-100 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            {page.hero.title}
          </h1>
          {page.hero.subtitle && (
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              {page.hero.subtitle}
            </p>
          )}
          <a
            href="#contact"
            className="mt-8 inline-flex items-center rounded-full bg-emerald-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {page.hero.ctaLabel} →
          </a>
        </div>
      </section>

      {/* Services */}
      {page.services.length > 0 && (
        <section className="border-b border-zinc-100 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
              Nos services
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.services.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-zinc-900">{s.title}</h3>
                  {s.description && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Témoignages */}
      {page.testimonials.length > 0 && (
        <section className="border-b border-zinc-100 bg-zinc-50 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
              Ils nous font confiance
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {page.testimonials.map((t, i) => (
                <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm italic leading-relaxed text-zinc-700">
                    &laquo; {t.quote} &raquo;
                  </p>
                  {t.author && (
                    <p className="mt-3 text-xs font-semibold text-zinc-500">
                      — {t.author}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Formulaire de contact — LE point de conversion */}
      <section id="contact" className="border-b border-zinc-100 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Contactez-nous</h2>
            <p className="mt-2 text-zinc-600">
              Une question ? Un projet ? Laissez-nous un message, nous vous recontactons très vite.
            </p>
          </div>
          <div className="mt-8">
            <LeadForm slug={slug} />
          </div>
        </div>
      </section>

      {/* Infos pratiques */}
      <section className="border-b border-zinc-100 bg-zinc-50 px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {(page.info.address || page.info.city) && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Adresse
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                {page.info.address}
                {page.info.address && page.info.city && <br />}
                {page.info.city}
              </p>
            </div>
          )}
          {page.hours && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Horaires
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {page.hours.days.map((d) => (
                  <li key={d.label} className="flex justify-between gap-3">
                    <span>{d.label}</span>
                    <span className={d.closed ? "text-zinc-400" : ""}>
                      {d.closed ? "Fermé" : `${d.open} – ${d.close}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.info.phone && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Téléphone
              </p>
              <a
                href={`tel:${page.info.phone.replace(/\s/g, "")}`}
                className="mt-2 block text-sm font-semibold text-emerald-600 hover:underline"
              >
                {page.info.phone}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs text-zinc-400">
          Propulsé par <span className="font-semibold text-zinc-600">F5L Acquisition</span>
        </p>
      </footer>
    </article>
  );
}
