export const metadata = {
  title: "Configuration requise - F5L",
  robots: { index: false, follow: false },
};

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
];

export default function SetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-[#f5f5f7]">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0A84FF,#BF5AF2)] text-[28px] font-extrabold">
          F
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Configuration requise</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/60">
          F5L Acquisition a besoin d&apos;une connexion Supabase pour afficher le
          dashboard, les prospects, les campagnes et la page publique de demo.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-left text-sm leading-7 text-white/80">
          <p>
            <strong>1.</strong> Cree un projet sur{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#0A84FF] underline-offset-4 hover:underline"
            >
              supabase.com
            </a>
            .
          </p>
          <p>
            <strong>2.</strong> Copie l&apos;URL, la cle anon et la cle service role
            depuis <span className="text-white">Settings - API</span>.
          </p>
          <p>
            <strong>3.</strong> Remplis{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code>
            .
          </p>
          <p>
            <strong>4.</strong> Applique les migrations avec{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">
              npx supabase db push
            </code>
            .
          </p>
          <p>
            <strong>5.</strong> Charge{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">supabase/seed.sql</code>
            , puis redemarre{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">npm run dev</code>.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
            Variables minimales
          </p>
          <ul className="mt-3 grid gap-2 text-[13px] text-white/70 sm:grid-cols-2">
            {REQUIRED_ENV.map((name) => (
              <li key={name} className="rounded-lg bg-black/30 px-3 py-2 font-mono">
                {name}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-xs text-white/35">
          Les valeurs placeholder permettent de demarrer le serveur, mais cette
          page reste affichee tant que Supabase n&apos;est pas vraiment configure.
        </p>
      </section>
    </main>
  );
}
