import { cn } from "@/lib/utils";

// Real brand marks vendored in public/logos/<slug>.svg (monochrome, single
// path): simple-icons (CC0) for all but xAI, which is the public-domain mark
// from Wikimedia Commons. Rendered white on the company color via CSS mask so
// any monochrome SVG tints without inlining. Companies without a vendored
// mark fall back to the letter tile — add the SVG here + list the slug below.
const LOGO_SLUGS = new Set([
  "alibaba-qwen",
  "anthropic",
  "deepseek",
  "google-deepmind",
  "meta",
  "mistral",
  "openai",
  "xai",
]);

export function CompanyLogo({
  slug,
  name,
  color,
  className,
}: {
  slug: string;
  name: string;
  color?: string | null;
  className?: string;
}) {
  const maskUrl = `url(/logos/${slug}.svg)`;
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-lg font-semibold text-white",
        className
      )}
      style={{ background: color ?? "var(--chart-1)" }}
    >
      {LOGO_SLUGS.has(slug) ? (
        <span
          className="size-[58%] bg-white"
          style={{
            maskImage: maskUrl,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: maskUrl,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
