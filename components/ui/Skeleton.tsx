export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-[sweep_1.6s_ease-in-out_infinite] border border-border bg-surface p-5"
        >
          <div className="h-[11px] w-[210px] bg-[#182027]" />
          <div className="mt-3.5 h-2 w-[58%] bg-divider" />
        </div>
      ))}
    </div>
  );
}
