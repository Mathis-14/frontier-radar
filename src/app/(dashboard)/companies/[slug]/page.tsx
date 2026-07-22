import { notFound } from "next/navigation";
import { CommunityList } from "@/components/sections/community-list";
import { NewsList } from "@/components/sections/news-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCommunityPosts,
  getCompanies,
  getModelReleases,
  getNews,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [companies, news, releases, community] = await Promise.all([
    getCompanies(),
    getNews({ companySlug: slug }),
    getModelReleases(),
    getCommunityPosts({ companySlug: slug }),
  ]);
  const company = companies.find((c) => c.slug === slug);
  if (!company) notFound();

  const companyReleases = releases.filter((r) => r.company?.slug === slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-xl text-lg font-semibold text-white"
          style={{ background: company.color ?? "var(--chart-1)" }}
        >
          {company.name.slice(0, 1)}
        </span>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            Everything the agent has filed for this company.
          </p>
        </div>
      </div>

      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="news">
          <Card>
            <CardContent className="pt-2">
              <NewsList items={news} showCompany={false} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="models">
          <Card>
            <CardContent className="pt-4">
              {companyReleases.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No model releases on file yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {companyReleases.map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">{r.model_name}</p>
                        {r.notes && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{r.notes}</p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r.released_on ?? ""}
                          {r.source_url && (
                            <>
                              {" · "}
                              <a
                                href={r.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline-offset-2 hover:underline"
                              >
                                source
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {r.tier}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="community">
          <Card>
            <CardContent className="pt-2">
              <CommunityList posts={community} showCompany={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
