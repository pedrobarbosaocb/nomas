# 🏠 Nomas

Uma aplicação web minimalista para avaliar apartamentos com interface estilo Tinder. Organize seus favoritos, descarte opções e visualize todas as suas avaliações em um só lugar.

## ✨ Funcionalidades

- **Tela de Listagem**: Visualize todos os apartamentos em um grid responsivo com filtros por status
- **Tela Tinder**: Avalie apartamentos um a um com like/dislike
- **Persistência de Dados**: Suas avaliações são salvas automaticamente no navegador
- **Filtros Inteligentes**: Organize por "Gostei", "Não gostei" ou "Não avaliado"
- **Design Minimalista**: Interface limpa e intuitiva com paleta neutra
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

## 🚀 Como Executar

### Pré-requisitos

Você precisa ter instalado:
- **Node.js** (versão 16 ou superior) - [Download aqui](https://nodejs.org/)
- **pnpm** (gerenciador de pacotes) - [Instruções de instalação](https://pnpm.io/installation)

Se você não tem `pnpm` instalado, pode instalar globalmente com:
```bash
npm install -g pnpm
```

### Passo 1: Descompactar o Projeto

Descompacte o arquivo `apartment-tinder.zip` em uma pasta de sua escolha:

```bash
unzip apartment-tinder.zip
cd apartment-tinder
```

### Passo 2: Instalar Dependências

Na pasta raiz do projeto, execute:

```bash
pnpm install
```

Este comando vai instalar todas as dependências necessárias (React, Tailwind CSS, etc).

### Passo 3: Iniciar o Servidor de Desenvolvimento

Para rodar a aplicação em modo desenvolvimento:

```bash
pnpm dev
```

Você verá uma mensagem como:
```
➜  Local:   http://localhost:3000/
➜  Network: http://169.254.0.21:3000/
```

### Passo 4: Abrir no Navegador

Abra seu navegador e acesse:
```
http://localhost:3000
```

Pronto! A aplicação está rodando. 🎉

## 📝 Como Usar a Aplicação

### Tela de Listagem

1. Clique na aba **"Listagem"** no topo
2. Veja todos os apartamentos em um grid
3. Use os filtros para organizar:
   - **Todos**: Mostra todos os apartamentos
   - **Gostei**: Apenas os que você marcou como favorito
   - **Não gostei**: Apenas os que você descartou
   - **Não avaliado**: Ainda não avaliou

4. Para cada apartamento, você pode:
   - Clicar em **"Gostei"** para marcar como favorito
   - Clicar em **"Não gostei"** para descartar
   - Clicar no ícone de link para abrir o anúncio original

### Tela Avaliar (Tinder)

1. Clique na aba **"Avaliar"** no topo
2. Você verá um apartamento por vez
3. Escolha:
   - **Gostei**: Marca como favorito e avança para o próximo
   - **Não gostei**: Descarta e avança para o próximo
4. Use as setas laterais para navegar entre apartamentos
5. A barra de progresso mostra seu avanço

## 📊 Seus Dados

Todas as suas avaliações (likes e dislikes) são **salvas automaticamente** no seu navegador usando localStorage. Isso significa:

- ✅ Seus dados persistem mesmo após fechar o navegador
- ✅ Nenhum dado é enviado para servidores
- ✅ Seus dados ficam privados no seu computador

Se você quiser limpar suas avaliações, abra o console do navegador (F12) e execute:
```javascript
localStorage.removeItem('apartmentRatings')
```

## 🔄 Como Adicionar Seus Dados

O arquivo `client/src/data/apartments.json` contém os dados dos apartamentos. Para usar seus próprios dados:

1. Abra o arquivo `client/src/data/apartments.json`
2. Substitua o conteúdo mantendo a mesma estrutura:

```json
[
  {
    "id": "1",
    "source": "Kijiji",
    "title": "Nome do apartamento",
    "price": "$1,850.00",
    "location": "Localização",
    "description": "Descrição detalhada",
    "link": "https://link-do-anuncio.com"
  },
  {
    "id": "2",
    "source": "Facebook Marketplace",
    "title": "Outro apartamento",
    "price": "$2,000.00",
    "location": "Outra localização",
    "description": "Outra descrição",
    "link": "https://outro-link.com"
  }
]
```

3. Salve o arquivo
4. A aplicação vai recarregar automaticamente com seus novos dados

**Importante**: Cada apartamento precisa ter um `id` único (pode ser um número ou string).

## 🛠️ Comandos Disponíveis

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Fazer build para produção
pnpm build

# Pré-visualizar build de produção
pnpm preview

# Verificar erros TypeScript
pnpm check

# Formatar código
pnpm format
```

## 🎨 Personalização

### Cores

As cores estão definidas em `client/src/index.css`. Você pode modificar:

- **Verde (Like)**: `oklch(0.55 0.15 142.5)` - Mude para sua cor preferida
- **Vermelho (Dislike)**: `oklch(0.55 0.15 12)` - Customize conforme necessário
- **Fundo**: `oklch(1 0 0)` - Branco puro
- **Texto**: `oklch(0.1 0 0)` - Preto muito escuro

### Fontes

As fontes estão em `client/index.html`:

- **Títulos**: Poppins (font-weight: 600)
- **Corpo**: Inter (font-weight: 400)

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Desktop**: Grid com 2 colunas
- **Tablet**: Grid com 2 colunas (ajustado)
- **Mobile**: Grid com 1 coluna

## 🐛 Troubleshooting

### A porta 3000 já está em uso

Se receber erro que a porta 3000 está em uso, você pode especificar outra porta:

```bash
PORT=3001 pnpm dev
```

### Dependências não instaladas corretamente

Tente limpar o cache e reinstalar:

```bash
pnpm store prune
pnpm install
```

### Mudanças não aparecem no navegador

Limpe o cache do navegador (Ctrl+Shift+Delete) ou abra em modo anônimo.

## 📂 Estrutura do Projeto

```
apartment-tinder/
├── client/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas (Listagem, Tinder)
│   │   ├── hooks/           # Custom hooks
│   │   ├── data/            # Dados JSON
│   │   ├── App.tsx          # Componente principal
│   │   └── index.css        # Estilos globais
│   ├── index.html           # HTML principal
│   └── public/              # Arquivos estáticos
├── package.json             # Dependências
├── vite.config.ts          # Configuração Vite
└── README.md               # Este arquivo
```

## 🚀 Deploy

Para fazer deploy da aplicação em produção:

1. Faça o build:
```bash
pnpm build
```

2. A pasta `dist/` terá os arquivos prontos para deploy

3. Você pode fazer deploy em plataformas como:
   - Vercel
   - Netlify
   - GitHub Pages
   - Seu próprio servidor

## 📝 Notas Importantes

- **Dados Locais**: Todos os dados ficam no seu navegador, nada é enviado para servidores
- **Privacidade**: Suas avaliações são 100% privadas
- **Sem Conexão**: A aplicação funciona completamente offline após carregada
- **Compatibilidade**: Funciona em todos os navegadores modernos (Chrome, Firefox, Safari, Edge)

## 💡 Dicas

- Use a tela "Avaliar" para avaliar rapidamente muitos apartamentos
- Use a tela "Listagem" para revisar suas avaliações
- Filtre por "Gostei" para ver apenas seus favoritos
- Clique no link do anúncio para ver mais detalhes no site original

## 📞 Suporte

Se encontrar problemas:

1. Verifique se tem Node.js e pnpm instalados corretamente
2. Tente deletar a pasta `node_modules` e reinstalar com `pnpm install`
3. Limpe o cache do navegador
4. Tente em outro navegador

## 📄 Licença

Este projeto é fornecido como está para uso pessoal.

---

**Aproveite a busca por apartamentos! 🏠✨**