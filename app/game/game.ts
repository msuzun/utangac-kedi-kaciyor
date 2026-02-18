import kaboom from "kaboom";

type GameoverPayload = {
  score: number;
};

const messages = [
  "Yakla\u015ft\u0131n ama utand\u0131.",
  "G\u00f6z g\u00f6ze geldiniz. Ka\u00e7t\u0131.",
  "G\u00fcl\u00fcmseyip uzakla\u015ft\u0131.",
  "Yakalad\u0131\u011f\u0131n\u0131 sand\u0131n ama hay\u0131r.",
  "Sessiz ama h\u0131zl\u0131.",
  "Kedi seni izliyor."
];

export function startGame(container: HTMLElement) {
  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const CAT_SIZE = 64;
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
  k.loadSprite("shycat", "/assets/shy-cat.svg");
  // UI için sevimli SVG kedi maskotu
  k.loadSprite("ui-cat", "/assets/cat.svg");
  // Hafif ses efektleri (dosyaları public/assets altına eklemeyi unutma)
  k.loadSound("cat-hit", "/assets/cat-hit.mp3");
  k.loadSound("cat-miss", "/assets/cat-miss.mp3");

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
    // Kedi ekran içindeki görünür alanın dışına hiç taşmasın.
    // Güvenli kutuyu CAT_SIZE'dan belirgin şekilde büyük tutuyoruz.
    const CLAMP_W = CAT_SIZE * 2.4;
    const CLAMP_H = CAT_SIZE * 2.2;
    obj.pos.x = Math.max(CAT_PADDING, Math.min(GAME_WIDTH - CLAMP_W - CAT_PADDING, obj.pos.x));
    obj.pos.y = Math.max(CAT_TOP_PADDING, Math.min(GAME_HEIGHT - CLAMP_H - CAT_PADDING, obj.pos.y));
  };

  const randomCatPos = () =>
    k.vec2(
      k.rand(CAT_PADDING, GAME_WIDTH - CAT_SIZE * 2.4 - CAT_PADDING),
      k.rand(CAT_TOP_PADDING, GAME_HEIGHT - CAT_SIZE * 2.2 - CAT_PADDING)
    );

  const randomFarCatPos = (from: { x: number; y: number }, minDistance: number) => {
    let next = randomCatPos();
    let tries = 0;
    while (tries < 20) {
      const dx = next.x - from.x;
      const dy = next.y - from.y;
      if (Math.hypot(dx, dy) >= minDistance) return next;
      next = randomCatPos();
      tries += 1;
    }
    return next;
  };

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
      k.text("UTANGAC KEDI KACIYOR", { size: 34 }),
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
    let messageUntil = 0;
    const timerBasePos = k.vec2(20, 18);
    const scoreBasePos = k.vec2(20, 48);
    const defaultMessage = "Kediye tikla. Her tikta utangac kacis yapar.";

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
      k.rect(548, 74, { radius: 10 }),
      k.pos(20, 84),
      k.color(77, 255, 240),
      k.opacity(0.35),
      k.fixed()
    ]);
    k.add([
      k.rect(540, 66, { radius: 8 }),
      k.pos(24, 88),
      k.color(9, 13, 26),
      k.opacity(0.9),
      k.fixed()
    ]);
    k.add([
      k.rect(14, 14, { radius: 2 }),
      k.pos(46, 146),
      k.rotate(45),
      k.color(77, 255, 240),
      k.opacity(0.5),
      k.fixed()
    ]);
    const messageText = k.add([
      k.text(defaultMessage, { size: 18, width: 520 }),
      k.pos(34, 106),
      k.color(232, 232, 245),
      k.fixed()
    ]);

    const cat = k.add([
      k.sprite("ui-cat"),
      k.pos(randomCatPos()),
      k.scale(CAT_SIZE / 256),
      k.area(),
      "cat"
    ]);

    // (Önceki primitive "kafa + kulak" çizimi kaldırıldı; doğrudan SVG sprite kullanıyoruz.)

    let dashActive = false;
    let dashFrom = cat.pos.clone();
    let dashTo = cat.pos.clone();
    let dashProgress = 0;
    let dashDuration = 0.14;
    let catFloatSeed = k.rand(0, 1000);
    let nextAutoDashTime = k.time() + 1.6;

    const runCatEscape = () => {
      const elapsed = 20 - timeLeft;
      dashDuration = Math.max(0.06, 0.17 - elapsed * 0.005);
      dashFrom = cat.pos.clone();
      dashTo = randomFarCatPos(cat.pos, 230);
      dashProgress = 0;
      dashActive = true;
      k.shake(1.2);

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

    const randomMessage = () => messages[Math.floor(Math.random() * messages.length)];

    const showMessage = (text: string, seconds = 1) => {
      messageText.text = text;
      messageUntil = k.time() + seconds;
    };

    const missMessages = [
      "Iskala! Kedi kahkaha attı.",
      "Yine mi ıskaladın?",
      "Mouse senden hızlı değil, kedi hızlı.",
      "Kedi: \"Deniyorsun... sayılır.\"",
      "Biraz daha hızlı olman lazım!",
      "Bu sefer de kedi seni izledi sadece."
    ];

    const randomMissMessage = () => missMessages[Math.floor(Math.random() * missMessages.length)];

    const spawnPoof = (center: { x: number; y: number }) => {
      // Küçük "poof" yıldız parçacıkları
      for (let i = 0; i < 10; i += 1) {
        const angle = k.rand(0, 360);
        const speed = k.rand(140, 260);
        const size = k.rand(6, 11);

        const baseColor = k.rand(210, 255);

        // Artı şeklinde basit yıldız efekti: iki ince dikdörtgen
        k.add([
          k.rect(size, size / 3, { radius: size / 3 }),
          k.pos(center.x, center.y),
          k.anchor("center"),
          k.color(255, baseColor, 200),
          k.rotate(k.rand(0, 360)),
          k.move(angle, speed),
          k.lifespan(0.4)
        ]);

        k.add([
          k.rect(size / 3, size, { radius: size / 3 }),
          k.pos(center.x, center.y),
          k.anchor("center"),
          k.color(255, baseColor - 20, 230),
          k.rotate(k.rand(0, 360)),
          k.move(angle, speed),
          k.lifespan(0.4)
        ]);
      }
    };

    const handleMiss = () => {
      showMessage("Iskala. Kedi ciddiye bile almadi.", 1);
      k.play("cat-miss", { volume: 0.04 });

      const text = randomMissMessage();
      const baseScale = 1 + k.rand(0, 0.3);
      const miss = k.add([
        k.text(text, { size: 30, align: "center", width: 520 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + k.rand(-40, 40)),
        k.anchor("center"),
        k.color(255, 223, 186),
        k.scale(baseScale),
        k.opacity(0.98),
        k.lifespan(0.9)
      ]);

      miss.onUpdate(() => {
        // Yukarı doğru yavaşça süzülsün ve hafif şişip küçülsün
        miss.pos.y -= 22 * k.dt();
        const wobble = Math.sin(k.time() * 14) * 0.08;
        const s = baseScale + wobble;
        miss.scale = k.vec2(s, s);
      });
    };

    const handleHit = () => {
      score += 1;
      scoreText.text = `Skor: ${score}`;
      scorePopTime = k.time() + 0.25;
      showMessage(randomMessage(), 1);
      k.play("cat-hit", { volume: 0.06 });
      // Kedi şu anki konumunda poof parçacıkları (sprite ~CAT_SIZE x CAT_SIZE)
      const center = { x: cat.pos.x + CAT_SIZE / 2, y: cat.pos.y + CAT_SIZE / 2 };
      spawnPoof(center);
      runCatEscape();
    };

    // Kediyi doğrudan Kaboom'un area()/onClick sistemiyle tıklanabilir yap.
    k.onClick("cat", () => {
      if (ended) return;
      handleHit();
    });

    // Kedi dışına tıklamayı da yakalayıp ıskalama efekti göstermek için
    const getCatBounds = () => {
      const sx = typeof cat.scale === "number" ? (cat.scale as number) : (cat.scale as { x: number; y: number }).x;
      const sy = typeof cat.scale === "number" ? (cat.scale as number) : (cat.scale as { x: number; y: number }).y;
      const w = CAT_SIZE * sx;
      const h = CAT_SIZE * sy;
      const hitShrink = 0.55; // gerçek "yakalama" alanını küçült, vurmak daha zor olsun
      const padX = (1 - hitShrink) * w * 0.5;
      const padY = (1 - hitShrink) * h * 0.5;
      return {
        left: cat.pos.x + padX,
        right: cat.pos.x + w - padX,
        top: cat.pos.y + padY,
        bottom: cat.pos.y + h - padY
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (ended) return;
      const rawX =
        typeof event.offsetX === "number"
          ? event.offsetX
          : event.clientX - k.canvas.getBoundingClientRect().left;
      const rawY =
        typeof event.offsetY === "number"
          ? event.offsetY
          : event.clientY - k.canvas.getBoundingClientRect().top;
      const point = k.toWorld(k.vec2(rawX, rawY));
      const bounds = getCatBounds();
      const insideCat =
        point.x >= bounds.left &&
        point.x <= bounds.right &&
        point.y >= bounds.top &&
        point.y <= bounds.bottom;

      // Eğer kedinin dışına tıklandıysa bunu "ıskalama" say
      if (!insideCat) {
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
          cat.scale = k.vec2(1);
        } else {
          const t = 1 - (1 - dashProgress) * (1 - dashProgress);
          cat.pos.x = dashFrom.x + (dashTo.x - dashFrom.x) * t;
          cat.pos.y = dashFrom.y + (dashTo.y - dashFrom.y) * t;
          cat.scale = k.vec2(1 + (1 - t) * 0.16);
        }
      } else {
        // Kedi sürekli ve ÇOK daha zor yakalanacak şekilde hareket etsin
        const wobbleFreq = 4.2 + elapsed * 0.18;
        const wobbleAmp = 46 + elapsed * 2.8;
        cat.pos.x += Math.sin(k.time() * wobbleFreq + catFloatSeed) * wobbleAmp * k.dt();
        cat.pos.y += Math.cos(k.time() * (wobbleFreq + 0.7) + catFloatSeed) * wobbleAmp * k.dt();

        // Ara ara kendiliğinden ani kaçışlar yapsın (daha sık)
        if (k.time() >= nextAutoDashTime) {
          runCatEscape();
          nextAutoDashTime = k.time() + k.rand(0.4, 1.1);
        }
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

      if (messageUntil > 0 && k.time() > messageUntil) {
        messageUntil = 0;
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
      k.text("Bu oyun D\u00fcnya Kedi G\u00fcn\u00fc i\u00e7in yap\u0131ld\u0131.", { size: 20, align: "center", width: 760 }),
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
