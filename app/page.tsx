import { RichText } from "@/components/SanityContent";
import {
  getSanityAwards,
  getSanityBio,
  getSanityExhibitions,
  getSanityPublications,
} from "@/lib/sanity";

export const metadata = { title: "Bio" };

const fallbackPublications = [
  { title: "Palpable Night Forest: A Sensorial Interface for Remote Engagement with Nocturnal Nature", authors: "Byoungjae Kim and Chang Hee Lee.", venue: "UIST'25 Poster", year: 2025, url: "https://dl.acm.org/doi/10.1145/3746058.3758445" },
  { title: "Silent Suspense: Multimodal Haptics for Horror Film Experiences for Deaf and Hard-of-Hearing (DHH) Audiences", authors: "Byoungjae Kim, Yoonji Lee, Jongik Jeon, Gurim Kim, Geumjin Lee, and Chang Hee Lee.", venue: "UIST'25 Poster", year: 2025, url: "https://dl.acm.org/doi/10.1145/3746058.3758352" },
  { title: "Poly: Shape-changing Conversational Agent Helps Identify Multiple Characters in Storytelling", authors: "Byoungjae Kim, Jiwoo Hong, and Woohun Lee.", venue: "TEI'22 Work-in-Progress", year: 2022, url: "https://dl.acm.org/doi/10.1145/3490149.3505573" },
  { title: "Designing a Shape-changing Conversational Agent Displaying Multiple Characters with a Single Embodiment", authors: "Byoungjae Kim, Jiwoo Hong, and Woohun Lee.", venue: "KSDS'20 (in Korean)", year: 2020 },
];

const fallbackAwards = [
  { title: "Field Investigator", organization: "National Ecosystem Survey (Citizen Participation)", year: 2025 },
  { title: "Certified Wildlife Videographer (Birds)", organization: "eBird", year: 2025 },
  { title: "Outstanding TA Award", organization: "Edu4.0Q Program", year: 2022, note: "Spring 2022" },
  { title: "iF Design Award", organization: "Communication", year: 2021 },
  { title: "Outstanding Paper Award", organization: "DSUS", year: 2020, note: "Spring 2020" },
];

const fallbackExhibitions = [
  { title: "Gwangju Design Biennale", venue: "Gwangju Biennale", location: "Gwangju", year: 2025 },
  { title: "Korea Young Designer's Exhibition (KYODEX)", venue: "Seoul SMWU", location: "Seoul", year: 2022 },
  { title: "Seoul Design Festival", venue: "COEX", location: "Seoul", year: 2021 },
  { title: "ID KAIST Graduation Show", venue: "KAIST", location: "Daejeon", year: 2021 },
  { title: "(   ) Objects", venue: "KAIST", location: "Daejeon", year: 2017 },
];

function awardText(award: {title: string; organization?: string; year: number; note?: string}) {
  if (award.organization === "Communication") return `${award.title} (${award.organization}), ${award.year}`;
  return `${award.title}${award.organization ? ` @ ${award.organization}` : ""}, ${award.note || award.year}`;
}

function exhibitionText(exhibition: {title: string; venue?: string; location?: string; year: number}) {
  const venue = exhibition.venue || "";
  const place = exhibition.location && !venue.toLowerCase().startsWith(exhibition.location.toLowerCase())
    ? `${exhibition.location}${venue ? ` ${venue}` : ""}`
    : venue || exhibition.location || "";
  return `${exhibition.title}${place ? `, ${place}` : ""}, ${exhibition.year}`;
}

export default async function HomePage() {
  const [bio, sanityPublications, sanityAwards, sanityExhibitions] = await Promise.all([
    getSanityBio(),
    getSanityPublications(),
    getSanityAwards(),
    getSanityExhibitions(),
  ]);

  const publications = sanityPublications.length ? sanityPublications : fallbackPublications;
  const awards = sanityAwards.length ? sanityAwards : fallbackAwards;
  const exhibitions = sanityExhibitions.length ? sanityExhibitions : fallbackExhibitions;
  const portraitSrc = bio?.portrait?.asset?.url || "/mock/portrait.jpg";
  const portraitAlt = bio?.portrait?.alt || "Byoungjae Kim outdoors at Mt. Daedun-san";

  return (
    <article className="bio-page">
      <section className="bio-intro">
        <figure className="bio-portrait">
          <img src={portraitSrc} alt={portraitAlt} />
          {bio?.portrait?.caption ? (
            <figcaption>{bio.portrait.caption}</figcaption>
          ) : (
            <figcaption><strong>Veni, vidi, cepi?</strong> <em>A moment at <strong>Mt. Daedun-san</strong>, South Korea</em></figcaption>
          )}
        </figure>

        <div className="bio-copy">
          {bio?.intro?.length ? (
            <RichText value={bio.intro} />
          ) : (
            <>
              <p>
                I am an interaction designer, nature enthusiast, and technologist, investigating human-nature engagement in HCI.
                I am currently a Ph.D. student at the <a href="https://asc.kaist.ac.kr/">Affective Systems and Cognition Lab</a> in the <a href="https://id.kaist.ac.kr/">Dept. of Industrial Design</a>, <a href="https://kaist.ac.kr/">KAIST</a>, South Korea, under the supervision of Prof. Chang Hee Lee.
              </p>
              <p>On a personal note, I am also an amateur birder who enjoys <a href="/birding">taking photos and creating bird memes</a>!</p>
            </>
          )}
          <p><a href={`mailto:${bio?.emailAddress || "bj.kim@kaist.ac.kr"}`}>Email: {bio?.emailAddress || "bj.kim@kaist.ac.kr"}</a></p>
          <p><a href={bio?.googleScholarUrl || "https://scholar.google.com/citations?hl=ko&user=yyE1Y_gAAAAJ"}>Google Scholar</a></p>
          <p><a href={bio?.ebirdUrl || "https://ebird.org/profile/MjY3MDQwMA"}>eBird profile</a> (Birding Log)</p>
          {bio?.cvUrl ? <p><a href={bio.cvUrl}>CV</a></p> : null}
        </div>
      </section>

      <section className="bio-section publications-section">
        <h1>Publications</h1>
        <div className="publication-list">
          {publications.map((pub) => (
            <div className="publication" key={pub.title}>
              {pub.url ? <a className="publication-title" href={pub.url}>{pub.title}</a> : <strong className="publication-title plain">{pub.title}</strong>}
              <p>{pub.authors} <strong>{pub.venue}</strong></p>
            </div>
          ))}
        </div>
      </section>

      <section className="bio-section text-list-section">
        <h2>Awards, Honors and Qualifications</h2>
        {awards.map((award) => <p key={`${award.title}-${award.year}`}>{awardText(award)}</p>)}
      </section>

      <section className="bio-section text-list-section">
        <h2>Exhibitions</h2>
        {exhibitions.map((exhibition) => <p key={`${exhibition.title}-${exhibition.year}`}>{exhibitionText(exhibition)}</p>)}
      </section>
    </article>
  );
}
