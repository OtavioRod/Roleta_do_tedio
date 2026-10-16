import { Local } from "../services/overpass";
import { avaliarHorario, EstadoHorario } from "./horarioFuncionamento";
import { urlBuscaNoMapa, urlRotaGoogle } from "./mapas";

export type EstadoMarcador = EstadoHorario | "usuario";

export type MarcadorMapa = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
  estado: EstadoMarcador;
  status: string;
  distancia: string;
  rota: string;
  conferir: string;
  dados: string;
};

function formatarDistancia(metros?: number) {
  if (metros === undefined) {
    return "";
  }

  if (metros < 1000) {
    return `${metros} m de você`;
  }

  return `${(metros / 1000).toFixed(1).replace(".", ",")} km de você`;
}

export function montarMarcadores(
  latitude: number,
  longitude: number,
  locais: Local[],
  agora: Date = new Date(),
): MarcadorMapa[] {
  const usuario: MarcadorMapa = {
    id: "usuario",
    nome: "Sua localização",
    latitude,
    longitude,
    endereco: "Localização atual",
    estado: "usuario",
    status: "",
    distancia: "",
    rota: "",
    conferir: "",
    dados: "",
  };

  const itens = locais.map<MarcadorMapa>((local) => {
    const status = avaliarHorario(local.horario, agora);

    return {
      id: local.id,
      nome: local.nome,
      latitude: local.latitude,
      longitude: local.longitude,
      endereco: local.endereco,
      estado: status.estado,
      status: status.texto,
      distancia: formatarDistancia(local.distanciaMetros),
      rota: urlRotaGoogle(local.latitude, local.longitude),
      conferir: urlBuscaNoMapa(local.latitude, local.longitude, local.nome),
      dados: local.osmUrl ?? "",
    };
  });

  return [usuario, ...itens];
}
