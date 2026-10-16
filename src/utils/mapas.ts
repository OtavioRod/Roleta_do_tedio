import { Platform } from "react-native";

export function urlRota(lat: number, lon: number, nome: string) {
  const rotulo = encodeURIComponent(nome);

  if (Platform.OS === "ios") {
    return `http://maps.apple.com/?daddr=${lat},${lon}&q=${rotulo}`;
  }

  if (Platform.OS === "android") {
    return `geo:${lat},${lon}?q=${lat},${lon}(${rotulo})`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function urlRotaGoogle(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function urlBuscaNoMapa(lat: number, lon: number, nome: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(nome)}/@${lat},${lon},17z`;
}
