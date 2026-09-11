import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ParticipanteItem from "../components/ParticipanteItem";
import { Atividade, atividades, Gasto } from "../data/atividades";

type Participante = {
  nome: string;
  humor: string;
  gasto: string;
  disposicao: string;
  tempo: string;
};

type Local = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
};

type Clima = {
  temperatura: number;
  chuva: number;
  codigo: number;
};

export default function Index() {
  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState("");
  const [salaCriada, setSalaCriada] = useState(false);
  const [codigoSala, setCodigoSala] = useState("");

  const [etapa, setEtapa] = useState("tipo");

  const [modoEscuro, setModoEscuro] = useState(false);

  const [nomeParticipante, setNomeParticipante] = useState("");

  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [participanteAtual, setParticipanteAtual] = useState(0);

  const [atividadeEscolhida, setAtividadeEscolhida] =
    useState<Atividade | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);

  const [longitude, setLongitude] = useState<number | null>(null);

  const [precisao, setPrecisao] = useState<number | null>(null);

  const [locais, setLocais] = useState<Local[]>([]);

  const [clima, setClima] = useState<Clima | null>(null);

  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);

  const [carregandoLocais, setCarregandoLocais] = useState(false);

  const [carregandoRoleta, setCarregandoRoleta] = useState(false);

  const [erroApi, setErroApi] = useState("");

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  function criarSala() {
    if (nomeParticipante.trim() === "") {
      alert("A roleta ainda não sabe quem é você. Digite seu nome primeiro!");
      return;
    }

    if (tipo === "") {
      alert("Calma aí. Primeiro precisamos saber quem está participando.");
      return;
    }

    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    const participante: Participante = {
      nome: nomeParticipante.trim(),
      humor: "",
      gasto: "",
      disposicao: "",
      tempo: "",
    };

    setCodigoSala(codigo);
    setParticipantes([participante]);
    setNomeParticipante("");
    setSalaCriada(true);
  }

  function podeContinuar() {
    if (tipo === "sozinho") {
      return participantes.length === 1;
    }

    if (tipo === "casal") {
      return participantes.length === 2;
    }

    if (tipo === "amigos") {
      return participantes.length >= 2 && participantes.length <= 10;
    }

    return false;
  }

  function continuar() {
    if (!podeContinuar()) {
      if (tipo === "casal") {
        alert(
          "Para o modo casal, precisamos de duas pessoas. Nem a roleta consegue namorar sozinha.",
        );
        return;
      }

      if (tipo === "amigos") {
        alert(
          "Adicione pelo menos mais uma pessoa. Tédio em grupo é mais divertido.",
        );
        return;
      }

      return;
    }

    setParticipanteAtual(0);
    setEtapa("humor");
  }

  function escolherHumor(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              humor: valor,
            }
          : participante,
      ),
    );

    setEtapa("humorEscolhido");
  }

  function escolherGasto(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              gasto: valor,
            }
          : participante,
      ),
    );

    setEtapa("gastoEscolhido");
  }

  function escolherDisposicao(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              disposicao: valor,
            }
          : participante,
      ),
    );

    setEtapa("disposicaoEscolhida");
  }

  function escolherTempo(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              tempo: valor,
            }
          : participante,
      ),
    );

    setEtapa("tempoEscolhido");
  }

  function proximoParticipante() {
    if (participanteAtual < participantes.length - 1) {
      setParticipanteAtual(participanteAtual + 1);

      setEtapa("humor");
      return;
    }

    setEtapa("resumo");
  }

  function adicionarParticipante() {
    const nome = nomeParticipante.trim();

    if (nome === "") {
      alert("Digite o nome de quem vai entrar na brincadeira.");
      return;
    }

    if (
      participantes.some(
        (participante) =>
          participante.nome.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      alert("Esse participante já está na sala. A roleta percebeu.");
      return;
    }

    if (tipo === "sozinho") {
      alert("No modo sozinho, a companhia oficial é você mesmo.");
      return;
    }

    if (tipo === "casal" && participantes.length >= 2) {
      alert(
        "O modo casal já está completo. Não cabe mais um no relacionamento.",
      );
      return;
    }

    if (tipo === "amigos" && participantes.length >= 10) {
      alert(
        "A sala chegou ao limite de 10 pessoas. Já está parecendo reunião.",
      );
      return;
    }

    const participante: Participante = {
      nome,
      humor: "",
      gasto: "",
      disposicao: "",
      tempo: "",
    };

    setParticipantes([...participantes, participante]);

    setNomeParticipante("");
  }

  function removerParticipante(nome: string) {
    if (tipo === "sozinho") {
      alert("Você não pode remover o único participante. Aí vira nada.");
      return;
    }

    setParticipantes(
      participantes.filter((participante) => participante.nome !== nome),
    );
  }

  function alternarTema() {
    setModoEscuro(!modoEscuro);
  }

  function converterGasto(gasto: string): Gasto | "" {
    if (gasto === "R$ 0") {
      return "nada";
    }

    if (gasto === "até 30") {
      return "pouco";
    }

    if (gasto === "até 60") {
      return "medio";
    }

    if (gasto === "até 100") {
      return "livre";
    }

    if (gasto === "sem limite") {
      return "livre";
    }

    return "";
  }

  function converterTempo(tempo: string) {
    if (tempo === "30 minutos") {
      return 30;
    }

    if (tempo === "40 minutos") {
      return 40;
    }

    if (tempo === "1 hora") {
      return 60;
    }

    if (tempo === "2 horas") {
      return 120;
    }

    if (tempo === "3 horas ou mais") {
      return 180;
    }

    return 0;
  }

  function menorTempoDisponivel() {
    let menor = 999;

    participantes.forEach((participante) => {
      const tempo = converterTempo(participante.tempo);

      if (tempo < menor) {
        menor = tempo;
      }
    });

    return menor;
  }

  function atividadePodeSerEscolhida(atividade: Atividade) {
    const tempo = menorTempoDisponivel();

    for (const participante of participantes) {
      const gastoConvertido = converterGasto(participante.gasto);

      if (
        gastoConvertido === "" ||
        !atividade.gasto.includes(gastoConvertido)
      ) {
        return false;
      }

      if (
        !atividade.disposicao.includes(
          participante.disposicao as Atividade["disposicao"][number],
        )
      ) {
        return false;
      }
    }

    if (tempo < atividade.tempoMinimo) {
      return false;
    }

    return true;
  }

  function calcularPontuacao(atividade: Atividade) {
    let pontos = 0;

    const tempo = menorTempoDisponivel();

    if (tempo >= atividade.tempoMinimo && tempo <= atividade.tempoMaximo) {
      pontos += 4;
    } else if (tempo >= atividade.tempoMinimo) {
      pontos += 2;
    }

    participantes.forEach((participante) => {
      const gastoConvertido = converterGasto(participante.gasto);

      if (gastoConvertido !== "" && atividade.gasto.includes(gastoConvertido)) {
        pontos += 2;
      }

      if (
        atividade.disposicao.includes(
          participante.disposicao as Atividade["disposicao"][number],
        )
      ) {
        pontos += 2;
      }

      if (
        participante.humor === "preguiça" &&
        atividade.disposicao.includes("baixa")
      ) {
        pontos += 2;
      }

      if (
        participante.humor === "animado" &&
        atividade.disposicao.includes("alta")
      ) {
        pontos += 2;
      }

      if (participante.humor === "fome" && atividade.id === "restaurante") {
        pontos += 4;
      }

      if (participante.humor === "fome" && atividade.id === "cafe") {
        pontos += 2;
      }

      if (
        participante.humor === "tranquilo" &&
        atividade.disposicao.includes("baixa")
      ) {
        pontos += 2;
      }

      if (participante.humor === "tanto faz") {
        pontos += 1;
      }
    });

    return pontos;
  }

  function escolherAtividade() {
    if (carregandoRoleta) {
      return;
    }

    setCarregandoRoleta(true);
    setErroApi("");

    const atividadesValidas = atividades.filter((atividade) =>
      atividadePodeSerEscolhida(atividade),
    );

    if (atividadesValidas.length === 0) {
      const atividadeAlternativa =
        atividades[Math.floor(Math.random() * atividades.length)];

      setAtividadeEscolhida(atividadeAlternativa);

      setCarregandoRoleta(false);
      setEtapa("resultado");
      return;
    }

    let maiorPontuacao = -1;

    let melhores: Atividade[] = [];

    atividadesValidas.forEach((atividade) => {
      const pontuacao = calcularPontuacao(atividade);

      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;

        melhores = [atividade];
      } else if (pontuacao === maiorPontuacao) {
        melhores.push(atividade);
      }
    });

    const escolhida = melhores[Math.floor(Math.random() * melhores.length)];

    setAtividadeEscolhida(escolhida);

    setCarregandoRoleta(false);
    setEtapa("resultado");
  }

  async function buscarLocalizacao() {
    try {
      setCarregandoLocalizacao(true);

      setErroApi("");

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        setErroApi("Permissão de localização não concedida.");
        return;
      }

      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = localizacao.coords.latitude;

      const lon = localizacao.coords.longitude;

      const precisaoObtida = localizacao.coords.accuracy;

      setLatitude(lat);
      setLongitude(lon);
      setPrecisao(precisaoObtida ?? null);

      await buscarClima(lat, lon);

      await buscarLocais(lat, lon);
    } catch (erro) {
      setErroApi("Não foi possível obter sua localização.");
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  async function buscarClima(lat: number, lon: number) {
    try {
      const resposta = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&timezone=auto`,
      );

      if (!resposta.ok) {
        throw new Error("Erro ao buscar clima");
      }

      const dados = await resposta.json();

      setClima({
        temperatura: dados.current.temperature_2m,
        chuva: dados.current.precipitation,
        codigo: dados.current.weather_code,
      });
    } catch (erro) {
      setErroApi("Não foi possível consultar o clima.");
    }
  }

  async function buscarLocais(lat: number, lon: number) {
    try {
      setCarregandoLocais(true);

      setErroApi("");

      if (!atividadeEscolhida) {
        return;
      }

      if (atividadeEscolhida.id !== "restaurante") {
        setLocais([]);
        return;
      }

      const consulta = `
        [out:json];
        (
          nwr["amenity"="restaurant"](around:5000,${lat},${lon});
          nwr["amenity"="fast_food"](around:5000,${lat},${lon});
        );
        out center;
      `;

      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        consulta,
      )}`;

      const resposta = await fetch(url);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar restaurantes");
      }

      const dados = await resposta.json();

      const resultados: Local[] = dados.elements
        .map((item: any, index: number) => {
          const itemLatitude = item.lat ?? item.center?.lat;

          const itemLongitude = item.lon ?? item.center?.lon;

          const nome = item.tags?.name;

          if (
            itemLatitude === undefined ||
            itemLongitude === undefined ||
            !nome
          ) {
            return null;
          }

          const endereco = [
            item.tags?.["addr:street"],
            item.tags?.["addr:housenumber"],
            item.tags?.["addr:city"],
          ]
            .filter(Boolean)
            .join(", ");

          return {
            id: String(item.id) || `${index}`,
            nome,
            latitude: itemLatitude,
            longitude: itemLongitude,
            endereco: endereco || "Endereço não informado",
          };
        })
        .filter((item: Local | null): item is Local => item !== null)
        .slice(0, 20);

      setLocais(resultados);

      if (resultados.length === 0) {
        setErroApi(
          "Nenhum restaurante foi encontrado próximo da localização informada.",
        );
      }
    } catch (erro) {
      setErroApi("Não foi possível buscar restaurantes próximos.");
    } finally {
      setCarregandoLocais(false);
    }
  }

  function continuarParaLocalizacao() {
    setLocais([]);
    setClima(null);
    setErroApi("");
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);

    setEtapa("localizacao");

    buscarLocalizacao();
  }

  function climaPermiteAtividade() {
    if (!atividadeEscolhida || !clima) {
      return true;
    }

    if (atividadeEscolhida.chuvaPermitida) {
      return true;
    }

    return clima.chuva === 0;
  }

  function reiniciar() {
    setIniciou(false);
    setTipo("");
    setSalaCriada(false);
    setCodigoSala("");
    setEtapa("tipo");
    setNomeParticipante("");
    setParticipantes([]);
    setParticipanteAtual(0);
    setAtividadeEscolhida(null);
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);
    setLocais([]);
    setClima(null);
    setErroApi("");
    setCarregandoRoleta(false);
    setCarregandoLocalizacao(false);
    setCarregandoLocais(false);
  }

  function Mapa({
    latitude,
    longitude,
    locais,
  }: {
    latitude: number;
    longitude: number;
    locais: Local[];
  }) {
    const MapLeaflet = require("../components/MapaLeaflet").default;

    return (
      <MapLeaflet latitude={latitude} longitude={longitude} locais={locais} />
    );
  }

  const participante = participantes[participanteAtual];

  return (
    <View
      style={[
        styles.container,
        modoEscuro ? styles.containerEscuro : styles.containerClaro,
      ]}
    >
      <TouchableOpacity style={styles.botaoTema} onPress={alternarTema}>
        <Text style={styles.iconeTema}>{modoEscuro ? "☀" : "☾"}</Text>
      </TouchableOpacity>

      {!iniciou ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Roleta do Tédio
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Vocês se juntaram e mesmo assim não sabem o que fazer?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Perfeito. Aparentemente pensar virou trabalho demais.
          </Text>

          <Button title="Começar" onPress={comecar} />
        </View>
      ) : !salaCriada ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Primeiro, vamos entender a situação
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Quem está prestes a reclamar que "não tem nada para fazer"?
          </Text>

          <Button title="Casal" onPress={() => escolherTipo("casal")} />

          <View style={styles.espaco} />

          <Button title="Amigos" onPress={() => escolherTipo("amigos")} />

          <View style={styles.espaco} />

          <Button title="Sozinho" onPress={() => escolherTipo("sozinho")} />

          {tipo !== "" && (
            <View style={styles.blocoDepois}>
              <Text
                style={[styles.resultado, modoEscuro && styles.textoEscuro]}
              >
                Então é um{" "}
                {tipo === "casal"
                  ? "casal"
                  : tipo === "amigos"
                    ? "grupo de amigos"
                    : "momento solo"}
                .
              </Text>

              <Text
                style={[styles.descricao, modoEscuro && styles.textoEscuro]}
              >
                Agora diga quem é você. A roleta precisa saber quem está por
                trás dessas decisões.
              </Text>

              <TextInput
                style={[styles.input, modoEscuro && styles.inputEscuro]}
                placeholder="Digite seu nome"
                placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                value={nomeParticipante}
                onChangeText={setNomeParticipante}
              />

              <Button title="Criar sala" onPress={criarSala} />
            </View>
          )}
        </View>
      ) : etapa === "tipo" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Sala criada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Compartilhe esse código com quem vai participar.
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {codigoSala}
          </Text>

          <Text style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}>
            Participantes
          </Text>

          <Text style={[styles.contador, modoEscuro && styles.textoEscuro]}>
            {participantes.length}
            {tipo === "sozinho" && " / 1"}
            {tipo === "casal" && " / 2"}
            {tipo === "amigos" && " / 10"}
          </Text>

          {tipo !== "sozinho" && (
            <>
              <TextInput
                style={[styles.input, modoEscuro && styles.inputEscuro]}
                placeholder="Nome de quem vai entrar"
                placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                value={nomeParticipante}
                onChangeText={setNomeParticipante}
              />

              <Button
                title="Adicionar participante"
                onPress={adicionarParticipante}
              />
            </>
          )}

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
            renderItem={({ item }) => (
              <ParticipanteItem
                nome={item.nome}
                onRemover={() => removerParticipante(item.nome)}
              />
            )}
            style={styles.lista}
          />

          {!podeContinuar() && (
            <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
              {tipo === "casal" &&
                "Falta uma pessoa. Afinal, casal exige duas pessoas."}

              {tipo === "amigos" &&
                participantes.length < 2 &&
                "Adicione pelo menos mais uma pessoa para começar a confusão."}
            </Text>
          )}

          <Button
            title="Continuar"
            onPress={continuar}
            disabled={!podeContinuar()}
          />
        </View>
      ) : etapa === "humor" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Agora é pessoal, {participante?.nome}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Como você está agora?
          </Text>

          <Text
            style={[styles.descricaoMenor, modoEscuro && styles.textoEscuro]}
          >
            Seja sincero. A roleta precisa saber com quem está lidando.
          </Text>

          <Button
            title="Com preguiça"
            onPress={() => escolherHumor("preguiça")}
          />

          <View style={styles.espaco} />

          <Button title="Com fome" onPress={() => escolherHumor("fome")} />

          <View style={styles.espaco} />

          <Button title="Animado" onPress={() => escolherHumor("animado")} />

          <View style={styles.espaco} />

          <Button
            title="Tranquilo"
            onPress={() => escolherHumor("tranquilo")}
          />

          <View style={styles.espaco} />

          <Button
            title="Tanto faz"
            onPress={() => escolherHumor("tanto faz")}
          />
        </View>
      ) : etapa === "humorEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Entendido...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, você está:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.humor}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Interessante. Agora precisamos descobrir uma coisa importante:
            quanto dói no bolso?
          </Text>

          <Button title="Descobrir" onPress={() => setEtapa("gasto")} />
        </View>
      ) : etapa === "gasto" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quanto você pretende gastar?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Pode ser sincero. A roleta não julga. Só usa essa informação contra
            o tédio.
          </Text>

          <Button
            title="R$ 0 — Hoje não sai dinheiro"
            onPress={() => escolherGasto("R$ 0")}
          />

          <View style={styles.espaco} />

          <Button title="Até R$ 30" onPress={() => escolherGasto("até 30")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 60" onPress={() => escolherGasto("até 60")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 100" onPress={() => escolherGasto("até 100")} />

          <View style={styles.espaco} />

          <Button
            title="Hoje eu posso gastar"
            onPress={() => escolherGasto("sem limite")}
          />
        </View>
      ) : etapa === "gastoEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Anotado...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, seu orçamento é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.gasto}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Estamos chegando perto. Agora queremos saber se você realmente quer
            fazer alguma coisa.
          </Text>

          <Button title="Continuar" onPress={() => setEtapa("disposicao")} />
        </View>
      ) : etapa === "disposicao" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Qual é a sua disposição?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            O quanto você está disposto a sair da posição atual do sofá?
          </Text>

          <Button
            title="Pouca disposição"
            onPress={() => escolherDisposicao("baixa")}
          />

          <View style={styles.espaco} />

          <Button
            title="Disposto"
            onPress={() => escolherDisposicao("media")}
          />

          <View style={styles.espaco} />

          <Button
            title="Muito disposto"
            onPress={() => escolherDisposicao("alta")}
          />
        </View>
      ) : etapa === "disposicaoEscolhida" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Última pergunta...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, sua disposição é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.disposicao}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Só falta descobrir quanto tempo vocês realmente têm.
          </Text>

          <Button
            title="Descobrir meu tempo"
            onPress={() => setEtapa("tempo")}
          />
        </View>
      ) : etapa === "tempo" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quanto tempo você tem?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Escolha o tempo que você realmente tem disponível. Não vale colocar
            3 horas se você precisa sair em 20 minutos.
          </Text>

          <Button
            title="30 minutos"
            onPress={() => escolherTempo("30 minutos")}
          />

          <View style={styles.espaco} />

          <Button
            title="40 minutos"
            onPress={() => escolherTempo("40 minutos")}
          />

          <View style={styles.espaco} />

          <Button title="1 hora" onPress={() => escolherTempo("1 hora")} />

          <View style={styles.espaco} />

          <Button title="2 horas" onPress={() => escolherTempo("2 horas")} />

          <View style={styles.espaco} />

          <Button
            title="3 horas ou mais"
            onPress={() => escolherTempo("3 horas ou mais")}
          />
        </View>
      ) : etapa === "tempoEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Perfeito...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome} tem {participante?.tempo} disponíveis.
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participanteAtual < participantes.length - 1
              ? "Agora é a vez da próxima vítima."
              : "Todos responderam. A roleta já tem informações suficientes para tomar uma decisão questionável."}
          </Text>

          <Button
            title={
              participanteAtual < participantes.length - 1
                ? "Próximo participante"
                : "Ver respostas"
            }
            onPress={proximoParticipante}
          />
        </View>
      ) : etapa === "resumo" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Então é isso...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            A roleta já sabe demais sobre vocês.
          </Text>

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
            renderItem={({ item }) => (
              <View
                style={[styles.resposta, modoEscuro && styles.respostaEscuro]}
              >
                <Text
                  style={[
                    styles.nomeResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  {item.nome}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Humor: {item.humor}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Gasto: {item.gasto}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Disposição: {item.disposicao}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Tempo: {item.tempo}
                </Text>
              </View>
            )}
            style={styles.lista}
          />

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Tudo registrado. Agora vocês não podem mais dizer que a roleta não
            conhece vocês.
          </Text>

          <Button title="Girar a roleta" onPress={escolherAtividade} />
        </View>
      ) : etapa === "resultado" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            A Roleta decidiu.
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Depois de analisar todas as informações, ela chegou a uma conclusão.
          </Text>

          {carregandoRoleta ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              <View
                style={[
                  styles.resultadoCard,
                  modoEscuro && styles.resultadoCardEscuro,
                ]}
              >
                <Text
                  style={[
                    styles.resultadoTitulo,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  {atividadeEscolhida?.nome}
                </Text>

                <Text
                  style={[
                    styles.resultadoDescricao,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  {atividadeEscolhida?.descricao}
                </Text>
              </View>

              <Text style={[styles.pergunta, modoEscuro && styles.textoEscuro]}>
                Tempo disponível:
              </Text>

              <Text
                style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}
              >
                {menorTempoDisponivel()} minutos
              </Text>

              <Button
                title="Visualizar no mapa"
                onPress={continuarParaLocalizacao}
              />

              <View style={styles.espacoGrande} />

              <Button title="Girar novamente" onPress={escolherAtividade} />
            </>
          )}
        </View>
      ) : (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Encontrando opções...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora a roleta vai tentar descobrir se existe alguma coisa
            interessante perto de vocês.
          </Text>

          {atividadeEscolhida && (
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Atividade escolhida
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                {atividadeEscolhida.nome}
              </Text>
            </View>
          )}

          {carregandoLocalizacao && (
            <View style={styles.carregando}>
              <ActivityIndicator size="large" />

              <Text style={modoEscuro && styles.textoEscuro}>
                Descobrindo onde vocês estão...
              </Text>
            </View>
          )}

          {latitude !== null && longitude !== null && (
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Localização encontrada
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Latitude: {latitude.toFixed(6)}
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Longitude: {longitude.toFixed(6)}
              </Text>

              {precisao !== null && (
                <Text
                  style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
                >
                  Precisão aproximada: {Math.round(precisao)} metros
                </Text>
              )}
            </View>
          )}

          {clima && (
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Clima atual
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Temperatura: {clima.temperatura}
                °C
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Precipitação: {clima.chuva} mm
              </Text>

              {!climaPermiteAtividade() && (
                <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
                  O clima não parece muito interessado nessa atividade.
                </Text>
              )}
            </View>
          )}

          {erroApi !== "" && (
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

          {carregandoLocais && (
            <View style={styles.carregando}>
              <ActivityIndicator />

              <Text style={modoEscuro && styles.textoEscuro}>
                Procurando restaurantes próximos...
              </Text>
            </View>
          )}

          {locais.length > 0 && (
            <View style={styles.lista}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Restaurantes próximos
              </Text>

              <FlatList
                data={locais}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={[styles.local, modoEscuro && styles.localEscuro]}
                  >
                    <Text
                      style={[
                        styles.localNome,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {item.nome}
                    </Text>

                    <Text
                      style={[
                        styles.textoCard,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {item.endereco}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {Platform.OS === "web" && latitude !== null && longitude !== null && (
            <View style={styles.mapa}>
              <Mapa latitude={latitude} longitude={longitude} locais={locais} />
            </View>
          )}

          {Platform.OS !== "web" && (
            <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
              O mapa interativo está disponível atualmente na versão Web. Os
              locais encontrados continuam disponíveis acima.
            </Text>
          )}

          <View style={styles.espacoGrande}>
            <Button title="Começar novamente" onPress={reiniciar} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
  },

  containerClaro: {
    backgroundColor: "#ffffff",
  },

  containerEscuro: {
    backgroundColor: "#121212",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  descricao: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 25,
  },

  descricaoMenor: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  contador: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
  },

  pergunta: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  textoEscuro: {
    color: "#ffffff",
  },

  textoCard: {
    fontSize: 16,
    marginBottom: 5,
  },

  espaco: {
    height: 10,
  },

  espacoGrande: {
    marginTop: 20,
  },

  blocoDepois: {
    marginTop: 25,
  },

  resultado: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },

  codigo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 18,
  },

  inputEscuro: {
    color: "#ffffff",
    borderColor: "#666666",
  },

  lista: {
    maxHeight: 200,
    marginTop: 15,
    marginBottom: 15,
  },

  aviso: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },

  resposta: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  respostaEscuro: {
    borderColor: "#666666",
  },

  nomeResposta: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 7,
  },

  textoResposta: {
    fontSize: 16,
    marginBottom: 4,
  },

  botaoTema: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eeeeee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  iconeTema: {
    fontSize: 26,
  },

  carregando: {
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },

  cardEscuro: {
    borderColor: "#666666",
  },

  cardTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  erro: {
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  local: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  localEscuro: {
    borderColor: "#666666",
  },

  localNome: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  mapa: {
    width: "100%",
    marginTop: 15,
  },

  resultadoCard: {
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  resultadoCardEscuro: {
    borderColor: "#ffffff",
  },

  resultadoTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  resultadoDescricao: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
