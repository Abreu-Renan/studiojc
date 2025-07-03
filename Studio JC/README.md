# Studio JC - Site Moderno e Dinâmico

Este projeto é o site oficial do Studio JC, com galeria dinâmica, área administrativa, comentários interativos, responsividade, acessibilidade e diversas melhorias de experiência do usuário.

## Funcionalidades Principais

- **Galeria Dinâmica:** Exibe fotos e vídeos em miniaturas, com visualização ampliada (lightbox) e opção de download.
- **Upload de Arquivos (Admin):** Upload múltiplo de imagens e vídeos, com barra de progresso, feedback visual e validação de tipo/tamanho. Apenas administradores podem enviar arquivos.
- **Exclusão de Arquivos (Admin):** Apenas administradores podem excluir fotos e vídeos da galeria.
- **Comentários Dinâmicos:** Visitantes podem comentar, responder, curtir (👍) e dar coração (❤️) nos comentários. Admin pode excluir qualquer comentário ou resposta.
- **Persistência de Comentários:** Todos os comentários e respostas são salvos em um arquivo JSON no backend.
- **Área Restrita/Admin:** Login protegido para administradores, com feedback visual, bloco "Admin" no topo e botão de logoff.
- **Menu Moderno:** Efeito visual ao passar o mouse, sem quebras de linha, com link para área restrita em todas as páginas.
- **Responsividade:** Layout adaptado para desktop e mobile.
- **Acessibilidade:** Navegação por teclado, foco visível, landmarks, aria-labels, contraste aprimorado e suporte a leitores de tela.
- **Tema Escuro/Claro:** Alternância de tema via tecla "T" e persistência da escolha.
- **SEO e Performance:** Meta tags otimizadas, favicon, imagens com loading="lazy" e estrutura semântica.
- **Feedback Visual:** Mensagens de sucesso/erro em formulários, animações suaves em botões e interações.
- **Validações e Segurança:** Middleware para proteger rotas restritas, logs de upload/exclusão, tratamento de erros e validação de arquivos.

## Estrutura de Pastas

- `index.html`, `sobre.html`, `horarios.html`, `galeria.html`, `contato.html`: Páginas principais do site.
- `js/server.js`: Backend Node.js/Express/Multer, rotas de upload, galeria, comentários, autenticação, etc.
- `js/index-enhancements.js`: JS para carrossel, tema, feedback visual, animações e acessibilidade na home.
- `comentarios.json`: Persistência dos comentários.
- `fotos/` e `videos/`: Pastas para uploads dinâmicos.
- `assets/`: Imagens, vídeos e logo do site.
- `css/style.css`: Estilos globais.
- `css/style-index.css`, `css/style-sobre.css`, etc: Estilos específicos por página.

## Como Funciona

- **Visitantes:** Podem navegar, visualizar galeria, baixar arquivos e comentar.
- **Admin:** Após login, pode enviar e excluir arquivos, excluir comentários, ver bloco "Admin" no topo e acessar área restrita.
- **Botões restritos:** Só aparecem para admin logado (upload, exclusão, etc.).
- **Download:** Ícone de download abaixo de cada miniatura de foto/vídeo.
- **Tema:** Pressione "T" para alternar entre claro/escuro.

## Tecnologias Utilizadas

- Node.js + Express (backend)
- Multer (upload de arquivos)
- Express-session (autenticação)
- HTML5, CSS3, JavaScript (frontend)

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   node js/server.js
   ```
3. Acesse `http://localhost:3000` no navegador.

## Usuário Admin

- **Usuário:** admin
- **Senha:** studiojc2025

---

Se desejar personalizar, adicionar novas funções ou tirar dúvidas, basta pedir!
