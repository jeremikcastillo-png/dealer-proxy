import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// URL de tu Google Apps Script (la que termina en /exec)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyv2bZzkDo_NZu53jdm5zmgr01-rwuopJeOfUKYY-Ctt4MSad-1Ym7xxmaCwI3e_pVnXA/exec";

// Endpoint del proxy
app.post("/", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Puerto dinámico para Vercel
app.listen(3000, () => console.log("Dealer proxy running on port 3000"));
