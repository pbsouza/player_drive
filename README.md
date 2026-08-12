# Google Drive TV Player

Aplicação React + Tailwind CSS para navegação e reprodução de vídeos do Google Drive em Smart TVs, PCs e dispositivos móveis.

## 🚀 Como Publicar no GitHub Pages sem Tela Em Branco

### Método 1: GitHub Actions (Automático - Recomendado)
1. Faça o **push** do código para o seu repositório no GitHub.
2. No GitHub, acesse a aba **Settings** > **Pages** do seu repositório.
3. Em **Source** (Fonte), selecione **GitHub Actions**.
4. Cada novo commit fará o build automático e publicará os arquivos compilados da pasta `dist`.

### Método 2: Deploy Manual pelo Terminal
Caso prefira publicar direto do seu computador:
```bash
npm run deploy
```
Esse comando compila a aplicação (`npm run build`) e envia os arquivos prontos da pasta `dist` para a branch `gh-pages`.
