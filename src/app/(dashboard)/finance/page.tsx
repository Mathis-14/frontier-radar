import { AmountBars, ValuationBars } from "@/components/charts/valuation-bars";
import { formatUsd } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFinanceEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

const EVENT_LABEL = {
  funding_round: "Funding round",
  valuation_report: "Valuation report",
  other: "Other",
} as const;

export default async function FinancePage() {
  const events = await getFinanceEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reported valuations and funding rounds — every figure links to its source.
          Non-USD figures are converted at the rate of the report date.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Latest reported valuations</CardTitle>
          </CardHeader>
          <CardContent>
            <ValuationBars events={events} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Disclosed amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountBars events={events} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No finance events on file yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Valuation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <span
                        aria-hidden
                        className="mr-2 inline-block size-2 rounded-full align-baseline"
                        style={{ background: e.company?.color ?? "var(--chart-1)" }}
                      />
                      {e.company?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {EVENT_LABEL[e.event_type]}
                        {e.round_name ? ` · ${e.round_name}` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.amount_usd ? formatUsd(e.amount_usd) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.valuation_usd ? formatUsd(e.valuation_usd) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.announced_on}</TableCell>
                    <TableCell>
                      {e.source_url && (
                        <a
                          href={e.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          link
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
