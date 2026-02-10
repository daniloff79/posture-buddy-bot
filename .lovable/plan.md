

## Migrar para Capacitor com Notificacoes Nativas

### O que vai mudar

O app vai deixar de depender de notificacoes do navegador (que sao instáveis em segundo plano) e passara a usar notificacoes locais nativas do Android, que funcionam de forma confiavel mesmo com o app fechado.

Tambem sera gerado um novo icone do app com o boneco de postura de costas, igual a ilustracao interna.

### Etapas

**1. Instalar dependencias do Capacitor**
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- `@capacitor/local-notifications` (plugin de notificacoes locais nativas)

**2. Criar arquivo de configuracao do Capacitor**
- `capacitor.config.ts` na raiz do projeto
- App ID: `app.lovable.a3ca81e5b32d4e9f90fe83ea2061697e`
- App name: `posture-buddy-bot`
- Server URL apontando para o preview do Lovable (hot-reload durante desenvolvimento)

**3. Reescrever o hook de notificacoes**
- Substituir a Notification API do navegador pelo plugin `@capacitor/local-notifications`
- Agendar 2 notificacoes com `LocalNotifications.schedule()` usando horarios exatos (o Android garante o disparo)
- Manter a logica de sorteio de horarios aleatorios entre 10h-22h (Brasilia)
- Persistir os horarios em `localStorage` para exibir na interface

**4. Atualizar a interface (PostureCard)**
- Remover logica de permissao do navegador e prompt de instalacao PWA
- Usar `LocalNotifications.requestPermissions()` do Capacitor
- Manter botoes de ativar/desativar, sortear novos horarios e testar

**5. Gerar icone do app (boneco de costas)**
- Usar IA para gerar uma imagem do boneco de postura visto de costas, com coluna reta, em fundo verde
- Salvar como `public/icons/icon-192.png` e `public/icons/icon-512.png`
- Esses icones serao usados tanto no app quanto nas notificacoes

**6. Limpar configuracao PWA**
- Remover `vite-plugin-pwa` e `public/sw.js` (nao serao mais necessarios)
- Manter `manifest.json` por compatibilidade

---

### Como testar no seu celular

Apos a implementacao, voce precisara:

1. Exportar o projeto para o GitHub (botao "Export to GitHub" no Lovable)
2. Clonar o repositorio no computador (`git clone ...`)
3. Rodar `npm install`
4. Rodar `npx cap add android`
5. Rodar `npm run build && npx cap sync`
6. Conectar o celular via USB (com Depuracao USB ativada)
7. Rodar `npx cap run android`

Voce precisara do Android Studio instalado (pode ser a versao minima, sem emulador -- ~3 GB).

---

### Detalhes tecnicos

- **Plugin**: `@capacitor/local-notifications` agenda notificacoes no sistema Android nativo, que dispara mesmo com o app encerrado
- **Permissoes**: Android 13+ exige permissao explicita para notificacoes; o plugin cuida disso
- **Reagendamento**: Ao abrir o app, verifica se os horarios agendados ja passaram e gera novos automaticamente
- **Icone**: Sera gerado via IA com o prompt descrevendo o boneco de costas com coluna reta, estilo minimalista, fundo verde

