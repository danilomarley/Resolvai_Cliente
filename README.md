# ResolvAI — Portal do contratante

Dashboard responsivo em React, TypeScript e Vite, baseado no protótipo do contratante. Usa Rajdhani e a paleta de azul, azul escuro, laranja e branco frio.

## Executar

Requer Node.js 20.19+ ou 22.12+ e npm.

```sh
npm ci
npm run dev
```

Abra o endereço local exibido pelo Vite.

## Verificar

```sh
npm run lint
npm run build
npm run preview
```

## Guia visual

Consulte [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) para cores, tipografia, botões, componentes, acessibilidade e regras responsivas da [issue #31](https://github.com/danilomarley/Resolvai_Cliente/issues/31).

- `src/styles/variables.css`: tokens de identidade visual.
- `src/styles/global.css`: estilos e adaptações responsivas.
- `src/components/`: ícones, ilustração e diálogo acessível.
- `src/data/dashboard.ts`: dados de demonstração.
- `src/App.tsx`: dashboard e interações da sessão.

## Funcionalidades da demonstração

Busca e filtros de pedidos, criação de um novo pedido, consulta de propostas, acompanhamento de serviço, histórico, notificações, edição de perfil, conversa local e central de ajuda.

Os dados são ilustrativos e as alterações são descartadas ao recarregar. O projeto ainda não se conecta a backend, autenticação, IA, pagamentos ou envio de mensagens a profissionais. A fonte Rajdhani é servida localmente, sem depender do Google Fonts.
