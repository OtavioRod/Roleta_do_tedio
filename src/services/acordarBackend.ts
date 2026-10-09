import { BACKEND_URL } from "./config";

export function acordarBackend() {
  fetch(BACKEND_URL, { method: "GET", mode: "no-cors" }).catch(() => undefined);
}
