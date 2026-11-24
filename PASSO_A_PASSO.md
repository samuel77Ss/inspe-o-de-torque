# Baixa de Torque CWA 12 – como publicar (Firebase + GitHub Pages)

Este pacote tem duas partes que usam o mesmo banco de dados:

| Arquivo / pasta | Para quê |
|---|---|
| `index.html` | Sistema do **escritório** (PC): 3D, painel, lista, importação, relatório FP-69 |
| `campo.html` | **App de campo** (celular): instala na tela inicial e funciona sem sinal |
| `firebase-config.js` | Onde você cola a configuração do seu projeto Firebase |
| `sync.js`, `fb.js` | Ligação com o Firebase (não mexer) |
| `firestore.rules` | Regras de segurança do banco (colar no Console do Firebase) |

Enquanto o `firebase-config.js` estiver com `COLE_AQUI`, tudo roda em **modo demonstração**: as baixas ficam só no navegador.

---

## 1. Contas próprias do sistema
1. Crie um Gmail só para o sistema (ex.: `torque.cwa12@gmail.com`).
2. Com ele, crie uma conta no **GitHub** e entre no **Firebase** (console.firebase.google.com).

## 2. Projeto no Firebase
1. **Adicionar projeto** → nome `baixa-torque-cwa12` → pode desligar o Google Analytics.
2. **Authentication** → Começar → **E-mail/senha** → Ativar.
3. Aba **Usuários** → **Adicionar usuário**: um para cada inspetor e um para cada pessoa do escritório (e-mail + senha provisória). No primeiro acesso, cada pessoa digita o próprio nome.
4. **Firestore Database** → Criar banco → modo **produção** → local **southamerica-east1 (São Paulo)**.
5. Firestore → aba **Regras** → apague o que estiver lá, cole todo o conteúdo de `firestore.rules` → **Publicar**.

## 3. Administradores (escritório)
Administrador pode desfazer baixa de qualquer pessoa e alterar a lista de torquímetros.
1. Em **Authentication → Usuários**, copie o **UID** da pessoa.
2. Em **Firestore → Iniciar coleção** → ID da coleção `admins` → ID do documento = o UID copiado → campo `nome` (string) com o nome da pessoa → Salvar.
3. Repita para cada pessoa do escritório.

## 4. Configuração do app
1. Firebase → ⚙️ **Configurações do projeto** → **Seus apps** → ícone **Web `</>`** → apelido `torque` → Registrar (não precisa de Hosting).
2. Copie os valores de `firebaseConfig` (apiKey, authDomain, projectId…) para o arquivo `firebase-config.js`, no lugar de `COLE_AQUI` e das aspas vazias.

## 5. Publicar no GitHub Pages
1. GitHub → **New repository** → nome `baixa-torque` → Public → Create.
2. **Add file → Upload files** → arraste **todo o conteúdo desta pasta** (são só arquivos, sem subpasta) → Commit.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save. Em 1–2 minutos aparece o link.
4. Volte ao Firebase → **Authentication → Configurações → Domínios autorizados** → adicionar `SEU-USUARIO.github.io`.

Links finais:
- Escritório: `https://SEU-USUARIO.github.io/baixa-torque/`
- Campo: `https://SEU-USUARIO.github.io/baixa-torque/campo.html`

## 6. Instalar no celular do inspetor
- **Android (Chrome):** abrir o link do campo → menu ⋮ → **Instalar app** (ou *Adicionar à tela inicial*).
- **iPhone (Safari):** abrir o link → botão Compartilhar → **Adicionar à Tela de Início**.
- O **primeiro acesso precisa de internet** (login e download das juntas). Depois o app abre e registra baixas **sem sinal**. O botão no canto superior mostra *Offline · N a enviar* e envia sozinho quando o sinal voltar.

## 7. Como os dados andam
- Baixa feita no celular aparece no escritório em segundos (painel, lista, 3D e relatório).
- Baixa feita no escritório aparece no celular.
- Toda baixa e todo "desfazer" ficam gravados na coleção `historico` (quem, quando, de onde). O histórico não pode ser apagado.
- Na primeira vez que o escritório entra, as baixas que já estavam salvas naquele computador sobem para a nuvem.
- Importar a planilha de mapeamento (colunas STATUS = Inspecionado) continua funcionando e também envia para a nuvem.

## 8. Atualizações
Quando vier versão nova, substitua os arquivos no GitHub (Upload files, mesmo nome). **Não substitua o `firebase-config.js`** se ele já estiver preenchido.

## Observações
- O plano gratuito do Firebase (Spark) aguenta 50 mil leituras e 20 mil gravações por dia. Cada abertura completa do sistema lê as baixas existentes; com muitos inspetores abrindo o app várias vezes ao dia, pode valer ativar o plano Blaze (paga só o que passar do gratuito, centavos).
- O link do GitHub Pages é público. As **baixas e o histórico** só aparecem para quem tem usuário e senha, mas o **mapeamento das juntas e o modelo 3D** vão dentro dos próprios arquivos do site: quem tiver o link consegue baixá-los. Se isso for problema para o cliente, dá para passar o mapeamento para dentro do banco (protegido por login) numa próxima versão.
