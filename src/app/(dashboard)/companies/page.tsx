import Link from "next/link";
import { SpotlightCard } from "@/components/originkit/spotlight-card";
import { getCompanies, getModelReleases, getNews } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const [companies, news, releases] = await Promise.all([
    getCompanies(),
    getNews({ limit: 200 }),
    getModelReleases(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One card per tracked company — the agent&apos;s list lives in its memory store.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {companies.map((c) => {
          const companyNews = news.filter((n) => n.company?.slug === c.slug);
          const latestRelease = releases.find((r) => r.company?.slug === c.slug);
          return (
            <Link key={c.slug} href={`/companies/${c.slug}`}>
              <SpotlightCard className="h-full p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                    style={{ background: c.color ?? "var(--chart-1)" }}
                  >
                    {c.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="font-heading text-lg font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {companyNews.length} item{companyNews.length === 1 ? "" : "s"} on file
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {companyNews[0]?.title ?? "No news captured yet."}
                </p>
                {latestRelease && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Latest model: <span className="font-medium text-foreground">{latestRelease.model_name}</span>
                  </p>
                )}
              </SpotlightCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
