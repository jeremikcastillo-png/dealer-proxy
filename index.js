// index.js  — Dealer Proxy (Vercel / Node 18+)
const express = require("express");
const app = express();

app.use(express.json());

// ======= CONFIG: URL de tu Apps Script =======
const TARGET_URL =
  "https://script.google.com/macros/s/AKfycbyv2bZzkDo_NZu53jdm5zmgr01-rwuopJeOfUKYY-Ctt4MSad-1Ym7xxmaCwI3e_pVnXA/exec";

// ======= Normalizador de payload (alias boricuas → claves oficiales) =======
function normalizePayload(p) {
  const out = { ...p };

  // Normaliza números (quita $ y comas)
  const toNumber = (v) => {
    if (v === undefined || v === null) return v;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[,$\s]/g, "");
    const n = Number(s);
    return isNaN(n) ? v : n;
  };

  // Teléfono → E.164 básico
  const toPhone = (v) => {
    if (!v) return v;
    let s = String(v).replace(/\D+/g, "");
    if (s.startsWith("1") && s.length === 11) return "+" + s;
    if (s.length === 10) return "+1" + s;
    return v;
  };

  // ==== ALIAS → claves que entiende dealer.gs ====
  const aliases = {
    // Inventario
    tablilla: "Placa",
    matricula: "Placa",
    placa_gasto: "Placa",
    precio_piso: "Precio_Piso",
    precioPublico: "Precio_Publicado",
    precio_publicado: "Precio_Publicado",
    condicion: "Condicion_Score",
    ano: "Ano", // (por si viene sin tilde)

    // Gasto
    monto: "Monto",
    categoria: "Categoria",
    descripcion: ["Descripcion", "Descripcion_Gasto"],

    // SMS / leads
    telefono: "to",
    to_phone: "to",
  };

  for (const [k, v] of Object.entries(p)) {
    const alias = aliases[k];
    if (!alias) continue;

    if (Array.isArray(alias)) {
      // p.ej. descripcion → Descripcion y Descripcion_Gasto (si están vacías)
      for (const target of alias) {
        if (out[target] === undefined) out[target] = v;
      }
    } else {
      if (out[alias] === undefined) out[alias] = v;
    }
  }

  // Limpiezas/formateos
  if (out.to) out.to = toPhone(out.to);

  // Números para precios/montos/condición
  [
    "Precio_Piso",
    "Precio_Publicado",
    "Costo_Compra",
    "Costo_Reacond",
    "Otros_Costos",
    "Monto",
    "Condicion_Score",
  ].forEach((k) => {
    if (out[k] !== undefined) out[k] = toNumber(out[k]);
  });

  // Si vino "Año" con tilde, muévelo a "Ano"
  if (out["Año"] !== undefined && out["Ano"] === undefined) {
    out["Ano"] = toNumber(out["Año"]);
    delete out["Año"];
  }

  return out;
}

// ======= Rutas =======
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, msg: "Dealer proxy online" });
});

app.post("/", async (req, res) => {
  try {
    const raw = req.body || {};
    const payload = normalizePayload(raw);

    const r = await fetch(TARGET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Requerido por Vercel (Node/Express)
module.exports = app;
