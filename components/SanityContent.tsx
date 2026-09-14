import type {ReactNode} from "react";
import type {PortableBlock, PortableSpan, ProjectBodyItem, SanityImage} from "@/lib/sanity";

function renderSpan(span: PortableSpan, block: PortableBlock): ReactNode {
  let node: ReactNode = span.text;

  for (const mark of span.marks || []) {
    if (mark === "strong") node = <strong>{node}</strong>;
    else if (mark === "em") node = <em>{node}</em>;
    else if (mark === "code") node = <code>{node}</code>;
    else if (mark === "underline") node = <u>{node}</u>;
    else if (mark === "strike-through") node = <s>{node}</s>;
    else {
      const def = block.markDefs?.find((item) => item._key === mark);
      if (def?._type === "link" && def.href) {
        node = (
          <a
            href={def.href}
            target={def.openInNewTab ? "_blank" : undefined}
            rel={def.openInNewTab ? "noreferrer noopener" : undefined}
          >
            {node}
          </a>
        );
      }
    }
  }

  return <span key={span._key}>{node}</span>;
}

function TextBlock({block, project = false}: {block: PortableBlock; project?: boolean}) {
  const children = (block.children || []).map((span) => renderSpan(span, block));
  const className = project ? "project-text-block" : undefined;

  if (block.style === "h2") return <h2 className={className}>{children}</h2>;
  if (block.style === "h3") return <h3 className={className}>{children}</h3>;
  if (block.style === "blockquote") return <blockquote className={className}>{children}</blockquote>;
  return <p className={className}>{children}</p>;
}

export function RichText({value}: {value?: PortableBlock[]}) {
  if (!value?.length) return null;
  return <>{value.map((block) => <TextBlock block={block} key={block._key} />)}</>;
}

function ProjectImage({image}: {image: SanityImage}) {
  const src = image.asset?.url;
  if (!src) return null;

  return (
    <figure className="project-media sanity-project-image">
      <img src={src} alt={image.alt || ""} loading="lazy" decoding="async" />
      {image.caption ? <figcaption>{image.caption}</figcaption> : null}
    </figure>
  );
}

function youtubeEmbedUrl(url?: string) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let id = parsed.searchParams.get("v");
    if (!id && parsed.hostname === "youtu.be") id = parsed.pathname.slice(1);
    if (!id && parsed.pathname.startsWith("/embed/")) id = parsed.pathname.split("/")[2];
    if (!id && parsed.pathname.startsWith("/shorts/")) id = parsed.pathname.split("/")[2];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function ProjectBody({value}: {value?: ProjectBodyItem[]}) {
  if (!value?.length) return null;

  return (
    <div className="project-body">
      {value.map((item) => {
        if (item._type === "block") return <TextBlock block={item} project key={item._key} />;
        if (item._type === "projectImage") return <ProjectImage image={item} key={item._key} />;
        if (item._type === "imageGallery") {
          return (
            <div className="project-image-gallery" key={item._key}>
              {(item.images || []).map((image, index) => <ProjectImage image={image} key={`${item._key}-${index}`} />)}
            </div>
          );
        }
        if (item._type === "videoEmbed") {
          const embed = youtubeEmbedUrl(item.url);
          if (!embed) return item.url ? <p className="project-text-block" key={item._key}><a href={item.url}>{item.url}</a></p> : null;
          return (
            <figure className="project-video" key={item._key}>
              <iframe
                src={embed}
                title={item.caption || "Project video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {item.caption ? <figcaption>{item.caption}</figcaption> : null}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
