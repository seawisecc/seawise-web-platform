import { cn } from "@/lib/utils";

type Tone = "plain" | "muted" | "contrast";

const TONE_CLASS: Record<Tone, string> = {
  plain: "",
  muted: "tone-muted",
  contrast: "tone-contrast",
};

export function Section({
  id,
  className,
  children,
  tone = "plain",
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <section id={id} className={cn("section", TONE_CLASS[tone], className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  if (!title && !subtitle && !eyebrow) return null;

  return (
    <header
      className={cn(
        "reveal mb-12 max-w-2xl md:mb-16",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      {title ? <h2 className="heading-section">{title}</h2> : null}
      {subtitle ? <p className="prose-body mt-5">{subtitle}</p> : null}
    </header>
  );
}
