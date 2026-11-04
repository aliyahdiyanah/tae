const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());

// Paparkan Antaramuka (Frontend)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vercel AI Sandbox & Word Generator</title>
<script src="https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js"></script>
<style>
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #121212; color: #e0e0e0; height: 100vh; display: flex; gap: 20px; }
.left { width: 40%; min-width: 320px; display: flex; flex-direction: column; background: #1e1e1e; padding: 20px; border: 1px solid #333; border-radius: 10px; }
.right { flex: 1; min-width: 0; background: #fff; border: 1px solid #333; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
h2 { margin-top: 0; color: #fff; font-size: 20px; }
.description { color: #aaa; font-size: 12px; line-height: 1.5; margin-bottom: 15px; }
label { font-size: 13px; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #ccc; display: block; }
textarea { width: 100%; padding: 10px; background: #2d2d2d; color: #fff; border: 1px solid #444; border-radius: 6px; font-family: inherit; font-size: 14px; min-height: 120px; resize: vertical; }
button { width: 100%; padding: 12px; background: #007acc; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 6px; margin-top: 12px; }
button:hover { background: #005999; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-docx { background: #2b579a; margin-top: 8px; }
.btn-docx:hover { background: #1d3b6f; }
.status { font-size: 12px; line-height: 1.5; margin-top: 10px; padding: 8px; background: #161616; border-left: 3px solid #007acc; border-radius: 4px; color: #bbb; }
.tabs { display: flex; background: #252526; flex-shrink: 0; }
.tab { flex: 1; background: #2d2d2d; color: #bbb; border: none; cursor: pointer; padding: 12px; font-weight: bold; font-size: 13px; }
.tab.active { background: white; color: #007acc; }
.tab-content { display: none; flex: 1; min-height: 0; overflow: hidden; }
.tab-content.active { display: flex; }
iframe { display: block; width: 100%; height: 100%; border: none; background: white; }
pre { margin: 0; padding: 16px; width: 100%; height: 100%; overflow: auto; background: #1a1a1a; color: #a6e22e; font: 12px/1.5 Consolas, monospace; }
</style>
</head>
<body>
  <section class="left">
    <h2>Vercel AI Sandbox</h2>
    <p class="description">Hosted on Vercel Serverless Platform using Groq AI Engine.</p>
    
    <label for="prompt">Instructions / Prompt</label>
    <textarea id="prompt" placeholder="Example: Create a modern dashboard interface with statistics and data tables..."></textarea>
    
    <button id="generateButton" onclick="generate()">Generate UI & Document</button>
    <button id="downloadDocxBtn" class="btn-docx" onclick="downloadDocx()" disabled>Download Word (.docx)</button>
    
    <label>System Status</label>
    <div id="status" class="status">Ready. Enter your prompt to begin.</div>
  </section>

  <section class="right">
    <div class="tabs">
      <button class="tab active" onclick="showTab('preview')">Live Preview</button>
      <button class="tab" onclick="showTab('code')">Source Code</button>
    </div>
    <div id="content-preview" class="tab-content active">
      <iframe id="previewFrame" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
    <div id="content-code" class="tab-content">
      <pre id="output">Generated code will appear here...</pre>
    </div>
  </section>

<script>
let lastGeneratedCode = "";
let previousBlobUrl = null;

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && name === 'preview') || (i === 1 && name === 'code'));
  });
  document.getElementById('content-preview').classList.toggle('active', name === 'preview');
  document.getElementById('content-code').classList.toggle('active', name === 'code');
}

async function generate() {
  const message = document.getElementById("prompt").value.trim();
  const statusBox = document.getElementById("status");
  const generateButton = document.getElementById("generateButton");
  const downloadDocxBtn = document.getElementById("downloadDocxBtn");
  
  if (!message) { statusBox.textContent = "Please enter instructions first."; return; }
  
  generateButton.disabled = true;
  downloadDocxBtn.disabled = true;
  generateButton.textContent = "Generating via Groq AI...";
  statusBox.textContent = "Sending request to Vercel backend...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || "Server error");
    
    let code = String(data.response || "").trim();
    code = code.replace(/^\\s*\`\`\`(?:html)?\\s*/i, "").replace(/\\s*\`\`\`\\s*$/, "");
    if (!code.includes("<!DOCTYPE html>")) {
      code = \`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;line-height:1.6;color:#333;}</style></head><body>\${code.replace(/\\n/g, "<br>")}</body></html>\`;
    }

    lastGeneratedCode = code;
    document.getElementById("output").textContent = code;
    
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    const newBlobUrl = URL.createObjectURL(blob);
    const frame = document.getElementById("previewFrame");
    frame.src = "about:blank";
    if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
    previousBlobUrl = newBlobUrl;
    frame.src = newBlobUrl;
    
    showTab('preview');
    downloadDocxBtn.disabled = false;
    statusBox.textContent = "Success! Ready to download as Word document.";
  } catch (err) {
    statusBox.textContent = "Error: " + err.message;
    showTab('code');
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate UI & Document";
  }
}

function downloadDocx() {
  if (!lastGeneratedCode) return;
  try {
    const converted = htmlDocx.asBlob(lastGeneratedCode);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(converted);
    link.download = 'Vercel_Report.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.getElementById("status").textContent = "Word document downloaded successfully!";
  } catch(err) {
    document.getElementById("status").textContent = "Download failed: " + err.message;
  }
}
</script>
</body>
</html>`);
});

// Endpoint API Backend untuk Groq AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured in Vercel Environment Variables." });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${apiKey}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert developer. Output ONLY valid raw HTML starting with <!DOCTYPE html> and ending with </html>. STRICTLY NO markdown blocks and NO conversational filler." },
          { role: "user", content: message }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    res.json({ response: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));