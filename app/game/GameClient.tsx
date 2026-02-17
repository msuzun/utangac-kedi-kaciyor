"use client";

import { useEffect, useRef } from "react";
import { mountGame } from "./game";

export default function GameClient() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const cleanup = mountGame(hostRef.current);
    return () => cleanup();
  }, []);

  return <div ref={hostRef} className="gameHost" />;
}
