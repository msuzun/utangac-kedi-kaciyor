import Link from "next/link";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <main className="landing">
      <div className="panel">
        <p className="badge">HTML5 Mini Oyun</p>
        <h1>Utangaç Kedi Kaçıyor</h1>
        <p>
          Retro bir mini arcade denemesi. Kediyi ok tuşları ile yönlendir, takip
          eden gölgeden kaç ve çıkışa ulaş.
        </p>
        <Link href="/game" className="startButton">
          Oyunu Başlat
        </Link>
      </div>
    </main>
  );
}
