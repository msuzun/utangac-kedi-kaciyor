import kaboom from "kaboom";

export function startGame(container: HTMLElement) {
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
  let pointerActive = false;
  let pointerTarget = playerStart(k);

  const info = k.add([
    k.text("Ok tuslari / dokun: hareket | R: yeniden baslat", { size: 20 }),
    k.pos(20, 16),
    k.color(230, 230, 255),
    k.fixed()
  ]);

  k.add([
    k.rect(70, 460),
    k.pos(870, 40),
    k.color(253, 189, 31),
    k.area(),
    "goal"
  ]);

  const player = k.add([
    k.rect(44, 44, { radius: 8 }),
    playerStart(k),
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
    pointerActive = false;
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

  const updatePointerTarget = (event: PointerEvent) => {
    const rect = k.canvas.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 540 / rect.height;
    pointerTarget = k.vec2((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (isFinished) return;
    pointerActive = true;
    updatePointerTarget(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!pointerActive || isFinished) return;
    updatePointerTarget(event);
  };

  const onPointerUp = () => {
    pointerActive = false;
  };

  k.canvas.style.touchAction = "none";
  k.canvas.addEventListener("pointerdown", onPointerDown);
  k.canvas.addEventListener("pointermove", onPointerMove);
  k.canvas.addEventListener("pointerup", onPointerUp);
  k.canvas.addEventListener("pointercancel", onPointerUp);
  k.canvas.addEventListener("pointerleave", onPointerUp);

  k.onUpdate(() => {
    clampPlayer();
    if (isFinished) return;

    if (pointerActive) {
      const toTarget = pointerTarget.sub(player.pos);
      if (toTarget.len() > 4) {
        player.move(toTarget.unit().scale(speed));
      }
    }

    const dir = player.pos.sub(chaser.pos);
    if (dir.len() > 1) {
      chaser.move(dir.unit().scale(chaserSpeed));
    }

    const dist = player.pos.dist(chaser.pos);
    info.text = `Kacis mesafesi: ${Math.floor(dist)} px`;
  });

  return () => {
    pointerActive = false;
    k.canvas.removeEventListener("pointerdown", onPointerDown);
    k.canvas.removeEventListener("pointermove", onPointerMove);
    k.canvas.removeEventListener("pointerup", onPointerUp);
    k.canvas.removeEventListener("pointercancel", onPointerUp);
    k.canvas.removeEventListener("pointerleave", onPointerUp);
    k.quit();
    container.innerHTML = "";
  };
}

function playerStart(k: ReturnType<typeof kaboom>) {
  return k.vec2(80, 250);
}
