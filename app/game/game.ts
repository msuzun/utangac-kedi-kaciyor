import kaboom from "kaboom";

export function mountGame(container: HTMLDivElement) {
  const k = kaboom({
    global: false,
    width: 960,
    height: 540,
    letterbox: true,
    background: [20, 22, 38]
  });

  container.innerHTML = "";
  container.appendChild(k.canvas);

  const speed = 300;
  const chaserSpeed = 190;
  let isFinished = false;

  const info = k.add([
    k.text("Ok tuslari: hareket | R: yeniden baslat", { size: 20 }),
    k.pos(20, 16),
    k.color(230, 230, 255),
    k.fixed()
  ]);

  const goal = k.add([
    k.rect(70, 460),
    k.pos(870, 40),
    k.color(253, 189, 31),
    k.area(),
    "goal"
  ]);

  const player = k.add([
    k.rect(44, 44, { radius: 8 }),
    k.pos(80, 250),
    k.color(255, 145, 180),
    k.area(),
    "player"
  ]);

  const chaser = k.add([
    k.rect(50, 50, { radius: 6 }),
    k.pos(390, 250),
    k.color(120, 180, 255),
    k.area(),
    "chaser"
  ]);

  function clampPlayer() {
    player.pos.x = Math.max(0, Math.min(960 - 44, player.pos.x));
    player.pos.y = Math.max(0, Math.min(540 - 44, player.pos.y));
  }

  function endGame(message: string) {
    if (isFinished) return;
    isFinished = true;
    k.add([
      k.rect(640, 140, { radius: 12 }),
      k.pos(160, 190),
      k.color(10, 12, 20),
      k.opacity(0.9),
      k.fixed()
    ]);
    k.add([
      k.text(message, { size: 40, align: "center", width: 640 }),
      k.pos(160, 220),
      k.color(255, 244, 180),
      k.fixed()
    ]);
    k.add([
      k.text("R tusu ile tekrar oyna", { size: 20, align: "center", width: 640 }),
      k.pos(160, 280),
      k.color(232, 232, 245),
      k.fixed()
    ]);
  }

  k.onKeyDown("left", () => {
    if (!isFinished) player.move(-speed, 0);
  });
  k.onKeyDown("right", () => {
    if (!isFinished) player.move(speed, 0);
  });
  k.onKeyDown("up", () => {
    if (!isFinished) player.move(0, -speed);
  });
  k.onKeyDown("down", () => {
    if (!isFinished) player.move(0, speed);
  });

  k.onKeyPress("r", () => {
    window.location.reload();
  });

  player.onCollide("goal", () => endGame("Kazandin! Utangac kedi kurtuldu."));
  player.onCollide("chaser", () => endGame("Yakalandin!"));

  k.onUpdate(() => {
    clampPlayer();
    if (isFinished) return;

    const dir = player.pos.sub(chaser.pos);
    if (dir.len() > 1) {
      chaser.move(dir.unit().scale(chaserSpeed));
    }

    const dist = player.pos.dist(chaser.pos);
    info.text = `Kacis mesafesi: ${Math.floor(dist)} px`;
  });

  return () => {
    k.quit();
    container.innerHTML = "";
  };
}
