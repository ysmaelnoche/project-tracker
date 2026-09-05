import { describe, expect, it } from "vitest";
import { filterProjects, type FilterableProject } from "@/lib/projects/filters";

function project(overrides: Partial<FilterableProject>): FilterableProject {
  return { id: "p1", type: "personal", status: "in_development", ...overrides };
}

describe("filterProjects", () => {
  const projects: FilterableProject[] = [
    project({ id: "a", type: "personal", status: "in_development" }),
    project({ id: "b", type: "work", status: "in_development" }),
    project({ id: "c", type: "personal", status: "pending" }),
    project({ id: "d", type: "work", status: "production" }),
    project({ id: "e", type: "personal", status: "archived" }),
  ];

  it("with every filter at 'all', excludes archived projects but keeps everything else", () => {
    const result = filterProjects(projects, { classFilter: "all", stageFilter: "all", scope: "all" });
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("an explicit stage filter of 'archived' surfaces archived projects", () => {
    const result = filterProjects(projects, {
      classFilter: "all",
      stageFilter: "archived",
      scope: "all",
    });
    expect(result.map((p) => p.id)).toEqual(["e"]);
  });

  it("applies the class filter", () => {
    const result = filterProjects(projects, {
      classFilter: "work",
      stageFilter: "all",
      scope: "all",
    });
    expect(result.map((p) => p.id)).toEqual(["b", "d"]);
  });

  it("applies the stage filter", () => {
    const result = filterProjects(projects, {
      classFilter: "all",
      stageFilter: "pending",
      scope: "all",
    });
    expect(result.map((p) => p.id)).toEqual(["c"]);
  });

  it("layers the shared scope filter on top of class/stage as an AND, not an override", () => {
    // class=all, scope=work -> only work projects, same as class=work would give
    const result = filterProjects(projects, {
      classFilter: "all",
      stageFilter: "all",
      scope: "work",
    });
    expect(result.map((p) => p.id)).toEqual(["b", "d"]);
  });

  it("intersects a conflicting class filter and scope down to nothing", () => {
    const result = filterProjects(projects, {
      classFilter: "personal",
      stageFilter: "all",
      scope: "work",
    });
    expect(result).toEqual([]);
  });
});
