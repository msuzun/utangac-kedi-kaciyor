import dynamic from "next/dynamic";

export const dynamic = "force-static";

const GameClient = dynamic(() => import("./GameClient"), {
  ssr: false
});

export default function GamePage() {
  return (
    <main className="gamePage">
      <div className="gameHeader">
        <h1>Utangac Kedi Kaciyor</h1>
        <p>Ok tuslariyla hareket et. Takipciye yakalanma.</p>
      </div>
      <GameClient />
    </main>
  );
}
