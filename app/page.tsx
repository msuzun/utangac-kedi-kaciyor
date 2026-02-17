import Link from "next/link";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <main className="landing">
      <div className="stars" aria-hidden="true" />
      <section className="panel landingPanel">
        <p className="badge">FLASH WEB ARCADE</p>
        <h1>UTANGA&#199; KED&#304; KA&#199;IYOR 1999</h1>
        <p className="tagline">Bug&#252;n D&#252;nya Kedi G&#252;n&#252; &#128062;</p>
        <Link href="/game" className="startButton">
          Oyuna Gir
        </Link>
      </section>
    </main>
  );
}
