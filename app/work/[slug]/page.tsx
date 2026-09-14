import { notFound } from "next/navigation";
import { ProjectBody } from "@/components/SanityContent";
import { getProject as getLocalProject } from "@/lib/projects";
import { getSanityProject } from "@/lib/sanity";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sanityProject = await getSanityProject(slug);
  const localProject = sanityProject ? null : getLocalProject(slug);
  const project = sanityProject || localProject;

  if (!project) return { title: "Work" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sanityProject = await getSanityProject(slug);

  if (sanityProject) {
    return (
      <article className="original-project-page">
        <div className="project-feature-line">
          {sanityProject.venue ? <>featured @ {sanityProject.venue}</> : <>{sanityProject.type} · {sanityProject.year}</>}
        </div>
        <header className="original-project-title">
          <h1>{sanityProject.title}</h1>
          {(sanityProject.subtitle || sanityProject.summary) ? <h2>{sanityProject.subtitle || sanityProject.summary}</h2> : null}
        </header>
        <ProjectBody value={sanityProject.body} />
      </article>
    );
  }

  const project = getLocalProject(slug);
  if (!project) notFound();

  const isPNF = project.slug === "palpable-night-forest";

  return (
    <article className="original-project-page">
      <div className="project-feature-line">
        {project.venue ? <>featured @ {project.venue}</> : <>{project.type} · {project.year}</>}
      </div>
      <header className="original-project-title">
        <h1>{project.title}</h1>
        <h2>{project.summary}</h2>
      </header>

      {isPNF ? (
        <>
          <figure className="project-media"><img src="/mock/pnf-detail-01.jpg" alt="Palpable Night Forest prototype" /></figure>
          <figure className="project-media wide-secondary"><img src="/mock/pnf-detail-02.jpg" alt="Soil tray detail" /></figure>
          <div className="original-project-prose">
            <p>Human and nature have been disconnected in the modern era—both physical separation and psychological alienation. Rapid urbanization has pushed nature far away from our daily lives. The fields and mountains that were once nearby are now difficult to reach for many city dwellers, disrupting the first-hand, bodily experiences that ground human-nature relationships.</p>
            <p>To reconnect humans with nature, recent Human–Computer Interaction (HCI) studies have sought to engage with remote natural environments, bringing wilderness into daily life to provide rich sensory experiences often lacking within urban constraints.</p>
            <p>These attempts include not only providing remote screens through user-deployed or user-built cameras but also replicating natural phenomena like ocean waves as kinetic art. Furthermore, some researchers have explored sensory embodiment, such as translating wind into a tactile experience on a garment.</p>
          </div>
        </>
      ) : (
        <>
          <div className="project-media project-media-placeholder">Project media will be migrated from the current site.</div>
          <div className="original-project-prose"><p>{project.summary}</p><p>This page intentionally follows the visual language of the existing portfolio. Its original images and full narrative will be migrated later.</p></div>
        </>
      )}
    </article>
  );
}
