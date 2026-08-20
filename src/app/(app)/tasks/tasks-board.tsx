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
import { updateTaskStatus } from "./actions";
import { TASK_PRIORITY_LABELS } from "@/lib/tasks-constants";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums";

type Card = {
  id: string;
  title: string;
  assigneeName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  leadName: string | null;
};

type Column = { status: TaskStatus; label: string; cards: Card[] };

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR");
}

function TaskCard({ card }: { card: Card }) {
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
        card.status === "LATE" && "border-l-4 border-l-red-500",
        isDragging && "opacity-40"
      )}
    >
      <p className="text-sm font-medium text-slate-900">{card.title}</p>
      {card.leadName && <p className="text-xs text-slate-500">Lead: {card.leadName}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_STYLES[card.priority])}>
          {TASK_PRIORITY_LABELS[card.priority]}
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
      className={cn("flex w-64 shrink-0 flex-col rounded-xl bg-slate-100/70 p-2", isOver && "ring-2 ring-slate-400")}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{column.label}</h3>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {column.cards.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
        {column.cards.map((card) => (
          <TaskCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export function TasksBoard({ columns: initialColumns }: { columns: Column[] }) {
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
    const targetStatus = over.id as TaskStatus;
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
      updateTaskStatus(card.id, targetStatus).catch(() => setColumns(initialColumns));
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <Column key={column.status} column={column} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <TaskCard card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
