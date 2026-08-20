"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { updateMarketingTaskStatus } from "./actions";
import { MARKETING_TYPE_LABELS } from "@/lib/marketing-constants";
import type { ContentStatus, MarketingTaskType, TaskPriority } from "@/generated/prisma/enums";

type Card = {
  id: string;
  title: string;
  type: MarketingTaskType;
  priority: TaskPriority;
  status: ContentStatus;
  assigneeName: string;
  dueDate: string | null;
};

type Column = { status: ContentStatus; label: string; cards: Card[] };

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR");
}

function DemandCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <p className="text-sm font-medium text-slate-900">{card.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
          {MARKETING_TYPE_LABELS[card.type]}
        </span>
        {card.dueDate && <span className="text-[10px] font-medium text-slate-500">{formatDate(card.dueDate)}</span>}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{card.assigneeName}</p>
    </div>
  );
}

function Column({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  return (
    <div
      ref={setNodeRef}
      className={cn("flex w-60 shrink-0 flex-col rounded-xl bg-slate-100/70 p-2", isOver && "ring-2 ring-slate-400")}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{column.label}</h3>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {column.cards.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
        {column.cards.map((card) => (
          <DemandCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export function MarketingBoard({ columns: initialColumns }: { columns: Column[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as ContentStatus;
    const sourceColumn = columns.find((c) => c.cards.some((card) => card.id === active.id));
    if (!sourceColumn || sourceColumn.status === targetStatus) return;

    const card = sourceColumn.cards.find((c) => c.id === active.id)!;

    setColumns((prev) =>
      prev.map((c) => {
        if (c.status === sourceColumn.status) return { ...c, cards: c.cards.filter((x) => x.id !== card.id) };
        if (c.status === targetStatus) return { ...c, cards: [{ ...card, status: targetStatus }, ...c.cards] };
        return c;
      })
    );

    startTransition(() => {
      updateMarketingTaskStatus(card.id, targetStatus).catch(() => setColumns(initialColumns));
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <Column key={column.status} column={column} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <DemandCard card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
