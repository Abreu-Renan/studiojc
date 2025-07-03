import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Criação automática das pastas 'fotos' e 'videos' se não existirem
const fotosDir = path.join(__dirname, "../fotos");
const videosDir = path.join(__dirname, "../videos");
if (!fs.existsSync(fotosDir)) fs.mkdirSync(fotosDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

// Configuração da sessão
app.use(
  session({
    secret: "studiojc2025_secret", // Troque por algo mais seguro em produção
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hora
  })
);

app.use(express.urlencoded({ extended: true })); // <-- deve vir logo após a sessão, antes das rotas de login/upload

// Configuração do Multer para uploads em 'fotos' ou 'videos' conforme o tipo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const videoTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, fotosDir);
    } else if (videoTypes.includes(file.mimetype)) {
      cb(null, videosDir);
    } else {
      cb(new Error("Tipo de arquivo não permitido."));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de arquivo não permitido. Envie apenas imagens ou vídeos."
        )
      );
    }
  },
});

// Middleware de autenticação por sessão
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
  }
}

// Middleware de autenticação por sessão e usuário admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.loggedIn && req.session.usuario === "admin") {
    next();
  } else {
    res.status(403).send("Acesso restrito. Faça login como admin.");
  }
}

// Página de login
app.get("/login", (req, res) => {
  const error = req.query.error
    ? "<p style='color:red;'>Usuário ou senha inválidos!</p>"
    : "";
  const msg = req.query.msg
    ? `<p style='color:green;'>${req.query.msg}</p>`
    : "";
  res.send(`
    <h2>Login - Área Restrita</h2>
    ${error}
    ${msg}
    <form method="POST" action="/login">
      <input type="text" name="usuario" placeholder="Usuário" required autofocus />
      <input type="password" name="senha" placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </form>
    <p><a href="/galeria">Voltar para galeria</a></p>
  `);
});

// Processa login
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === "admin" && senha === "studiojc2025") {
    req.session.loggedIn = true;
    req.session.usuario = "admin";
    res.redirect("/index.html"); // Redireciona para a home após login
  } else {
    res.redirect("/login?error=1");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login?msg=Logout realizado com sucesso.");
  });
});

// Servir arquivos estáticos
app.use("/fotos", express.static(fotosDir));
app.use("/videos", express.static(videosDir));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use("/css", express.static(path.join(__dirname, "../css")));

// Página de upload (protegida)
app.get("/upload", requireAdmin, (req, res) => {
  const msg = req.query.msg
    ? `<p style='color:green;'>${req.query.msg}</p>`
    : "";
  const err = req.query.err ? `<p style='color:red;'>${req.query.err}</p>` : "";
  res.send(`
    <h2>Upload de Imagem ou Vídeo para Galeria</h2>
    ${msg}
    ${err}
    <form id="uploadForm" method="POST" enctype="multipart/form-data" style="background:#f9f9f9; padding:24px; border-radius:12px; box-shadow:0 2px 16px #e1060022; max-width:420px; margin-bottom:24px;">
      <input type="file" id="fileInput" name="arquivos" accept="image/*,video/*" multiple required style="margin-bottom:10px;" />
      <div id="preview" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:10px;"></div>
      <div id="progressContainer"></div>
      <button type="submit" style="padding:8px 24px; border-radius:6px; background:#e10600; color:#fff; border:none; font-weight:bold; cursor:pointer;">Enviar</button>
    </form>
    <p style='margin-top:1em; color:#888;'>Após o envio, os arquivos aparecerão automaticamente na galeria.</p>
    <p><a href="/galeria">Voltar para galeria</a> | <a href="/logout">Sair</a></p>
    <script>
      // Miniaturas e preview dos arquivos
      const input = document.getElementById('fileInput');
      const preview = document.getElementById('preview');
      input.addEventListener('change', function() {
        preview.innerHTML = '';
        Array.from(this.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.style.maxWidth = '80px';
            img.style.maxHeight = '80px';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 1px 6px #e1060033';
            img.title = file.name;
            img.alt = file.name;
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(file);
            preview.appendChild(img);
          } else if (file.type.startsWith('video/')) {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.width = '80px';
            div.style.height = '80px';
            div.style.background = '#eee';
            div.style.borderRadius = '8px';
            div.style.boxShadow = '0 1px 6px #e1060033';
            div.innerHTML = '<span style="font-size:32px;">🎬</span><span style="font-size:10px;">'+file.name+'</span>';
            preview.appendChild(div);
          }
        });
      });
      // Barra de progresso para upload
      const form = document.getElementById('uploadForm');
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const files = input.files;
        if (!files.length) return;
        const progressContainer = document.getElementById('progressContainer');
        progressContainer.innerHTML = '';
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('arquivos', files[i]);
          // Cria barra de progresso para cada arquivo
          const bar = document.createElement('div');
          bar.style.margin = '4px 0';
          bar.innerHTML = '<span style="font-size:12px;">' + files[i].name + '</span>' +
            '<div style="background:#ddd; border-radius:4px; height:8px; width:100%;"><div id="prog' + i + '" style="background:#e10600; width:0%; height:8px; border-radius:4px;"></div></div>';
          progressContainer.appendChild(bar);
        }
        // Envia via AJAX para mostrar progresso
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');
        xhr.upload.onprogress = function(e) {
          if (e.lengthComputable) {
            // Progresso total (não por arquivo)
            const percent = Math.round((e.loaded / e.total) * 100);
            for (let i = 0; i < files.length; i++) {
              document.getElementById('prog'+i).style.width = percent+'%';
            }
          }
        };
        xhr.onload = function() {
          if (xhr.status === 200 || xhr.status === 302) {
            window.location.href = '/upload?msg=Upload finalizado!';
          } else {
            window.location.href = '/upload?err=Erro ao enviar arquivos.';
          }
        };
        xhr.onerror = function() {
          window.location.href = '/upload?err=Erro de conexão.';
        };
        xhr.send(formData);
      });
    </script>
  `);
});

// Rota de upload (protegida) - agora aceita múltiplos arquivos
app.post("/upload", requireAdmin, (req, res) => {
  upload.array("arquivos", 10)(req, res, function (err) {
    if (err) {
      console.error("Erro no upload:", err.message);
      return res.redirect("/upload?err=" + encodeURIComponent(err.message));
    }
    if (!req.files || req.files.length === 0) {
      return res.redirect(
        "/upload?err=" + encodeURIComponent("Nenhum arquivo enviado!")
      );
    }
    let msgs = [];
    for (const file of req.files) {
      let tipo = file.mimetype.startsWith("image/") ? "Imagem" : "Vídeo";
      let pasta = file.mimetype.startsWith("image/") ? fotosDir : videosDir;
      const destinoEsperado = path.join(pasta, file.filename);
      if (!fs.existsSync(destinoEsperado)) {
        msgs.push(`Falha ao salvar ${tipo} '${file.originalname}'.`);
      } else {
        msgs.push(`${tipo} '${file.originalname}' enviado com sucesso!`);
      }
    }
    res.redirect("/upload?msg=" + encodeURIComponent(msgs.join(" | ")));
  });
});

// Página da galeria dinâmica
app.get(["/galeria", "/galeria.html"], (req, res) => {
  const fotos = fs
    .readdirSync(fotosDir)
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const videos = fs
    .readdirSync(videosDir)
    .filter((f) => /\.(mp4|webm|ogg)$/i.test(f));
  const isLogged = req.session && req.session.loggedIn;
  let galeriaHtml = "";
  if (fotos.length) {
    galeriaHtml += `<h3 style='width:100%'>Fotos</h3>`;
    galeriaHtml += fotos
      .map(
        (f, idx) =>
          `<div class="galeria-item" style="position:relative; display:inline-block;">
            <img src="/fotos/${f}" alt="${f}" class="miniatura-foto" data-full="/fotos/${f}" style="width:170px; height:128px; object-fit:cover; margin:12px; border-radius:10px; box-shadow:0 2px 12px #e1060033; cursor:pointer; transition:transform .2s; display:block;" />
            <a href="/fotos/${f}" download class="btn-download-mini" title="Baixar imagem" style="position:absolute; left:8px; bottom:8px; background:rgba(255,255,255,0.85); border-radius:50%; padding:1px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px #e1060022; width:20px; height:20px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e10600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
            ${
              isLogged && req.session.usuario === "admin"
                ? `<form method='POST' action='/delete' class='form-excluir-foto' style='position:absolute; right:8px; bottom:8px; margin:0;'><input type='hidden' name='file' value='${f}'><button type='submit' title='Excluir foto' style='background:rgba(255,255,255,0.85); border:none; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px #e1060022; cursor:pointer; padding:0;'><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#e10600' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'/><line x1='10' y1='11' x2='10' y2='17'/><line x1='14' y1='11' x2='14' y2='17'/></svg></button></form>`
                : ""
            }
          </div>`
      )
      .join("");
  }
  if (videos.length) {
    galeriaHtml += `<h3 style='width:100%'>Vídeos</h3>`;
    galeriaHtml += videos
      .map(
        (f, idx) =>
          `<div class="galeria-item" style="position:relative; display:inline-block;">
            <video src="/videos/${f}" class="miniatura-video" data-full="/videos/${f}" style="width:120px; height:90px; object-fit:cover; margin:12px; border-radius:10px; box-shadow:0 2px 12px #e1060033; cursor:pointer; transition:transform .2s; background:#000; display:block;" muted></video>
            <a href="/videos/${f}" download class="btn-download-mini" title="Baixar vídeo" style="position:absolute; left:8px; bottom:8px; background:rgba(255,255,255,0.85); border-radius:50%; padding:1px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px #e1060022; width:20px; height:20px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e10600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
            ${
              isLogged && req.session.usuario === "admin"
                ? `<form method='POST' action='/delete' class='form-excluir-video' style='position:absolute; right:8px; bottom:8px; margin:0;'><input type='hidden' name='file' value='${f}'><button type='submit' title='Excluir vídeo' style='background:rgba(255,255,255,0.85); border:none; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px #e1060022; cursor:pointer; padding:0;'><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#e10600' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'/><line x1='10' y1='11' x2='10' y2='17'/><line x1='14' y1='11' x2='14' y2='17'/></svg></button></form>`
                : ""
            }
          </div>`
      )
      .join("");
  }
  const msg = req.query.msg
    ? `<p style='color:green;'>${req.query.msg}</p>`
    : "";
  const err = req.query.err ? `<p style='color:red;'>${req.query.err}</p>` : "";
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Galeria - Studio JC</title>
      <link rel="stylesheet" href="/css/style.css" />
      <style>
        .miniatura-foto:hover { transform: scale(1.08); box-shadow:0 4px 24px #e1060055; }
        .lightbox-bg {
          position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
          z-index: 9999; transition: opacity .2s;
        }
        .lightbox-img {
          max-width: 90vw; max-height: 90vh; border-radius: 12px; box-shadow: 0 8px 32px #0008;
        }
        .lightbox-bg[hidden] { display: none; }
        .lightbox-close {
          position: absolute; top: 32px; right: 48px; color: #fff; font-size: 48px; font-weight: bold; cursor: pointer; z-index: 10000;
          text-shadow: 0 2px 8px #000a;
        }
        .form-resposta {
          display: none;
          margin-top: 10px;
          background: #f6f6f6;
          border-radius: 8px;
          padding: 8px 10px;
          max-width: 340px;
          box-shadow: 0 1px 4px #e1060033;
        }
        .form-resposta textarea {
          width: 100%;
          max-width: 300px;
          min-width: 120px;
          resize: vertical;
          padding: 6px;
          border-radius: 6px;
          border: 1.2px solid #e1060033;
          font-size: 14px;
        }
        .form-resposta button {
          margin-top: 6px;
          padding: 5px 14px;
          border-radius: 6px;
          background: #e10600;
          color: #fff;
          border: none;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 1px 4px #e1060033;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="header-container">
          <a href="/index.html" class="logo-link">
            <img src="/assets/logo.png" alt="Logo Studio JC" class="logo" />
          </a>
          <h1>Studio JC</h1>
          <nav>
            <ul>
              <li><a href="/index.html">Home</a></li>
              <li><a href="/sobre.html">Sobre</a></li>
              <li><a href="/horarios.html">Horários</a></li>
              <li><a href="/galeria.html">Galeria</a></li>
              <li><a href="/contato.html">Contato</a></li>
              <li><a href="#" id="btn-area-restrita">Área Restrita</a></li>
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <section>
          <h2>Galeria de Fotos e Vídeos</h2>
          ${msg}
          ${err}
          <div class="galeria" style="display:flex; flex-wrap:wrap; gap:24px; justify-content:flex-start; margin:36px 0;">
            ${galeriaHtml || "<p>Nenhuma imagem ou vídeo enviado ainda.</p>"}
          </div>
          <p><a href="/upload">Enviar nova foto ou vídeo (restrito)</a></p>
        </section>
        <section style="margin-top:48px;">
          <h2>Comentários</h2>
          <form id="form-comentario" style="margin-bottom:18px;box-shadow:0 2px 12px #e1060022;padding:18px 16px;border-radius:10px;background:#fff;max-width:540px;">
            <input id="comentario-nome" maxlength="40" placeholder="Seu nome (opcional)" style="width:220px;padding:7px 10px;border-radius:7px;border:1.2px solid #e1060033;font-size:14px;margin-bottom:7px;" />
            <br>
            <textarea id="comentario-texto" rows="2" maxlength="400" placeholder="Deixe um comentário..." style="width:100%;max-width:480px;resize:vertical;padding:10px 12px;border-radius:8px;border:1.5px solid #e1060033;font-size:15px;"></textarea><br>
            <button type="submit" style="margin-top:10px;padding:8px 28px;border-radius:8px;background:#e10600;color:#fff;border:none;font-weight:bold;cursor:pointer;font-size:16px;box-shadow:0 1px 6px #e1060033;">Comentar</button>
          </form>
          <div id="comentarios" style="margin-top:32px;"></div>
        </section>
      </main>
      <div id="lightbox" class="lightbox-bg" hidden>
        <span class="lightbox-close" onclick="document.getElementById('lightbox').hidden=true">&times;</span>
        <img id="lightbox-img" class="lightbox-img" src="" alt="Imagem em tamanho real" style="display:none;" />
        <video id="lightbox-video" class="lightbox-img" src="" controls style="display:none;"></video>
      </div>
      <footer>
        <p>&copy; 2025 Studio JC. Todos os direitos reservados.</p>
      </footer>
      <div
        id="modal-login"
        style="
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0008;
          z-index: 9999;
          align-items: center;
          justify-content: center;
        "
      >
        <form
          id="form-login"
          style="
            background: #fff;
            padding: 32px 28px;
            border-radius: 12px;
            box-shadow: 0 4px 32px #0005;
            min-width: 260px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
          "
        >
          <h3>Área Restrita</h3>
          <input
            id="login-usuario"
            placeholder="Usuário"
            required
            style="
              padding: 7px 12px;
              border-radius: 7px;
              border: 1.2px solid #e1060033;
              font-size: 15px;
              width: 180px;
            "
          />
          <input
            id="login-senha"
            type="password"
            placeholder="Senha"
            required
            style="
              padding: 7px 12px;
              border-radius: 7px;
              border: 1.2px solid #e1060033;
              font-size: 15px;
              width: 180px;
            "
          />
          <button
            type="submit"
            style="
              padding: 8px 24px;
              border-radius: 8px;
              background: #e10600;
              color: #fff;
              border: none;
              font-weight: bold;
              cursor: pointer;
              font-size: 16px;
            "
          >
            Entrar
          </button>
          <span
            id="login-erro"
            style="color: red; font-size: 14px; display: none"
          ></span>
          <button
            type="button"
            onclick="document.getElementById('modal-login').style.display='none'"
            style="
              background: none;
              border: none;
              color: #e10600;
              font-size: 15px;
              cursor: pointer;
            "
          >
            Cancelar
          </button>
        </form>
      </div>
      <script>
        // Modal login
        const btnArea = document.getElementById("btn-area-restrita");
        const modal = document.getElementById("modal-login");
        const formLogin = document.getElementById("form-login");
        const erroLogin = document.getElementById("login-erro");
        btnArea.onclick = function (e) {
          e.preventDefault();
          modal.style.display = "flex";
          erroLogin.style.display = "none";
        };
        formLogin.onsubmit = function (e) {
          e.preventDefault();
          const usuario = document.getElementById("login-usuario").value.trim();
          const senha = document.getElementById("login-senha").value.trim();
          fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "usuario=" + encodeURIComponent(usuario) + "&senha=" + encodeURIComponent(senha),
          }).then((r) => {
            if (r.redirected) {
              sessionStorage.setItem("areaRestrita", "1");
              window.location.href = r.url;
            } else {
              erroLogin.textContent = "Usuário ou senha inválidos!";
              erroLogin.style.display = "block";
            }
          });
        };
        // Lightbox para fotos
        document.querySelectorAll('.miniatura-foto').forEach(img => {
          img.addEventListener('click', function() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxVideo = document.getElementById('lightbox-video');
            lightboxImg.style.display = 'block';
            lightboxVideo.style.display = 'none';
            lightboxImg.src = this.dataset.full;
            lightbox.hidden = false;
          });
        });
        // Lightbox para vídeos
        document.querySelectorAll('.miniatura-video').forEach(vid => {
          vid.addEventListener('click', function() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxVideo = document.getElementById('lightbox-video');
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = this.dataset.full;
            lightboxVideo.currentTime = 0;
            lightboxVideo.play();
            lightbox.hidden = false;
          });
        });
        document.getElementById('lightbox').addEventListener('click', function(e) {
          if (e.target === this) this.hidden = true;
          document.getElementById('lightbox-video').pause();
        });
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            document.getElementById('lightbox').hidden = true;
            document.getElementById('lightbox-video').pause();
          }
        });
        // --- Comentários ---
        const isAdmin = ${
          req.session && req.session.loggedIn && req.session.usuario === "admin"
        };
        // Esconde botões restritos para visitantes
        window.addEventListener('DOMContentLoaded', function() {
          if (!isAdmin) {
            document.querySelectorAll('.btn-delete').forEach(btn => btn.style.display = 'none');
            const uploadLink = document.querySelector('a[href="/upload"]');
            if (uploadLink) uploadLink.style.display = 'none';
          }
        });
        function renderComentarios(lista, parentId) {
          if (!lista || !lista.length) return '';
          let html = '<ul class="comentario-lista" style="padding-left:'+(parentId?24:0)+'px;">';
          lista.forEach(function(c) {
            html += '<li>';
            html += '<div class="comentario-bloco">';
            html += '<span class="comentario-texto">'+c.texto.replace(/</g,'&lt;')+'</span>';
            if (c.nome) html += '<span style="font-size:13px;color:#555;margin-left:8px;font-style:italic;">- '+c.nome.replace(/</g,'&lt;')+'</span>';
            html += '<div class="comentario-data">'+new Date(c.data).toLocaleString('pt-BR')+'</div>';
            html += '<div class="comentario-acoes">';
            html += '<button class="btn-like" data-id="'+c.id+'" title="Curtir">👍 <span>'+(c.likes||0)+'</span></button>';
            html += '<button class="btn-heart" data-id="'+c.id+'" title="Amei">❤️ <span>'+(c.hearts||0)+'</span></button>';
            html += '<button class="btn-responder" data-id="'+c.id+'">Responder</button>';
            if (isAdmin) {
              html += '<button class="btn-delete" data-id="'+c.id+'" title="Excluir" style="color:red;">🗑️</button>';
            }
            html += '</div>';
            html += '<form class="form-resposta" data-parent="'+c.id+'">';
            html += '<input maxlength="40" placeholder="Seu nome (opcional)" style="width:160px;padding:5px 8px;border-radius:6px;border:1.2px solid #e1060033;font-size:13px;margin-bottom:5px;" /><br>';
            html += '<textarea rows="2" maxlength="400" placeholder="Responder..."></textarea><br>';
            html += '<button type="submit">Enviar resposta</button>';
            html += '</form>';
            html += '</div>';
            html += renderComentarios(c.respostas, c.id);
            html += '</li>';
          });
          html += '</ul>';
          return html;
        }
        function carregarComentarios() {
          fetch('/api/comentarios').then(r=>r.json()).then(lista => {
            document.getElementById('comentarios').innerHTML = renderComentarios(lista);
          });
        }
        carregarComentarios();
        document.getElementById('form-comentario').onsubmit = function(e) {
          e.preventDefault();
          const texto = document.getElementById('comentario-texto').value.trim();
          const nome = document.getElementById('comentario-nome').value.trim();
          if (!texto) return;
          fetch('/api/comentarios', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({texto, nome})
          }).then(()=>{
            document.getElementById('comentario-texto').value='';
            document.getElementById('comentario-nome').value='';
            carregarComentarios();
          });
        };
        document.getElementById('comentarios').onclick = function(e) {
          if (e.target.classList.contains('btn-like')) {
            fetch('/api/comentarios/reacao', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:e.target.dataset.id,tipo:'like'})}).then(carregarComentarios);
          }
          if (e.target.classList.contains('btn-heart')) {
            fetch('/api/comentarios/reacao', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:e.target.dataset.id,tipo:'heart'})}).then(carregarComentarios);
          }
          if (e.target.classList.contains('btn-responder')) {
            const form = e.target.closest('div').parentNode.querySelector('.form-resposta');
            form.style.display = form.style.display==='none'?'block':'none';
          }
          if (e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm('Tem certeza que deseja excluir este comentário?')) {
              fetch('/api/comentarios/delete', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({id})
              }).then(carregarComentarios);
            }
          }
        };
        document.getElementById('comentarios').addEventListener('submit', function(e) {
          if (e.target.classList.contains('form-resposta')) {
            e.preventDefault();
            const nome = e.target.querySelector('input').value.trim();
            const texto = e.target.querySelector('textarea').value.trim();
            const parentId = e.target.dataset.parent;
            if (!texto) return;
            fetch('/api/comentarios', {
              method:'POST', headers:{'Content-Type':'application/json'},
              body:JSON.stringify({texto, parentId, nome})
            }).then(()=>{
              e.target.querySelector('textarea').value='';
              e.target.querySelector('input').value='';
              e.target.style.display='none';
              carregarComentarios();
            });
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API para galeria dinâmica
app.get("/api/galeria", (req, res) => {
  const fotos = fs
    .readdirSync(fotosDir)
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const videos = fs
    .readdirSync(videosDir)
    .filter((f) => /\.(mp4|webm|ogg)$/i.test(f));
  const lista = [];
  fotos.forEach((f) =>
    lista.push({ tipo: "foto", nome: f, url: "/fotos/" + f })
  );
  videos.forEach((f) =>
    lista.push({ tipo: "video", nome: f, url: "/videos/" + f })
  );
  res.json(lista);
});

// Rota de exclusão de arquivo (protegida)
app.post("/delete", requireAdmin, (req, res) => {
  const file = req.body.file;
  // Permite qualquer nome de arquivo, exceto se contiver / ou \
  if (!file || /[\\\/]/.test(file)) {
    return res.redirect(
      "/galeria?err=" + encodeURIComponent("Arquivo inválido.")
    );
  }
  let filePath = path.join(fotosDir, file);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(videosDir, file);
    if (!fs.existsSync(filePath)) {
      return res.redirect(
        "/galeria?err=" + encodeURIComponent("Arquivo não encontrado.")
      );
    }
  }
  try {
    fs.unlinkSync(filePath);
    console.log(`Exclusão: ${file} por usuário autenticado.`);
    res.redirect(
      "/galeria?msg=" + encodeURIComponent("Arquivo excluído com sucesso!")
    );
  } catch (e) {
    console.error("Erro ao excluir:", e.message);
    res.redirect(
      "/galeria?err=" + encodeURIComponent("Erro ao excluir arquivo.")
    );
  }
});

// --- Comentários ---
const comentariosPath = path.join(__dirname, "../comentarios.json");
function lerComentarios() {
  try {
    return JSON.parse(fs.readFileSync(comentariosPath, "utf8"));
  } catch {
    return [];
  }
}
function salvarComentarios(comentarios) {
  fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
}

// Listar comentários
app.get("/api/comentarios", (req, res) => {
  res.json(lerComentarios());
});

// Adicionar comentário ou resposta
app.post("/api/comentarios", express.json(), (req, res) => {
  const { texto, parentId, nome } = req.body;
  if (!texto || typeof texto !== "string" || texto.length < 1) {
    return res.status(400).json({ erro: "Comentário vazio." });
  }
  const comentarios = lerComentarios();
  const novo = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    texto,
    nome: nome && nome.trim() ? nome.trim().slice(0, 40) : "",
    parentId: parentId || null,
    data: new Date().toISOString(),
    likes: 0,
    hearts: 0,
    respostas: [],
  };
  if (parentId) {
    // Adiciona como resposta
    function addResp(lista) {
      for (const c of lista) {
        if (c.id === parentId) {
          c.respostas = c.respostas || [];
          c.respostas.push(novo);
          return true;
        }
        if (c.respostas && addResp(c.respostas)) return true;
      }
      return false;
    }
    addResp(comentarios);
  } else {
    comentarios.push(novo);
  }
  salvarComentarios(comentarios);
  res.json(novo);
});

// Curtida/coração
app.post("/api/comentarios/reacao", express.json(), (req, res) => {
  const { id, tipo } = req.body;
  if (!id || !["like", "heart"].includes(tipo)) return res.status(400).end();
  const comentarios = lerComentarios();
  function addReacao(lista) {
    for (const c of lista) {
      if (c.id === id) {
        if (tipo === "like") c.likes = (c.likes || 0) + 1;
        if (tipo === "heart") c.hearts = (c.hearts || 0) + 1;
        return true;
      }
      if (c.respostas && addReacao(c.respostas)) return true;
    }
    return false;
  }
  addReacao(comentarios);
  salvarComentarios(comentarios);
  res.json({ ok: true });
});

// Excluir comentário ou resposta (apenas admin)
app.post(
  "/api/comentarios/delete",
  express.json(),
  requireAdmin,
  (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).end();
    let comentarios = lerComentarios();
    function remover(lista) {
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].id === id) {
          lista.splice(i, 1);
          return true;
        }
        if (lista[i].respostas && remover(lista[i].respostas)) return true;
      }
      return false;
    }
    remover(comentarios);
    salvarComentarios(comentarios);
    res.json({ ok: true });
  }
);

// Página inicial e outras páginas estáticas (deve ser a última)
app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
