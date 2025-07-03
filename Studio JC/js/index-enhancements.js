// index-enhancements.js
// JS para carrossel, feedback visual, alternância de tema, animações e acessibilidade

document.addEventListener("DOMContentLoaded", function () {
  // Carrossel de depoimentos
  const carrossel = document.querySelector(".carrossel-depoimentos");
  const depoimentos = document.querySelectorAll(".depoimento");
  const btnPrev = document.querySelector(".carrossel-btn.prev");
  const btnNext = document.querySelector(".carrossel-btn.next");
  let idx = 0;

  function mostrarDepoimento(i) {
    depoimentos.forEach((dep, j) => {
      dep.style.display = j === i ? "block" : "none";
      dep.setAttribute("aria-hidden", j !== i);
    });
  }
  if (depoimentos.length) {
    mostrarDepoimento(idx);
    btnPrev.addEventListener("click", () => {
      idx = (idx - 1 + depoimentos.length) % depoimentos.length;
      mostrarDepoimento(idx);
    });
    btnNext.addEventListener("click", () => {
      idx = (idx + 1) % depoimentos.length;
      mostrarDepoimento(idx);
    });
  }

  // Alternância de tema (dark/light) via tecla T
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "t") {
      document.body.classList.toggle("tema-escuro");
      localStorage.setItem(
        "tema",
        document.body.classList.contains("tema-escuro") ? "escuro" : "claro"
      );
    }
  });
  // Persistência do tema
  if (localStorage.getItem("tema") === "escuro") {
    document.body.classList.add("tema-escuro");
  }

  // Botão CTA flutuante acessível
  const ctaFlutuante = document.getElementById("cta-flutuante");
  if (ctaFlutuante) {
    ctaFlutuante.addEventListener("click", () => {
      window.location.href = "contato.html";
    });
  }

  // Feedback visual no formulário de login
  const formLogin = document.getElementById("form-login");
  const feedback = document.getElementById("login-feedback");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      const usuario = document.getElementById("login-usuario").value.trim();
      const senha = document.getElementById("login-senha").value.trim();
      feedback.textContent = "";
      feedback.className = "";
      if (!usuario || !senha) {
        feedback.textContent = "Preencha todos os campos.";
        feedback.className = "feedback-erro";
        return;
      }
      // Simulação de login (substitua por lógica real)
      if (usuario === "admin" && senha === "1234") {
        feedback.textContent = "Login realizado com sucesso!";
        feedback.className = "feedback-sucesso";
        setTimeout(() => {
          document.getElementById("modal-login").style.display = "none";
        }, 1000);
      } else {
        feedback.textContent = "Usuário ou senha inválidos.";
        feedback.className = "feedback-erro";
      }
    });
  }

  // Acessibilidade: fechar modal com ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("modal-login");
      if (modal && modal.style.display !== "none") {
        modal.style.display = "none";
      }
    }
  });

  // Animação sutil em botões
  document
    .querySelectorAll("button, .cta-bem-vindo, .cta-flutuante")
    .forEach((btn) => {
      btn.addEventListener("mousedown", () => btn.classList.add("ativo"));
      btn.addEventListener("mouseup", () => btn.classList.remove("ativo"));
      btn.addEventListener("mouseleave", () => btn.classList.remove("ativo"));
    });
});
