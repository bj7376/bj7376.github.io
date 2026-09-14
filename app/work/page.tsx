import { ProjectCard } from "@/components/ProjectCard";
import { projects as localProjects } from "@/lib/projects";
import { getSanityProjects } from "@/lib/sanity";

export const metadata = { title: "Work" };

export default async function WorkPage() {
  const sanityProjects = await getSanityProjects();
  const projects = sanityProjects.length ? sanityProjects : localProjects;

  return (
    <section className="work-page">
      <div className="project-grid original-grid">
        {projects.map((project) => <ProjectCard project={project} key={project.slug} />)}
      </div>
    </section>
  );
}
