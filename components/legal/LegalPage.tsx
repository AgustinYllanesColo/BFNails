import { Eyebrow, Heading } from "@/components/ui/Section";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: React.ReactNode; updated: string; children: React.ReactNode }) {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h1">{title}</Heading>
        <p className="mt-3 text-sm text-ink-soft">Última actualización: {updated}</p>
        <div className="prose-bf mt-10 space-y-8 text-[15px] leading-relaxed text-ink [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_h2]:mb-3 [&_p]:text-ink-soft [&_li]:text-ink-soft [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
