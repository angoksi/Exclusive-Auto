export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-paper">
      <div className="container-x py-14 sm:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-3xl sm:text-5xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{text}</p>}
        {children}
      </div>
    </section>
  );
}
