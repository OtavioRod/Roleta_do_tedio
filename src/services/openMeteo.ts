export type Clima = {
  temperatura: number;
  chuva: number;
  codigo: number;
};

type RespostaOpenMeteo = {
  current?: {
    temperature_2m?: number;
    precipitation?: number;
    weather_code?: number;
  };
};

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

export async function buscarClima(
  latitude: number,
  longitude: number,
): Promise<Clima> {
  const parametros = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,precipitation,weather_code",
    timezone: "auto",
  });

  const resposta = await fetch(`${OPEN_METEO_URL}?${parametros.toString()}`);

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar Open-Meteo: ${resposta.status}`);
  }

  const dados: RespostaOpenMeteo = await resposta.json();

  const temperatura = dados.current?.temperature_2m;

  const chuva = dados.current?.precipitation;

  const codigo = dados.current?.weather_code;

  if (
    temperatura === undefined ||
    chuva === undefined ||
    codigo === undefined
  ) {
    throw new Error("A resposta da Open-Meteo não possui os dados esperados.");
  }

  return {
    temperatura,
    chuva,
    codigo,
  };
}
