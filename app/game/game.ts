import kaboom from "kaboom";

type GameoverPayload = {
  score: number;
  catches: number;
};

export function startGame(container: HTMLElement) {
  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const CATCHER_SIZE = 44;
  const CAT_SIZE = 40;
  const MOVE_SPEED = 300;

  const k = kaboom({
    global: false,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    letterbox: true,
    background: [20, 22, 38]
  });

  container.innerHTML = "";
  container.appendChild(k.canvas);
  k.canvas.style.touchAction = "none";

  const disposers: Array<() => void> = [];
  const registerDisposer = (dispose: () => void) => {
    disposers.push(dispose);
    return () => {
      const idx = disposers.indexOf(dispose);
      if (idx >= 0) disposers.splice(idx, 1);
      dispose();
    };
  };

  const clampToScreen = (obj: { pos: { x: number; y: number } }, size: number) => {
    obj.pos.x = Math.max(0, Math.min(GAME_WIDTH - size, obj.pos.x));
    obj.pos.y = Math.max(0, Math.min(GAME_HEIGHT - size, obj.pos.y));
  };

  const randomCatPos = () =>
    k.vec2(k.rand(80, GAME_WIDTH - CAT_SIZE - 80), k.rand(120, GAME_HEIGHT - CAT_SIZE - 30));

  const addButton = (label: string, centerX: number, centerY: number, w: number, h: number, onClick: () => void) => {
    const btn = k.add([
      k.rect(w, h, { radius: 10 }),
      k.pos(centerX - w / 2, centerY - h / 2),
      k.color(255, 88, 182),
      k.area(),
      "button"
    ]);
    k.add([
      k.text(label, { size: 20 }),
      k.pos(centerX, centerY),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);
    btn.onClick(onClick);
    return btn;
  };

  k.scene("start", () => {
    k.add([
      k.text("UTANGAC KEDI KACIYOR 1999", { size: 34 }),
      k.pos(GAME_WIDTH / 2, 150),
      k.anchor("center"),
      k.color(126, 242, 255)
    ]);
    k.add([
      k.text("Kediyi yakalamaya calis. 20 saniye suren var.", { size: 18 }),
      k.pos(GAME_WIDTH / 2, 200),
      k.anchor("center"),
      k.color(232, 232, 245)
    ]);

    addButton("Yakalamay\u0131 Dene", GAME_WIDTH / 2, 290, 300, 74, () => {
      k.go("play");
    });
  });

  k.scene("play", () => {
    let timeLeft = 20;
    let score = 0;
    let catches = 0;
    let ended = false;

    const timerText = k.add([
      k.text(`Sure: ${timeLeft}`, { size: 24 }),
      k.pos(20, 18),
      k.color(255, 236, 149),
      k.fixed()
    ]);
    const scoreText = k.add([
      k.text("Skor: 0", { size: 24 }),
      k.pos(20, 48),
      k.color(164, 250, 255),
      k.fixed()
    ]);

    k.add([
      k.rect(540, 66, { radius: 8 }),
      k.pos(20, 84),
      k.color(11, 15, 28),
      k.opacity(0.92),
      k.fixed()
    ]);
    const messageText = k.add([
      k.text("Mesaj: Kedi cok utangac, hemen kaciyor.", { size: 18, width: 520 }),
      k.pos(30, 102),
      k.color(232, 232, 245),
      k.fixed()
    ]);

    const catcher = k.add([
      k.rect(CATCHER_SIZE, CATCHER_SIZE, { radius: 8 }),
      k.pos(100, GAME_HEIGHT / 2),
      k.color(255, 145, 180),
      k.area(),
      "catcher"
    ]);
    const cat = k.add([
      k.rect(CAT_SIZE, CAT_SIZE, { radius: 8 }),
      randomCatPos(),
      k.color(253, 189, 31),
      k.area(),
      "cat"
    ]);

    let pointerActive = false;
    let pointerTarget = catcher.pos.clone();

    const updatePointerTarget = (event: PointerEvent) => {
      const rect = k.canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      pointerTarget = k.vec2((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (ended) return;
      pointerActive = true;
      updatePointerTarget(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerActive || ended) return;
      updatePointerTarget(event);
    };
    const onPointerUp = () => {
      pointerActive = false;
    };

    k.canvas.addEventListener("pointerdown", onPointerDown);
    k.canvas.addEventListener("pointermove", onPointerMove);
    k.canvas.addEventListener("pointerup", onPointerUp);
    k.canvas.addEventListener("pointercancel", onPointerUp);
    k.canvas.addEventListener("pointerleave", onPointerUp);

    const removePointer = registerDisposer(() => {
      k.canvas.removeEventListener("pointerdown", onPointerDown);
      k.canvas.removeEventListener("pointermove", onPointerMove);
      k.canvas.removeEventListener("pointerup", onPointerUp);
      k.canvas.removeEventListener("pointercancel", onPointerUp);
      k.canvas.removeEventListener("pointerleave", onPointerUp);
    });

    const finishPlay = () => {
      if (ended) return;
      ended = true;
      removePointer();
      k.go("gameover", { score, catches } satisfies GameoverPayload);
    };

    catcher.onCollide("cat", () => {
      if (ended) return;
      catches += 1;
      score += 100;
      scoreText.text = `Skor: ${score}`;
      messageText.text = "Mesaj: Neredeyse! Kedi yine izini kaybettirdi.";
      cat.pos = randomCatPos();
      k.shake(2);
    });

    k.onKeyDown("left", () => {
      if (!ended) catcher.move(-MOVE_SPEED, 0);
    });
    k.onKeyDown("right", () => {
      if (!ended) catcher.move(MOVE_SPEED, 0);
    });
    k.onKeyDown("up", () => {
      if (!ended) catcher.move(0, -MOVE_SPEED);
    });
    k.onKeyDown("down", () => {
      if (!ended) catcher.move(0, MOVE_SPEED);
    });

    const catWander = k.rand(0, 1000);
    k.onUpdate(() => {
      if (ended) return;

      if (pointerActive) {
        const toTarget = pointerTarget.sub(catcher.pos);
        if (toTarget.len() > 3) {
          catcher.move(toTarget.unit().scale(MOVE_SPEED));
        }
      }

      const fleeDir = cat.pos.sub(catcher.pos);
      const fleeSpeed = 175 + Math.sin(k.time() + catWander) * 30;
      if (fleeDir.len() > 0.5) {
        cat.move(fleeDir.unit().scale(fleeSpeed));
      }
      cat.move(Math.sin(k.time() * 2.4 + catWander) * 35, Math.cos(k.time() * 2.1 + catWander) * 35);

      clampToScreen(catcher, CATCHER_SIZE);
      clampToScreen(cat, CAT_SIZE);

      const dist = Math.floor(catcher.pos.dist(cat.pos));
      if (dist < 130) {
        messageText.text = "Mesaj: Yaklastin! Hemen ustune git.";
      } else {
        messageText.text = "Mesaj: Pati izlerini takip et.";
      }
    });

    k.loop(1, () => {
      if (ended) return;
      timeLeft -= 1;
      timerText.text = `Sure: ${Math.max(timeLeft, 0)}`;
      if (timeLeft <= 0) finishPlay();
    });
  });

  k.scene("gameover", (payload?: GameoverPayload) => {
    const score = payload?.score ?? 0;
    const catches = payload?.catches ?? 0;

    k.add([
      k.text("Kedi yine ka\u00e7t\u0131.", { size: 58 }),
      k.pos(GAME_WIDTH / 2, 130),
      k.anchor("center"),
      k.color(255, 204, 112)
    ]);

    k.add([
      k.rect(610, 110, { radius: 10 }),
      k.pos((GAME_WIDTH - 610) / 2, 182),
      k.color(11, 15, 28),
      k.opacity(0.92)
    ]);
    k.add([
      k.text(`Skor Ozeti\nSkor: ${score}\nYakalama: ${catches}`, { size: 24, align: "center", width: 610 }),
      k.pos(GAME_WIDTH / 2, 205),
      k.anchor("top"),
      k.color(190, 245, 255)
    ]);

    k.add([
      k.text("Bu oyun D\u00fcnya Kedi G\u00fcn\u00fc i\u00e7in yap\u0131ld\u0131.\nVe evet, biri biraz u\u011fra\u015ft\u0131.", { size: 20, align: "center", width: 760 }),
      k.pos(GAME_WIDTH / 2, 345),
      k.anchor("center"),
      k.color(232, 232, 245)
    ]);

    addButton("Tekrar Dene", GAME_WIDTH / 2, 440, 260, 68, () => {
      k.go("start");
    });

    addButton("Miyav.", GAME_WIDTH - 102, GAME_HEIGHT - 38, 130, 44, () => {
      k.shake(8);
      k.add([
        k.text("Miyav.", { size: 72 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
        k.anchor("center"),
        k.color(255, 252, 179),
        k.lifespan(0.9)
      ]);

      for (let i = 0; i < 34; i += 1) {
        const angle = k.rand(0, 360);
        const speed = k.rand(120, 320);
        k.add([
          k.rect(8, 8),
          k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
          k.color(k.rand(120, 255), k.rand(120, 255), k.rand(120, 255)),
          k.move(angle, speed),
          k.lifespan(0.8)
        ]);
      }
    });
  });

  k.go("start");

  return () => {
    while (disposers.length > 0) {
      const dispose = disposers.pop();
      dispose?.();
    }
    k.quit();
    container.innerHTML = "";
  };
}
