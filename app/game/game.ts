import kaboom from "kaboom";

type GameoverPayload = {
  score: number;
};

export function startGame(container: HTMLElement) {
  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const CAT_SIZE = 40;
  const CAT_PADDING = 26;
  const CAT_TOP_PADDING = 164;

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

  const clampToCatZone = (obj: { pos: { x: number; y: number } }) => {
    obj.pos.x = Math.max(CAT_PADDING, Math.min(GAME_WIDTH - CAT_SIZE - CAT_PADDING, obj.pos.x));
    obj.pos.y = Math.max(CAT_TOP_PADDING, Math.min(GAME_HEIGHT - CAT_SIZE - CAT_PADDING, obj.pos.y));
  };

  const randomCatPos = () =>
    k.vec2(
      k.rand(CAT_PADDING, GAME_WIDTH - CAT_SIZE - CAT_PADDING),
      k.rand(CAT_TOP_PADDING, GAME_HEIGHT - CAT_SIZE - CAT_PADDING)
    );

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
    let ended = false;
    let scorePopTime = 0;
    let missMessageUntil = 0;
    const timerBasePos = k.vec2(20, 18);
    const scoreBasePos = k.vec2(20, 48);
    const defaultMessage = "Mesaj: Kediye tikla ama yakalayamazsin.";

    const timerText = k.add([
      k.text(`Sure: ${timeLeft}`, { size: 24 }),
      k.pos(timerBasePos),
      k.scale(1),
      k.color(255, 236, 149),
      k.fixed()
    ]);
    const scoreText = k.add([
      k.text("Skor: 0", { size: 24 }),
      k.pos(scoreBasePos),
      k.scale(1),
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
      k.text(defaultMessage, { size: 18, width: 520 }),
      k.pos(30, 102),
      k.color(232, 232, 245),
      k.fixed()
    ]);

    const cat = k.add([
      k.rect(CAT_SIZE, CAT_SIZE, { radius: 8 }),
      randomCatPos(),
      k.color(253, 189, 31),
      k.area(),
      "cat"
    ]);

    let dashActive = false;
    let dashFrom = cat.pos.clone();
    let dashTo = cat.pos.clone();
    let dashProgress = 0;
    let dashDuration = 0.14;
    let catFloatSeed = k.rand(0, 1000);

    const toGameCoords = (event: PointerEvent) => {
      const rect = k.canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      return k.vec2((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    };

    const runCatEscape = () => {
      const elapsed = 20 - timeLeft;
      dashDuration = Math.max(0.08, 0.2 - elapsed * 0.005);
      dashFrom = cat.pos.clone();
      dashTo = randomCatPos();
      dashProgress = 0;
      dashActive = true;

      for (let i = 0; i < 5; i += 1) {
        const t = i / 5;
        k.add([
          k.rect(10, 10, { radius: 2 }),
          k.pos(dashFrom.x + (dashTo.x - dashFrom.x) * t, dashFrom.y + (dashTo.y - dashFrom.y) * t),
          k.color(255, 200 - i * 20, 80 + i * 20),
          k.opacity(0.6 - i * 0.1),
          k.lifespan(0.16)
        ]);
      }
    };

    const handleMiss = () => {
      messageText.text = "Mesaj: Iskala! Kedi sadece uzaktan bakti.";
      missMessageUntil = k.time() + 1;
    };

    const handleHit = () => {
      score += 1;
      scoreText.text = `Skor: ${score}`;
      scorePopTime = k.time() + 0.25;
      messageText.text = "Mesaj: +1! Kedi utanc kacisina gecti.";
      runCatEscape();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (ended) return;
      const point = toGameCoords(event);
      const insideCat =
        point.x >= cat.pos.x &&
        point.x <= cat.pos.x + CAT_SIZE &&
        point.y >= cat.pos.y &&
        point.y <= cat.pos.y + CAT_SIZE;
      if (insideCat) {
        handleHit();
      } else {
        handleMiss();
      }
    };

    k.canvas.addEventListener("pointerdown", onPointerDown);

    const removePointer = registerDisposer(() => {
      k.canvas.removeEventListener("pointerdown", onPointerDown);
    });

    const finishPlay = () => {
      if (ended) return;
      ended = true;
      removePointer();
      k.go("gameover", { score } satisfies GameoverPayload);
    };

    k.onUpdate(() => {
      if (ended) return;

      const elapsed = 20 - timeLeft;
      if (dashActive) {
        dashProgress += k.dt() / dashDuration;
        if (dashProgress >= 1) {
          cat.pos = dashTo.clone();
          dashActive = false;
          catFloatSeed = k.rand(0, 1000);
        } else {
          const t = 1 - (1 - dashProgress) * (1 - dashProgress);
          cat.pos.x = dashFrom.x + (dashTo.x - dashFrom.x) * t;
          cat.pos.y = dashFrom.y + (dashTo.y - dashFrom.y) * t;
        }
      } else {
        const wobbleFreq = 1.7 + elapsed * 0.06;
        const wobbleAmp = 12 + elapsed * 0.8;
        cat.pos.x += Math.sin(k.time() * wobbleFreq + catFloatSeed) * wobbleAmp * k.dt();
        cat.pos.y += Math.cos(k.time() * (wobbleFreq + 0.5) + catFloatSeed) * wobbleAmp * k.dt();
      }
      clampToCatZone(cat);

      if (k.time() < scorePopTime) {
        scoreText.scale = k.vec2(1.18);
      } else {
        scoreText.scale = k.vec2(1);
      }

      if (timeLeft <= 5) {
        const pulse = 1 + Math.abs(Math.sin(k.time() * 16)) * 0.22;
        timerText.scale = k.vec2(pulse);
        timerText.pos.x = timerBasePos.x + Math.sin(k.time() * 28) * 2;
        timerText.pos.y = timerBasePos.y + Math.cos(k.time() * 24) * 2;
      } else {
        timerText.scale = k.vec2(1);
        timerText.pos = timerBasePos.clone();
      }

      if (missMessageUntil > 0 && k.time() > missMessageUntil) {
        missMessageUntil = 0;
        if (!dashActive) {
          messageText.text = defaultMessage;
        }
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
      k.text(`Skor Ozeti\nSkor: ${score}`, { size: 24, align: "center", width: 610 }),
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
