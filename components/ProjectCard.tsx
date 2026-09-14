import Link from "next/link";
import { ProjectVisual, type ProjectVisualData } from "./ProjectVisual";

export type ProjectCardData = ProjectVisualData & {
  slug: string;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link className="project-card" href={`/work/${project.slug}`}>
      <ProjectVisual project={project} />
      <h2>{project.title}</h2>
    </Link>
  );
}
