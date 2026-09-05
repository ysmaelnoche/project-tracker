import { describe, expect, it } from "vitest";
import {
  selectActiveProjects,
  selectDeployedProjects,
  selectStandbyProjects,
} from "@/lib/dashboard/projects-select";
import type { ProjectStatus, ProjectType } from "@/lib/types";

function project(
  status: ProjectStatus,
  type: ProjectType = "personal",
  publishedDate: string | null = null,
) {
  return { status, type, publishedDate };
}

describe("selectActiveProjects", () => {
  it("returns only in_development projects", () => {
    const projects = [project("pending"), project("in_development"), project("production")];
    expect(selectActiveProjects(projects, "all")).toHaveLength(1);
  });

  it("respects scope", () => {
    const projects = [
      project("in_development", "personal"),
      project("in_development", "work"),
    ];
    expect(selectActiveProjects(projects, "work")).toHaveLength(1);
    expect(selectActiveProjects(projects, "all")).toHaveLength(2);
  });
});

describe("selectStandbyProjects", () => {
  it("returns only pending projects, scoped", () => {
    const projects = [
      project("pending", "personal"),
      project("pending", "work"),
      project("in_development", "personal"),
    ];
    expect(selectStandbyProjects(projects, "all")).toHaveLength(2);
    expect(selectStandbyProjects(projects, "personal")).toHaveLength(1);
  });
});

describe("selectDeployedProjects", () => {
  it("returns only production projects, most recently published first", () => {
    const projects = [
      project("production", "personal", "2026-01-01"),
      project("production", "personal", "2026-09-01"),
      project("production", "personal", "2026-05-01"),
    ];
    const result = selectDeployedProjects(projects, "all", 10);
    expect(result.map((p) => p.publishedDate)).toEqual(["2026-09-01", "2026-05-01", "2026-01-01"]);
  });

  it("caps the result", () => {
    const projects = [
      project("production", "personal", "2026-01-01"),
      project("production", "personal", "2026-02-01"),
      project("production", "personal", "2026-03-01"),
    ];
    expect(selectDeployedProjects(projects, "all", 2)).toHaveLength(2);
  });

  it("respects scope", () => {
    const projects = [
      project("production", "personal", "2026-01-01"),
      project("production", "work", "2026-02-01"),
    ];
    expect(selectDeployedProjects(projects, "work", 10)).toHaveLength(1);
  });
});
