import { createProject } from "@/lib/projects/actions";

const ERROR_COPY: Record<string, string> = {
  name_required: "Name is required.",
  invalid_type: "Choose a project type.",
  create_failed: "Could not create the project. Try again in a moment.",
};

/**
 * New project form (PLAN.md "Creating a Project"). Plain progressively-enhanced
 * form — no client JS required, `createProject` validates and redirects.
 */
export function NewProjectForm({ error }: { error?: string }) {
  const errorMessage = error ? (ERROR_COPY[error] ?? ERROR_COPY.create_failed) : null;

  return (
    <form action={createProject} className="flex flex-col gap-5">
      {errorMessage ? (
        <p className="font-mono text-xs tracking-[0.04em] text-red">{errorMessage}</p>
      ) : null}

      <div>
        <label htmlFor="name" className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint">
          NAME
        </label>
        <input
          id="name"
          name="name"
          required
          autoFocus
          placeholder="e.g. Orbit"
          className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm tracking-[0.02em] outline-none transition-colors focus:border-amber"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
        >
          DESCRIPTION
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What is this project, in one or two sentences?"
          className="mt-2.5 w-full resize-y border border-border-strong bg-track px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-amber"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">
          PROJECT TYPE
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-ink-2">
            <input type="radio" name="type" value="personal" defaultChecked required />
            PERSONAL
          </label>
          <label className="flex items-center gap-2 font-mono text-xs tracking-[0.05em] text-ink-2">
            <input type="radio" name="type" value="work" required />
            WORK
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1">
          <label
            htmlFor="priority"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            PRIORITY
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm uppercase tracking-[0.08em] outline-none transition-colors focus:border-amber"
          >
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="targetDate"
            className="block font-mono text-[9px] tracking-[0.16em] text-ink-faint"
          >
            TARGET DATE (OPTIONAL)
          </label>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            className="mt-2.5 w-full border border-border-strong bg-track px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-amber"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 w-full cursor-pointer bg-amber px-4 py-3 font-mono text-[11px] font-medium tracking-[0.16em] text-bg transition-colors hover:bg-amber-hover sm:w-auto sm:self-start"
      >
        + REGISTER PROJECT
      </button>
    </form>
  );
}
