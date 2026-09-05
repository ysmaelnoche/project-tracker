"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { diffDays, formatStamp } from "@/lib/format";
import {
  archiveProject,
  markProduction,
  purgeProject,
  restoreProject,
  startDevelopment,
  togglePause,
} from "@/lib/projects/actions";
import { daysUntilPurgeEligible, isPurgeEligible } from "@/lib/projects/purge";
import { PurgeSequence } from "@/components/projects/PurgeSequence";
import type { Project } from "@/lib/types";

type ConfirmKind = "start" | "production" | "archive" | null;

interface ProjectActionsProps {
  project: Pick<
    Project,
    "id" | "ref" | "name" | "status" | "devStartDate" | "publishedDate" | "archivedAt"
  >;
  openTaskCount: number;
  today: string;
  confirmBeforeArchive: boolean;
}

const GENERIC_ERROR = "Something went wrong. Your project data is unaffected — try again.";

export function ProjectActions({
  project,
  openTaskCount,
  today,
  confirmBeforeArchive,
}: ProjectActionsProps) {
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function closeConfirm() {
    if (!isPending) setConfirmKind(null);
  }

  function runStart() {
    startTransition(async () => {
      try {
        await startDevelopment(project.id);
        setConfirmKind(null);
        toast.show({
          label: "BUILD INITIATED",
          tone: "accent",
          message: `${project.ref} ${project.name} is in build. Start date recorded.`,
        });
        router.refresh();
      } catch {
        toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
      }
    });
  }

  function runProduction() {
    const dur = project.devStartDate ? diffDays(project.devStartDate, today) : 0;
    startTransition(async () => {
      try {
        await markProduction(project.id);
        setConfirmKind(null);
        toast.show({
          label: "DEPLOYED",
          tone: "teal",
          message: `${project.name} shipped — ${dur} day${dur === 1 ? "" : "s"} from build start to deployment.`,
        });
        router.refresh();
      } catch {
        toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
      }
    });
  }

  function runTogglePause() {
    const goingToPause = project.status === "in_development";
    startTransition(async () => {
      try {
        await togglePause(project.id);
        toast.show({
          label: goingToPause ? "BUILD HELD" : "BUILD RESUMED",
          tone: "accent",
          message: goingToPause
            ? `${project.name} on hold. Progress frozen as-is.`
            : `${project.name} is moving again.`,
        });
        router.refresh();
      } catch {
        toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
      }
    });
  }

  function runArchive() {
    startTransition(async () => {
      try {
        await archiveProject(project.id);
        setConfirmKind(null);
        toast.show({
          label: "DECOMMISSIONED",
          tone: "red",
          message: `${project.name} removed from active views. Nothing was deleted.`,
          actionLabel: "RESTORE",
          onAction: () => {
            startTransition(async () => {
              try {
                await restoreProject(project.id);
                toast.show({
                  label: "RESTORED",
                  tone: "teal",
                  message: `${project.name} returned to active views.`,
                });
                router.refresh();
              } catch {
                toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
              }
            });
          },
        });
        router.push("/projects");
      } catch {
        toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
      }
    });
  }

  function runRestore() {
    startTransition(async () => {
      try {
        await restoreProject(project.id);
        toast.show({
          label: "RESTORED",
          tone: "teal",
          message: `${project.name} returned to active views.`,
        });
        router.refresh();
      } catch {
        toast.show({ label: "ACTION FAILED", tone: "red", message: GENERIC_ERROR });
      }
    });
  }

  function handleArchiveClick() {
    if (confirmBeforeArchive) {
      setConfirmKind("archive");
    } else {
      runArchive();
    }
  }

  function handlePurged() {
    toast.show({
      label: "PURGED",
      tone: "red",
      message: `${project.name} was permanently deleted. This cannot be undone.`,
    });
    router.push("/projects");
    router.refresh();
  }

  const purgeEligible = project.status === "archived" && isPurgeEligible(project.archivedAt, today);
  const purgeEtaDays =
    project.status === "archived" && !purgeEligible ? daysUntilPurgeEligible(project.archivedAt, today) : null;

  const dur = project.devStartDate ? diffDays(project.devStartDate, today) : 0;
  const productionBody =
    openTaskCount > 0
      ? `${openTaskCount} task${openTaskCount === 1 ? "" : "s"} still open. Deploying keeps them — nothing is discarded, the record just changes stage. Build start ${formatStamp(project.devStartDate)} → deploy ${formatStamp(today)} (${dur} day${dur === 1 ? "" : "s"}).`
      : `All tasks closed. Build start ${formatStamp(project.devStartDate)} → deploy ${formatStamp(today)} — ${dur} day${dur === 1 ? "" : "s"} of development.`;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {project.status === "pending" ? (
          <Button variant="primary" onClick={() => setConfirmKind("start")}>
            ▸ INITIATE BUILD
          </Button>
        ) : null}

        {project.status === "in_development" ? (
          <>
            <button
              onClick={() => setConfirmKind("production")}
              className="cursor-pointer bg-teal px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-bg transition-opacity hover:opacity-[0.82]"
            >
              ◈ DEPLOY
            </button>
            <Button variant="secondary" onClick={runTogglePause} disabled={isPending}>
              HOLD
            </Button>
          </>
        ) : null}

        {project.status === "paused" ? (
          <Button variant="primary" onClick={runTogglePause} disabled={isPending}>
            ▸ RESUME BUILD
          </Button>
        ) : null}

        {project.status === "archived" ? (
          <Button variant="primary" onClick={runRestore} disabled={isPending}>
            RESTORE
          </Button>
        ) : null}

        {project.status !== "archived" ? (
          <Button variant="danger" onClick={handleArchiveClick} disabled={isPending}>
            DECOMMISSION
          </Button>
        ) : null}

        {purgeEligible ? (
          <button
            onClick={() => setPurgeOpen(true)}
            className="cursor-pointer border border-red bg-transparent px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.13em] text-red transition-colors hover:bg-red hover:text-bg"
          >
            ☠ PURGE
          </button>
        ) : null}
      </div>

      {purgeEtaDays !== null ? (
        <span className="font-mono text-[9px] tracking-[0.12em] text-ink-faint">
          ELIGIBLE FOR PURGE IN {purgeEtaDays} DAY{purgeEtaDays === 1 ? "" : "S"}
        </span>
      ) : null}
      {purgeEligible ? (
        <span className="font-mono text-[9px] tracking-[0.12em] text-red">ELIGIBLE FOR PURGE</span>
      ) : null}

      <ConfirmDialog
        open={confirmKind === "start"}
        tone="accent"
        eyebrow="INITIATE BUILD"
        refLabel={project.ref}
        title={`Initiate build on ${project.name}?`}
        body="This is the point where the system starts keeping time for you — the start date and task creation unlock together."
        fromLabel="STANDBY"
        toLabel="BUILD"
        confirmLabel="INITIATE"
        cancelLabel="HOLD"
        pending={isPending}
        pendingLabel="INITIATING…"
        onConfirm={runStart}
        onClose={closeConfirm}
      />

      <ConfirmDialog
        open={confirmKind === "production"}
        tone="teal"
        eyebrow="DEPLOY"
        refLabel={project.ref}
        title={`Deploy ${project.name}?`}
        body={productionBody}
        fromLabel="BUILD"
        toLabel="DEPLOYED"
        confirmLabel="DEPLOY"
        cancelLabel="CANCEL"
        pending={isPending}
        pendingLabel="DEPLOYING…"
        onConfirm={runProduction}
        onClose={closeConfirm}
      />

      <ConfirmDialog
        open={confirmKind === "archive"}
        tone="red"
        eyebrow="DECOMMISSION"
        refLabel={project.ref}
        title={`Decommission ${project.name}?`}
        body="The record leaves active views but stays retrievable, with its tasks, notes and dates intact."
        fromLabel={project.status === "production" ? "DEPLOYED" : "BUILD"}
        toLabel="DECOMMISSIONED"
        confirmLabel="DECOMMISSION"
        cancelLabel="CANCEL"
        pending={isPending}
        pendingLabel="DECOMMISSIONING…"
        onConfirm={runArchive}
        onClose={closeConfirm}
      />

      <PurgeSequence
        open={purgeOpen}
        projectRef={project.ref}
        projectName={project.name}
        onPurge={() => purgeProject(project.id)}
        onPurged={handlePurged}
        onClose={() => setPurgeOpen(false)}
      />
    </div>
  );
}
