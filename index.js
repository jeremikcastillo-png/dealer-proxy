import express from "express";

const app = express();
app.use(express.json());

// --- Normalización de payloads ---
function normalizePayload(p) {
  return {
    ...p,
    // --- Aliases de inventario ---
    Placa: p.placa || p.tablilla || "",
    Marca: p.marca || p.Marca || "",
    Modelo: p.modelo || p.Modelo || "",
    Año: p.ano || p.Año || "",
    VIN: p.vin || "",
    Trim: p.trim || "",
    Color: p.color || "",
    Millaje: p.millaje || "",
    Transmision: p.transmision || p.trans || "",
    Combustible: p.combustible || p.fuel || "",
    Traccion: p.traccion || p.drive || "",
    Condicion_Score: p.condicion_score || p.condicion || "",
    Condicion_Notas: p.condicion_notas || "",
    Interno_Extras: p.interno_extras || "",
    Descripcion: p.descripcion || p.notes || "",
    Precio_Publicado: p.precio_publicado || "",
    Precio_Piso: p.precio_piso || "",
    Costo_Compra: p.costo_compra || "",
    Costo_Reacond: p.costo_reacond || "",
    Otros_Costos: p.otros_costos || "",
    Fecha_Adquisicion: p.fecha_adquisicion || "",
    Fecha_Publicacion: p.fecha_publicacion || "",
    Fuente_Adquisicion: p.fuente_adquisicion || "",
    Ubicacion_Lote: p.ubicacion_lote || "",
    Fotos_URL: p.fotos_url || "",
    Estado_Venta: p.estado_venta || "",
    Llaves: p.llaves || "",
    Notas: p.notas || "",
    Dueño_Stock: p.dueno_stock || p.owner || "Jeremy",
    // --- Aliases de gastos ---
    Monto: p.monto || p.Monto || 0,
    Categoria: p.categoria || p.Categoria || "",
    Descripcion_Gasto: p.descripcion_gasto || p.descripcion || "",
    Placa_Gasto: p.placa_gasto || p.placa || ""
  };
}

// --- Endpoint principal ---
app.post("/", async (req, res) => {
  try {
    const { action, ...data } = req.body;
    const normalized = normalizePayload(data);

    // 📌 Aquí simulas/llamas al backend real
    console.log("🔧 Acción:", action);
    console.log("📦 Payload normalizado:", normalized);

    res.json({
      ok: true,
      action,
      received: normalized,
      msg: "Dealer proxy procesó la acción correctamente."
    });
  } catch (err) {
    console.error("❌ Error en proxy:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// --- Healthcheck ---
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "Dealer proxy online" });
});

// --- Puerto ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dealer proxy corriendo en puerto ${PORT}`);
});
