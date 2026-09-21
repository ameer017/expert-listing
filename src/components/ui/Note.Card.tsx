export function NoteCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white/70 p-5">
      <h2 className="font-medium text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}
