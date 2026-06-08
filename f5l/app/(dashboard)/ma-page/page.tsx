import { getOrgContext } from "@/lib/auth/context";
import { getLandingPage } from "@/lib/landing-page/page";
import { LandingPageEditor } from "@/components/ma-page/LandingPageEditor";

export const metadata = { title: "Ma page — F5L" };

export default async function MaPagePage() {
  const ctx = (await getOrgContext())!;
  const page = await getLandingPage();
  const publicUrl = `/p/${ctx.org.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ma page</h1>
          <p className="text-sm text-[var(--text-2)]">
            Une page simple, conçue pour capturer des prospects.
          </p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
          Voir ma page en vrai ↗
        </a>
      </header>

      <LandingPageEditor page={page} publicUrl={publicUrl} />
    </div>
  );
}
