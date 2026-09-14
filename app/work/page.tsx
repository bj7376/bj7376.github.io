import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <section className="work-page">
      <div className="project-grid original-grid">
        {projects.map((project) => <ProjectCard project={project} key={project.slug} />)}
      </div>
    </section>
  );
}
