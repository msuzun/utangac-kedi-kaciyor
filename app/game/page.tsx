import GameClient from "./GameClient";

export const dynamic = "force-static";

export default function GamePage() {
  return (
    <main className="gamePage">
      <div className="gameHeader">
        <h1>Utangac Kedi Kaciyor</h1>
        <p>Kediye tikla veya dokun. Utangac kacisini yakalayamazsin.</p>
      </div>
      <GameClient />
    </main>
  );
}
