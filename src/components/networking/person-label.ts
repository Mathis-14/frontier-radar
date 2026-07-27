export function formatPersonAffiliation(person: {
  role: string | null;
  company: string | null;
}): string | undefined {
  const parts = [person.role, person.company].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(" · ") : undefined;
}
