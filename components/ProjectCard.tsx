import Link from "next/link";
import type { Project } from "@/lib/projects";
import { ProjectVisual } from "./ProjectVisual";
export function ProjectCard({ project }: { project: Project }) { return <Link className="project-card" href={`/work/${project.slug}`}><ProjectVisual project={project} /><h2>{project.title}</h2></Link>; }
