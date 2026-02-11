import { ReactNode } from "react";

type ChecklistGridProps = {
  children: ReactNode;
  columns?: number;
};

export function ChecklistGrid({
  children,
  columns = 3,
}: ChecklistGridProps) {
  return (
    <div
      className={[
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
