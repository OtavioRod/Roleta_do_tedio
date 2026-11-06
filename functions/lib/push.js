const admin = require("firebase-admin");

const URL_EXPO = "https://exp.host/--/api/v2/push/send";

async function tokensDe(uid) {
  const db = admin.firestore();

  const instantaneo = await db
    .collection("users")
    .doc(uid)
    .collection("dispositivos")
    .get();

  return instantaneo.docs.map((documento) => ({
    token: documento.get("token"),
    referencia: documento.ref,
  }));
}

async function enviarPush(uids, { titulo, corpo, dados }) {
  const unicos = [...new Set(uids.filter(Boolean))];

  if (unicos.length === 0) {
    return;
  }

  const destinos = (await Promise.all(unicos.map(tokensDe))).flat();

  const validos = destinos.filter(
    (destino) =>
      typeof destino.token === "string" &&
      destino.token.startsWith("ExponentPushToken"),
  );

  for (let inicio = 0; inicio < validos.length; inicio += 100) {
    const lote = validos.slice(inicio, inicio + 100);

    const mensagens = lote.map((destino) => ({
      to: destino.token,
      title: titulo,
      body: corpo,
      sound: "default",
      priority: "high",
      channelId: "padrao",
      data: dados ?? {},
    }));

    const cabecalhos = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (process.env.EXPO_ACCESS_TOKEN) {
      cabecalhos.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    try {
      const resposta = await fetch(URL_EXPO, {
        method: "POST",
        headers: cabecalhos,
        body: JSON.stringify(mensagens),
      });

      const corpoResposta = await resposta.json();

      const tickets = Array.isArray(corpoResposta.data)
        ? corpoResposta.data
        : [];

      await Promise.all(
        tickets.map((ticket, indice) =>
          ticket.status === "error" &&
          ticket.details &&
          ticket.details.error === "DeviceNotRegistered"
            ? lote[indice].referencia.delete()
            : Promise.resolve(),
        ),
      );
    } catch (erro) {
      console.error("Falha ao enviar push pelo Expo:", erro);
    }
  }
}

module.exports = { enviarPush };
