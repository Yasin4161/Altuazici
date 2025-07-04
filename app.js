/* ========= KULLANICI AYARLARI ========= */
const OPENAI_KEY = "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"           // anahtarın buraya
const MODEL_ASR  = "whisper-1"
const MODEL_GPT  = "gpt-4o-mini"
/* ===================================== */

const $ = (q) => document.querySelector(q)
const videoIn = $("#video")
const goBtn   = $("#go")
const logEl   = $("#log")
const listEl  = $("#list")

goBtn.onclick = async () => {
  if (!videoIn.files[0]) return alert("MP4 seç!")

  log("Yükleniyor…")
  const fd = new FormData()
  fd.append("file",  videoIn.files[0])
  fd.append("model", MODEL_ASR)
  fd.append("response_format", "json")

  /* 1) Whisper – tarayıcıdan direkt istek */
  const asrRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_KEY}` },
    body: fd
  })

  if (!asrRes.ok) return fail(asrRes)

  const asrData = await asrRes.json()
  log("Çevrildi, Türkçeye aktarılıyor…")

  /* 2) GPT – Türkçeye çeviri */
  const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type":  "application/json"
    },
    body: JSON.stringify({
      model: MODEL_GPT,
      messages: [
        { role: "system",
          content: "You are a professional translator. Translate the given text into fluent Turkish; keep her konuşma yeni satırda olsun." },
        { role: "user", content: asrData.text }
      ]
    })
  })

  if (!gptRes.ok) return fail(gptRes)

  const gptData = await gptRes.json()
  const lines = gptData.choices[0].message.content.trim().split(/\n+/)

  listEl.innerHTML = ""
  lines.forEach(t => {
    const li = document.createElement("li")
    li.className = "line"
    li.innerHTML = `<span style="flex:1">${t}</span>
                    <button>Kopyala</button>`
    li.querySelector("button").onclick = () => navigator.clipboard.writeText(t)
    listEl.appendChild(li)
  })

  log("Hazır ✅")
}

/* ---- Küçük yardımcılar ---- */
function log(msg){ logEl.textContent = msg }
async function fail(resp){
  const txt = await resp.text()
  log(`Hata ${resp.status}: ${txt.slice(0,200)}`)
}
