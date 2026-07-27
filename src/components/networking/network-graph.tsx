"use client";

import { useEffect, useMemo, useState } from "react";
import { MousePointer2, Move3d, X } from "lucide-react";
import {
  createHierarchicalRadialLayout,
  ParticleNodeGraph,
  type GraphNode,
  type NodeStatus,
} from "@/components/kit/particle-node-graph";
import { formatPersonAffiliation } from "@/components/networking/person-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContactRow, SuggestedContactRow } from "@/lib/types";

const SELF_NODE_ID = "self:you";
const MAX_GRAPH_PEOPLE = 48;
const NETWORK_LAYOUT = createHierarchicalRadialLayout({
  levelOneYSpread: 2.1,
  evenlySpreadLevelOne: true,
});

type PersonEntry =
  | {
      kind: "contact";
      nodeId: string;
      person: ContactRow;
    }
  | {
      kind: "suggestion";
      nodeId: string;
      person: SuggestedContactRow;
    };

interface GraphModel {
  nodes: GraphNode[];
  peopleByNodeId: Map<string, PersonEntry>;
  displayedPeopleCount: number;
  omittedPeopleCount: number;
  totalPeopleCount: number;
}

function comparePeople(
  left: { id: string; full_name: string },
  right: { id: string; full_name: string },
): number {
  return left.full_name.localeCompare(right.full_name) || left.id.localeCompare(right.id);
}

function contactStatus(contact: ContactRow): NodeStatus {
  return contact.status === "met" ? "active" : "pending";
}

function buildGraphModel(
  contacts: ContactRow[],
  suggestions: SuggestedContactRow[],
  selectedNodeId: string | null,
): GraphModel {
  const orderedContacts = [...contacts].sort(comparePeople);
  const orderedSuggestions = [...suggestions].sort(comparePeople);

  const allEntries: PersonEntry[] = [
    ...orderedContacts.map<PersonEntry>((person) => ({
      kind: "contact",
      nodeId: `contact:${person.id}`,
      person,
    })),
    ...orderedSuggestions.map<PersonEntry>((person) => ({
      kind: "suggestion",
      nodeId: `suggestion:${person.id}`,
      person,
    })),
  ];
  const entries = allEntries.slice(0, MAX_GRAPH_PEOPLE);
  const peopleByNodeId = new Map<string, PersonEntry>(
    entries.map((entry) => [entry.nodeId, entry]),
  );
  const hasSelection =
    selectedNodeId !== null && peopleByNodeId.has(selectedNodeId);

  const nodes: GraphNode[] = [
    {
      id: SELF_NODE_ID,
      label: "You",
      secondaryLabel: "Your network",
      status: hasSelection ? "dim" : "active",
      sizeTier: 1,
    },
    ...entries.map<GraphNode>((entry) => {
      const baseStatus =
        entry.kind === "contact" ? contactStatus(entry.person) : "pending";
      const status: NodeStatus = hasSelection
        ? entry.nodeId === selectedNodeId
          ? "selected"
          : "dim"
        : baseStatus;
      return {
        id: entry.nodeId,
        parentId: SELF_NODE_ID,
        label: entry.person.full_name,
        secondaryLabel: formatPersonAffiliation(entry.person),
        tertiaryLabel:
          entry.kind === "suggestion"
            ? "Suggested from news"
            : entry.person.status === "met"
              ? "Met"
              : "To contact",
        status,
        sizeTier: 3,
        data: entry,
      };
    }),
  ];

  return {
    nodes,
    peopleByNodeId,
    displayedPeopleCount: entries.length,
    omittedPeopleCount: allEntries.length - entries.length,
    totalPeopleCount: allEntries.length,
  };
}

function ContactDetails({ contact }: { contact: ContactRow }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={contact.status === "met" ? "secondary" : "outline"}>
          {contact.status === "met" ? "Met" : "To contact"}
        </Badge>
        <span className="text-xs text-[var(--network-graph-ink)]/55">
          {contact.source === "agent" ? "Added from the radar" : "Added manually"}
        </span>
      </div>
      {contact.notes && (
        <p className="text-sm leading-relaxed text-[var(--network-graph-ink)]/75">
          {contact.notes}
        </p>
      )}
    </>
  );
}

function SuggestionDetails({ suggestion }: { suggestion: SuggestedContactRow }) {
  return (
    <>
      <Badge variant="outline">Suggested from news</Badge>
      {suggestion.reason && (
        <p className="text-sm leading-relaxed text-[var(--network-graph-ink)]/75">
          {suggestion.reason}
        </p>
      )}
      {suggestion.source_url && (
        <a
          href={suggestion.source_url}
          target="_blank"
          rel="noreferrer"
          className="w-fit text-sm font-medium text-[var(--network-graph-accent)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--network-graph-accent)]"
        >
          Open source
        </a>
      )}
    </>
  );
}

function PersonDetails({
  entry,
  onClose,
}: {
  entry: PersonEntry;
  onClose: () => void;
}) {
  const { person } = entry;
  return (
    <aside
      aria-label={`Details for ${person.full_name}`}
      className="pointer-events-auto absolute inset-x-3 bottom-3 max-h-[min(60%,24rem)] overflow-y-auto rounded-xl border border-[var(--network-graph-ink)]/15 bg-[var(--network-graph-background)]/95 p-4 shadow-lg backdrop-blur-sm md:inset-x-auto md:top-4 md:right-4 md:bottom-auto md:w-80"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-semibold text-[var(--network-graph-ink)]">
            {person.full_name}
          </p>
          {formatPersonAffiliation(person) && (
            <p className="mt-0.5 text-sm text-[var(--network-graph-ink)]/65">
              {formatPersonAffiliation(person)}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close person details"
          className="shrink-0 text-[var(--network-graph-ink)] hover:bg-[var(--network-graph-ink)]/8"
        >
          <X aria-hidden />
        </Button>
      </div>
      <div className="mt-4 flex flex-col items-start gap-3">
        {entry.kind === "contact" ? (
          <ContactDetails contact={entry.person} />
        ) : (
          <SuggestionDetails suggestion={entry.person} />
        )}
      </div>
      <p className="mt-4 border-t border-[var(--network-graph-ink)]/10 pt-3 text-xs text-[var(--network-graph-ink)]/50">
        Manage this person in the sections below.
      </p>
    </aside>
  );
}

export function NetworkGraph({
  contacts,
  suggestions,
}: {
  contacts: ContactRow[];
  suggestions: SuggestedContactRow[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const model = useMemo<GraphModel>(
    () => buildGraphModel(contacts, suggestions, selectedNodeId),
    [contacts, selectedNodeId, suggestions],
  );
  const selectedEntry =
    selectedNodeId === null
      ? undefined
      : model.peopleByNodeId.get(selectedNodeId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedNodeId(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleNodeClick(nodeId: string) {
    setSelectedNodeId(nodeId === SELF_NODE_ID ? null : nodeId);
  }

  return (
    <section
      className="networking-graph-surface relative overflow-hidden rounded-2xl border border-[var(--network-graph-ink)]/12 bg-[var(--network-graph-background)] shadow-sm"
      aria-labelledby="network-map-title"
    >
      <ParticleNodeGraph
        nodes={model.nodes}
        layout={NETWORK_LAYOUT}
        ariaLabel="Interactive 3D people map"
        ink="var(--network-graph-ink)"
        accent="var(--network-graph-accent)"
        onNodeClick={handleNodeClick}
        className="h-[70svh] min-h-[480px] max-h-[720px] w-full"
      />

      <div className="pointer-events-none absolute top-4 left-4 max-w-[calc(100%-2rem)] rounded-xl border border-[var(--network-graph-ink)]/10 bg-[var(--network-graph-background)]/88 px-3 py-2 text-[var(--network-graph-ink)] shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id="network-map-title" className="font-heading text-base font-semibold">
            Your people map
          </h2>
          <span className="text-xs opacity-55">
            {model.omittedPeopleCount > 0
              ? `${model.displayedPeopleCount} of ${model.totalPeopleCount} people`
              : `${model.totalPeopleCount} ${
                  model.totalPeopleCount === 1 ? "person" : "people"
                }`}
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-55">
          <span className="inline-flex items-center gap-1">
            <Move3d aria-hidden className="size-3" />
            Drag to rotate
          </span>
          <span className="inline-flex items-center gap-1">
            <MousePointer2 aria-hidden className="size-3" />
            Select a name for details
          </span>
          {model.omittedPeopleCount > 0 && (
            <span>
              {model.omittedPeopleCount} more{" "}
              {model.omittedPeopleCount === 1 ? "person is" : "people are"} listed
              below
            </span>
          )}
        </p>
      </div>

      {selectedEntry && (
        <PersonDetails entry={selectedEntry} onClose={() => setSelectedNodeId(null)} />
      )}
    </section>
  );
}
