import GameClient from "./GameClient";

export const dynamic = "force-static";

export default function GamePage() {
  return (
    <main className="gamePage">
      <div className="gameHeader">
        <h1>Utangaç Kedi Kaçıyor</h1>
        <p>Ok tuşlarıyla hareket et. Takipçiye yakalanma.</p>
      </div>
      <GameClient />
    </main>
  );
}
