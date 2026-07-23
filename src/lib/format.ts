/**
 * Split a long single-paragraph narrative into 2–3 balanced paragraphs at
 * sentence boundaries (readability: walls of text defeat the 50–75ch measure).
 * Decimal points ("Gemini 3.6") are safe — splits require whitespace after
 * the sentence-ender.
 */
export function splitIntoParagraphs(text: string): string[] {
  const trimmed = text.trim();
  const count = trimmed.length > 900 ? 3 : trimmed.length > 450 ? 2 : 1;
  if (count === 1) return [trimmed];
  const sentences = trimmed.split(/(?<=[.!?])\s+(?=["'(A-Z0-9~])/);
  if (sentences.length < count) return [trimmed];
  const budget = trimmed.length / count;
  const paragraphs: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length / 2 > budget && paragraphs.length < count - 1) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

export function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString("en-US")}`;
}
