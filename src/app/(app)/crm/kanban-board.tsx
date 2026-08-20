"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { updateLeadStage } from "./actions";
import type { LeadStage } from "@/generated/prisma/enums";

type Card = {
  id: string;
  name: string;
  companyName: string | null;
  ownerName: string;
  stage: LeadStage;
  temperatureLabel: string;
  potentialValue: number | null;
  alertLevel: "NONE" | "YELLOW" | "RED";
  nextContactAt: string | null;
};

type Column = { stage: LeadStage; label: string; cards: Card[] };

const ALERT_STYLES: Record<Card["alertLevel"], string> = {
  NONE: "",
  YELLOW: "border-l-4 border-l-amber-400",
  RED: "border-l-4 border-l-red-500",
};

const TEMP_STYLES: Record<string, string> = {
  Quente: "bg-red-100 text-red-700",
  Morno: "bg-amber-100 text-amber-700",
  Frio: "bg-sky-100 text-sky-700",
};

function currency(v: number | null) {
  if (v === null) return null;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function LeadCard({ card }: { card: Card }) {
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
        ALERT_STYLES[card.alertLevel],
        isDragging && "opacity-40"
      )}
    >
      <Link href={`/crm/${card.id}`} onClick={(e) => e.stopPropagation()} className="block">
        <p className="text-sm font-medium text-slate-900">{card.name}</p>
        {card.companyName && <p className="text-xs text-slate-500">{card.companyName}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TEMP_STYLES[card.temperatureLabel])}>
            {card.temperatureLabel}
          </span>
          {card.potentialValue !== null && (
            <span className="text-[10px] font-medium text-slate-500">{currency(card.potentialValue)}</span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{card.ownerName}</p>
      </Link>
    </div>
  );
}

function Column({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70 p-2",
        isOver && "ring-2 ring-slate-400"
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{column.label}</h3>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {column.cards.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
        {column.cards.map((card) => (
          <LeadCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ columns: initialColumns }: { columns: Column[] }) {
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
    const targetStage = over.id as LeadStage;
    const sourceColumn = columns.find((c) => c.cards.some((card) => card.id === active.id));
    if (!sourceColumn || sourceColumn.stage === targetStage) return;

    const card = sourceColumn.cards.find((c) => c.id === active.id)!;

    setColumns((prev) =>
      prev.map((c) => {
        if (c.stage === sourceColumn.stage) return { ...c, cards: c.cards.filter((x) => x.id !== card.id) };
        if (c.stage === targetStage) return { ...c, cards: [{ ...card, stage: targetStage }, ...c.cards] };
        return c;
      })
    );

    startTransition(() => {
      updateLeadStage(card.id, targetStage).catch(() => {
        // revert on failure
        setColumns(initialColumns);
      });
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <Column key={column.stage} column={column} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <LeadCard card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
