"use client";

import { useEffect } from "react";

import { registrarAppDaLixeira } from "../offline";

/** Registra o service worker da lixeira. Não desenha nada. */
export function RegistrarApp() {
  useEffect(registrarAppDaLixeira, []);
  return null;
}
