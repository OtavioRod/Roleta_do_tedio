const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/locais", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      tipo,
      raio = 5000,
      filtros,
    } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Array.isArray(filtros) ||
      filtros.length === 0
    ) {
      return res.status(400).json({
        mensagem: "Dados inválidos para busca de locais.",
      });
    }

    const consultas = filtros
      .map(
        (filtro) =>
          `${filtro}(around:${raio},${latitude},${longitude});`
      )
      .join("\n");

    const consulta = `
      [out:json][timeout:40];

      (
        ${consultas}
      );

      out center tags;
    `;

    console.log("=== INICIANDO BUSCA OVERPASS ===");
    console.log("Tipo:", tipo);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Raio:", raio);
    console.log("Filtros:", filtros);
    console.log("Consulta:", consulta);

    const resposta = await fetch(
      "https://overpass.private.coffee/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "application/json",
          "User-Agent": "Roleta-do-Tedio/1.0",
        },
        body: `data=${encodeURIComponent(consulta)}`,
      }
    );

    console.log("Status Overpass:", resposta.status);

    if (!resposta.ok) {
      const texto = await resposta.text();

      console.error("Erro retornado pelo Overpass:", texto);

      return res.status(502).json({
        mensagem: "Erro ao consultar Overpass.",
        status: resposta.status,
      });
    }

    const dados = await resposta.json();

    console.log(
      "Elementos encontrados:",
      dados.elements?.length || 0
    );

    res.json(dados);
  } catch (error) {
    console.error("Erro na rota /locais:", error);

    res.status(500).json({
      mensagem: "Erro ao buscar locais.",
    });
  }
});
app.get("/", (req, res) => {
  res.json({
    mensagem: "Backend da Roleta do Tédio funcionando!",
  });
});

app.get("/teste-banco", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");

    res.json({
      mensagem: "PostgreSQL conectado!",
      horario: resultado.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao conectar ao PostgreSQL.",
    });
  }
});

app.post("/sessoes", async (req, res) => {
  try {
    const { atividade, modalidade } = req.body;

    if (!atividade) {
      return res.status(400).json({
        mensagem: "A atividade é obrigatória.",
      });
    }

    const resultado = await pool.query(
      `
      INSERT INTO sessoes (atividade, modalidade)
      VALUES ($1, $2)
      RETURNING *
      `,
      [atividade, modalidade || null],
    );

    res.status(201).json({
      mensagem: "Sessão salva com sucesso!",
      sessao: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao salvar sessão.",
    });
  }
});

app.get("/sessoes", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM sessoes ORDER BY criado_em DESC",
    );

    res.json({
      sessoes: resultado.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensagem: "Erro ao buscar sessões.",
    });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
