export type ProjectVisualData = {
  title: string;
  thumbnail?: string;
  coverImage?: {asset?: {url?: string}; alt?: string};
};

export function ProjectVisual({ project, large = false }: { project: ProjectVisualData; large?: boolean }) {
  const src = project.coverImage?.asset?.url || project.thumbnail;
  const alt = project.coverImage?.alt || "";

  if (src) {
    return (
      <div className={`project-visual ${large ? "large" : ""}`}>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={`project-visual project-visual-empty ${large ? "large" : ""}`} aria-hidden="true">
      <span>{project.title}</span>
    </div>
  );
}
