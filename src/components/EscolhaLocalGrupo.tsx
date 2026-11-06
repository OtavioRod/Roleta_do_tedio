import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import {
  escolherLocal,
  MembroSala,
  publicarLocais,
  Sala,
  votarNoLocal,
} from "../services/salas";
import { buscarLocais, Local, TipoLocal } from "../services/overpass";
import Botao from "./Botao";
import MapaLeaflet from "./MapaLeaflet";
import Texto from "./Texto";

type Props = {
  sala: Sala;
  membros: MembroSala[];
  uid: string;
  souDono: boolean;
  tipoLocal: TipoLocal;
};

export default function EscolhaLocalGrupo({
  sala,
  membros,
  uid,
  souDono,
  tipoLocal,
}: Props) {
  const { cores } = usePreferencias();

  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const locais = sala.locais;

  const votos = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const membro of membros) {
      if (membro.votoLocal && locais.some((l) => l.id === membro.votoLocal)) {
        contagem.set(
          membro.votoLocal,
          (contagem.get(membro.votoLocal) ?? 0) + 1,
        );
      }
    }

    return contagem;
  }, [membros, locais]);

  const meuVoto = membros.find((membro) => membro.uid === uid)?.votoLocal ?? "";

  const totalDeVotos = Array.from(votos.values()).reduce((a, b) => a + b, 0);

  const vencedorId = useMemo(() => {
    let melhor = "";
    let maior = 0;

    for (const local of locais) {
      const quantidade = votos.get(local.id) ?? 0;

      if (quantidade > maior) {
        maior = quantidade;
        melhor = local.id;
      }
    }

    return melhor;
  }, [locais, votos]);

  useEffect(() => {
    if (
      souDono &&
      locais.length > 0 &&
      sala.localEscolhidoId === "" &&
      totalDeVotos >= membros.length &&
      vencedorId !== ""
    ) {
      escolherLocal(sala.codigo, vencedorId).catch(() => undefined);
    }
  }, [
    souDono,
    locais.length,
    sala.localEscolhidoId,
    sala.codigo,
    totalDeVotos,
    membros.length,
    vencedorId,
  ]);

  async function buscar() {
    setErro("");
    setBuscando(true);

    try {
      const permissao = await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        setErro("Permita a localização para buscar lugares perto de você.");

        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const encontrados = await buscarLocais(
        posicao.coords.latitude,
        posicao.coords.longitude,
        tipoLocal,
      );

      if (encontrados.length === 0) {
        setErro("Nenhum lugar foi encontrado por aqui. Tente de novo em instantes.");

        return;
      }

      await publicarLocais(
        sala.codigo,
        encontrados.slice(0, 5).map((local) => ({
          id: local.id,
          nome: local.nome,
          latitude: local.latitude,
          longitude: local.longitude,
          endereco: local.endereco,
        })),
      );
    } catch {
      setErro("Não foi possível buscar os lugares agora. Tente novamente.");
    } finally {
      setBuscando(false);
    }
  }

  async function votar(localId: string) {
    try {
      await votarNoLocal(sala.codigo, uid, localId);
    } catch {
      setErro("Não foi possível registrar seu voto.");
    }
  }

  function abrirNoMapa(local: { latitude: number; longitude: number }) {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${local.latitude},${local.longitude}`,
    ).catch(() => undefined);
  }

  const mapaLocais: Local[] = locais.map((local) => ({
    id: local.id,
    nome: local.nome,
    latitude: local.latitude,
    longitude: local.longitude,
    endereco: local.endereco,
  }));

  const centroLat =
    locais.reduce((soma, local) => soma + local.latitude, 0) /
    Math.max(locais.length, 1);

  const centroLon =
    locais.reduce((soma, local) => soma + local.longitude, 0) /
    Math.max(locais.length, 1);

  const escolhido = locais.find((local) => local.id === sala.localEscolhidoId);

  if (locais.length === 0) {
    return (
      <View style={[styles.caixa, { borderColor: cores.borda }]}>
        <Texto cabecalho style={styles.titulo}>
          Escolham o lugar juntos
        </Texto>

        {souDono ? (
          <>
            <Texto style={styles.texto}>
              Busque lugares perto de você. Todos do grupo vão ver a mesma lista
              e votar.
            </Texto>

            <Botao
              titulo={buscando ? "Buscando..." : "Buscar lugares perto de mim"}
              onPress={buscar}
              desabilitado={buscando}
            />
          </>
        ) : (
          <Texto style={styles.texto}>
            Aguardando {sala.donoNome} buscar os lugares para votarmos.
          </Texto>
        )}

        {erro !== "" && (
          <Texto accessibilityRole="alert" style={[styles.texto, { color: cores.erro }]}>
            {erro}
          </Texto>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.caixa, { borderColor: cores.borda }]}>
      <Texto cabecalho style={styles.titulo}>
        {escolhido ? "Lugar escolhido" : "Votem no lugar"}
      </Texto>

      {escolhido ? (
        <>
          <Texto cabecalho style={styles.nomeEscolhido}>
            {escolhido.nome}
          </Texto>

          <Texto style={styles.texto}>{escolhido.endereco}</Texto>

          <Botao titulo="Abrir no mapa" onPress={() => abrirNoMapa(escolhido)} />
        </>
      ) : null}

      <View style={styles.mapa}>
        <MapaLeaflet
          latitude={centroLat}
          longitude={centroLon}
          locais={mapaLocais}
        />
      </View>

      {locais.map((local, indice) => {
        const quantidade = votos.get(local.id) ?? 0;

        const meu = meuVoto === local.id;

        return (
          <View
            key={local.id}
            style={[
              styles.item,
              {
                borderColor: local.id === sala.localEscolhidoId ? cores.texto : cores.borda,
              },
            ]}
          >
            <Texto style={styles.itemNome}>
              {indice + 1}. {local.nome}
            </Texto>

            <Texto style={styles.itemEndereco}>{local.endereco}</Texto>

            <Texto style={styles.itemVotos}>
              {quantidade} {quantidade === 1 ? "voto" : "votos"}
              {meu ? " · seu voto" : ""}
            </Texto>

            {!escolhido && (
              <Botao
                titulo={meu ? "Voto registrado" : "Votar neste"}
                secundario={!meu}
                onPress={() => votar(local.id)}
                desabilitado={meu}
              />
            )}
          </View>
        );
      })}

      {!escolhido && souDono && vencedorId !== "" && (
        <Botao
          titulo="Fechar votação agora"
          secundario
          onPress={() => escolherLocal(sala.codigo, vencedorId).catch(() => undefined)}
        />
      )}

      {!escolhido && (
        <Texto style={styles.itemEndereco}>
          {totalDeVotos} de {membros.length} já votaram
        </Texto>
      )}

      {erro !== "" && (
        <Texto accessibilityRole="alert" style={[styles.texto, { color: cores.erro }]}>
          {erro}
        </Texto>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  nomeEscolhido: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },

  texto: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },

  mapa: {
    height: 260,
    marginBottom: 14,
    borderRadius: 10,
    overflow: "hidden",
  },

  item: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  itemNome: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },

  itemEndereco: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },

  itemVotos: {
    fontSize: 14,
    marginBottom: 8,
  },
});
