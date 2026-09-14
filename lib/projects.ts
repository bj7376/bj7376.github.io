export type Project = {
  slug: string;
  title: string;
  year: string;
  type: string;
  venue?: string;
  summary: string;
  thumbnail?: string;
};

export const projects: Project[] = [
  {
    slug: "palpable-night-forest",
    title: "Palpable Night Forest",
    year: "2025",
    type: "Research",
    venue: "UIST ’25 Poster",
    summary: "A Sensorial Interface for Remote Engagement with Nocturnal Nature",
    thumbnail: "/mock/palpable-night-forest.jpg",
  },
  {
    slug: "silent-suspense",
    title: "Silent Suspense",
    year: "2025",
    type: "Research",
    venue: "UIST ’25 Poster",
    summary: "Multimodal Haptics for Horror Film Experiences for Deaf and Hard-of-Hearing (DHH) Audiences",
    thumbnail: "/mock/silent-suspense.jpg",
  },
  { slug: "blame-o-matic", title: "Blame-o-matic", year: "2024", type: "Design", summary: "A critical AI concept that delegates the awkward work of blaming someone else.", thumbnail: "/mock/blame-o-matic.jpg" },
  { slug: "bdti", title: "BdTI", year: "2024", type: "Design", summary: "A birding-centered interaction concept built around recording and reflecting on field experiences.", thumbnail: "/mock/bdti.jpg" },
  { slug: "baseball-matrix", title: "Baseball Matrix", year: "2023", type: "Design", summary: "An AI assistant concept that reflects the emotional state of a baseball fan." },
  { slug: "poly", title: "Poly", year: "2022", type: "Research", venue: "TEI ’22 WIP", summary: "A shape-changing conversational agent that helps identify multiple characters in storytelling." },
  { slug: "stockbox", title: "Stockbox", year: "2021", type: "Design", summary: "An onboarding concept for introducing investing through the act of gifting stocks." },
  { slug: "clingy", title: "Clingy", year: "2021", type: "Design", summary: "A haptic telepresence exploration for conveying remote physical contact." },
  { slug: "odo", title: "ODO", year: "2020", type: "Design", summary: "Location-based urban storytelling that attaches narratives to places in the city." },
  { slug: "wally", title: "Wally", year: "2019", type: "Design", summary: "A modular wall-sized gaming interface for shared physical play." },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
