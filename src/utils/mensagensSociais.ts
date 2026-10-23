const MENSAGENS: Record<string, string> = {
  "codigo-invalido": "Código inválido. Confira e tente de novo.",
  "sala-nao-encontrada": "Não encontramos uma sala com esse código.",
  "sala-cheia": "Esta sala já está cheia.",
  "sala-iniciada": "Esta sala já começou e não aceita novos participantes.",
  "sala-encerrada": "Esta sala foi encerrada.",
  "proprio-codigo": "Este é o seu próprio código de amigo.",
  "ja-sao-amigos": "Vocês já são amigos.",
  "pedido-ja-enviado": "Você já enviou um pedido para esta pessoa.",
  "amigo-nao-encontrado": "Não encontramos ninguém com esse código.",
  "codigo-indisponivel":
    "Não foi possível gerar um código agora. Tente de novo.",
};

export function codigoErroSocial(erro: unknown) {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    return String((erro as { code: unknown }).code).replace("firestore/", "");
  }

  return erro instanceof Error ? erro.message : "";
}

export function mensagemErroSocial(erro: unknown) {
  const codigo = codigoErroSocial(erro);

  if (MENSAGENS[codigo]) {
    return MENSAGENS[codigo];
  }

  if (codigo === "permission-denied") {
    return "Sem permissão para esta ação. Confira se as regras do Firestore foram publicadas.";
  }

  if (codigo === "unavailable") {
    return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
  }

  if (__DEV__) {
    console.warn("[social] erro:", codigo, erro);
  }

  return "Não foi possível concluir. Tente novamente.";
}
