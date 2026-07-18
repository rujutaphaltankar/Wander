
export function TopBar({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 py-4">
      <h1 className="font-display text-2xl font-bold leading-tight text-ink dark:text-[#EAF3EF]">{title}</h1>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}
