export const metadata = { title: "Bio" };

const publications = [
  {
    title: "Palpable Night Forest: A Sensorial Interface for Remote Engagement with Nocturnal Nature",
    authors: "Byoungjae Kim and Chang Hee Lee.",
    venue: "UIST'25 Poster",
    href: "https://dl.acm.org/doi/10.1145/3746058.3758445",
  },
  {
    title: "Silent Suspense: Multimodal Haptics for Horror Film Experiences for Deaf and Hard-of-Hearing (DHH) Audiences",
    authors: "Byoungjae Kim, Yoonji Lee, Jongik Jeon, Gurim Kim, Geumjin Lee, and Chang Hee Lee.",
    venue: "UIST'25 Poster",
    href: "https://dl.acm.org/doi/10.1145/3746058.3758352",
  },
  {
    title: "Poly: Shape-changing Conversational Agent Helps Identify Multiple Characters in Storytelling",
    authors: "Byoungjae Kim, Jiwoo Hong, and Woohun Lee.",
    venue: "TEI'22 Work-in-Progress",
    href: "https://dl.acm.org/",
  },
  {
    title: "Designing a Shape-changing Conversational Agent Displaying Multiple Characters with a Single Embodiment",
    authors: "Byoungjae Kim, Jiwoo Hong, and Woohun Lee.",
    venue: "KSDS'20 (in Korean)",
  },
];

export default function HomePage() {
  return (
    <article className="bio-page">
      <section className="bio-intro">
        <figure className="bio-portrait">
          <img src="/mock/portrait.jpg" alt="Byoungjae Kim outdoors at Mt. Daedun-san" />
          <figcaption><strong>Veni, vidi, cepi?</strong> <em>A moment at <strong>Mt. Daedun-san</strong>, South Korea</em></figcaption>
        </figure>

        <div className="bio-copy">
          <p>
            I am an interaction designer, nature enthusiast, and technologist, investigating human-nature engagement in HCI.
            I am currently a Ph.D. student at the <a href="https://asc.kaist.ac.kr/">Affective Systems and Cognition Lab</a> in the <a href="https://id.kaist.ac.kr/">Dept. of Industrial Design</a>, <a href="https://kaist.ac.kr/">KAIST</a>, South Korea, under the supervision of Prof. Chang Hee Lee.
          </p>
          <p>On a personal note, I am also an amateur birder who enjoys <a href="/birding">taking photos and creating bird memes</a>!</p>
          <p><a href="mailto:bj.kim@kaist.ac.kr">Email: bj.kim@kaist.ac.kr</a></p>
          <p><a href="https://scholar.google.com/citations?hl=ko&user=yyE1Y_gAAAAJ">Google Scholar</a></p>
          <p><a href="https://ebird.org/profile/MjY3MDQwMA">eBird profile</a> (Birding Log)</p>
        </div>
      </section>

      <section className="bio-section publications-section">
        <h1>Publications</h1>
        <div className="publication-list">
          {publications.map((pub) => (
            <div className="publication" key={pub.title}>
              {pub.href ? <a className="publication-title" href={pub.href}>{pub.title}</a> : <strong className="publication-title plain">{pub.title}</strong>}
              <p>{pub.authors} <strong>{pub.venue}</strong></p>
            </div>
          ))}
        </div>
      </section>

      <section className="bio-section text-list-section">
        <h2>Awards, Honors and Qualifications</h2>
        <p>Field Investigator @ National Ecosystem Survey (Citizen Participation), 2025</p>
        <p>Certified Wildlife Videographer (Birds) @ eBird, 2025</p>
        <p>Outstanding TA Award @ Edu4.0Q Program, Spring 2022</p>
        <p>iF Design Award (Communication), 2021</p>
        <p>Outstanding Paper Award @ DSUS, Spring 2020</p>
      </section>

      <section className="bio-section text-list-section">
        <h2>Exhibitions</h2>
        <p>Gwangju Design Biennale, Gwangju Biennale, 2025</p>
        <p>Korea Young Designer's Exhibition (KYODEX), Seoul SMWU, 2022</p>
        <p>Seoul Design Festival, Seoul COEX, 2021</p>
        <p>ID KAIST Graduation Show, Daejeon KAIST, 2021</p>
        <p>( &nbsp; ) Objects, Daejeon KAIST, 2017</p>
      </section>
    </article>
  );
}
