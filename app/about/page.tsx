export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="article-page about-page">
      <p className="eyebrow">About</p>
      <h1>Byoungjae Kim</h1>
      <div className="about-grid">
        <div className="portrait-placeholder"><span>BK</span></div>
        <div className="prose large-prose">
          <p>I am an interaction designer, nature enthusiast, and technologist investigating human–nature engagement in HCI.</p>
          <p>I am currently a Ph.D. student at the Affective Systems and Cognition Lab in the Department of Industrial Design at KAIST, South Korea, under the supervision of Prof. Chang Hee Lee.</p>
          <p>On a personal note, I am also an amateur birder. The redesigned site treats those field records as a living archive rather than a separate photo gallery.</p>
          <div className="mini-rule" />
          <p className="small-copy">Publications, awards, exhibitions, CV, Google Scholar, and eBird links will be migrated here after the visual structure is settled.</p>
        </div>
      </div>
    </section>
  );
}
