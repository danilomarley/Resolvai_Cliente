# ResolvAI · Guia visual do contratante

Implementação da [issue #31 — Definir style guide da tela do contratante](https://github.com/danilomarley/Resolvai_Cliente/issues/31), a partir do protótipo do dashboard e da paleta enviada durante a revisão.

## Identidade e cores

O azul inferior da referência é a cor primária; o azul escuro é a cor de texto; o laranja é a secundária; o branco frio é o fundo. O azul escuro `#0F1C2E` e o laranja `#FF5C1A` foram confirmados no SVG original da marca e no HTML de referência. O azul primário e o fundo permanecem aproximações da paleta enviada. Os tokens estão centralizados em [`src/styles/variables.css`](../src/styles/variables.css).

| Token                                      | Cor                   | Uso                                                  |
| ------------------------------------------ | --------------------- | ---------------------------------------------------- |
| `--color-primary`                          | `#14478B`             | Ações principais, navegação selecionada e links      |
| `--color-primary-hover`                    | `#103970`             | Hover das ações principais                           |
| `--color-primary-soft`                     | `#EDF3FB`             | Fundo de ícones e destaques discretos                |
| `--color-text`                             | `#0F1C2E`             | Texto principal, fundo da navegação e base do banner |
| `--color-secondary`                        | `#FF5C1A`             | Acentos de marca, detalhes e ícones decorativos      |
| `--color-secondary-soft`                   | `#FFF0E8`             | Superfícies de destaque secundário                   |
| `--color-background`                       | `#F5F8FC`             | Fundo geral, branco frio da referência               |
| `--color-surface`                          | `#FFFFFF`             | Cartões, cabeçalho e diálogos                        |
| `--color-muted`                            | `#5C6D84`             | Descrições e texto de apoio                          |
| `--color-border`                           | `#E7ECF3`             | Divisórias e bordas leves                            |
| `--color-success` / `--color-success-soft` | `#08775E` / `#E9F7F0` | Serviço em andamento e confirmação                   |
| `--color-warning` / `--color-warning-soft` | `#95620B` / `#FFF6E3` | Aguardando propostas                                 |
| `--color-danger`                           | `#C33D4D`             | Erros e ações destrutivas futuras                    |

O laranja identifica a marca; não deve ser usado como texto pequeno sobre fundo branco. Para status, usar as cores semânticas acompanhadas de rótulo. No banner escuro, o botão usa a variação azul `#1B57A7` para destacar a ação. As ilustrações podem usar tonalidades derivadas do azul.

## Tipografia

A barra lateral renderiza diretamente o conteúdo de `public/brand/resolvai-original.svg`, sem modificar seus traçados, composição, slogan ou proporções. A fonte Alexandria regular é carregada localmente por `@fontsource/alexandria` para o texto do slogan dentro do SVG. A imagem é inserida como SVG inline para compartilhar essa fonte com a página; não separar ou recriar o slogan em HTML.

O slogan “Conectando quem precisa a quem resolve” aparece no rodapé. O HTML `VisualizacaoPrototipo/index.html` e a página vinculada `cliente-web.html` orientam a estrutura e a linguagem do contratante. O histórico é identificado explicitamente por “Serviços concluídos”, com a descrição “Serviços finalizados, valores e avaliações”.

**Rajdhani** nos títulos e indicadores numéricos (pesos 600 e 700). **Inter** nos textos, navegação, botões, formulários e metadados (pesos 400, 500, 600 e 700), substituindo Georgia. As fontes são distribuídas localmente por `@fontsource`, com subconjunto latino e `font-display: swap`. Os tokens `--font-main` e `--font-secondary` definem, respectivamente, a fonte de títulos e a de leitura.

| Elemento                       | Escala              | Peso    |
| ------------------------------ | ------------------- | ------- |
| Saudação / título da página    | 32–35 px            | 700     |
| Título do banner               | 30–39 px            | 600     |
| Indicadores numéricos          | 32–37 px            | 600     |
| Títulos de seção               | 19–20 px            | 600     |
| Corpo, navegação e formulários | 14–16 px            | 400–500 |
| Botão principal                | 15 px               | 600     |
| Texto auxiliar e metadados     | 12–13 px            | 500–600 |
| Rótulos de navegação e marca   | 12 px, caixa alta | 600     |

Priorizar frases curtas, acentuação correta e linguagem direta. Usar `pt-BR` na página, vírgula decimal e formatação monetária brasileira. Metadados pequenos não devem conter instruções essenciais.

## Espaçamento e superfícies

- Escala base: 4, 8, 16 e 32 px, disponível nos tokens `--spacing-*`.
- Conteúdo com margens de 38 px no desktop, 22–26 px no tablet e 16–20 px no celular.
- Cartões separados por 17–24 px, com preenchimento de 16–24 px.
- Raios: 8 px para controles, 12 px para painéis e 20 px para o banner.
- Superfícies brancas com borda leve; sombras discretas. Diálogos recebem sombra mais forte e fundo escurecido.
- Ícones vetoriais de traço uniforme, com nomes acessíveis nos botões que não têm texto. Ilustração da casa e ícones decorativos ficam ocultos para leitores de tela.

## Componentes e comportamento

### Botões

- **Primário:** azul com texto branco. Uma ação principal por contexto, como criar um pedido ou consultar propostas.
- **Secundário:** branco, borda suave e texto azul escuro. Usado para acompanhar um pedido.
- **Texto:** azul, sem superfície; indicado para histórico, ajuda e ações complementares.
- **Ícone:** área de 40 × 40 px, com `aria-label`; usado para notificações, menu e fechamento.
- Altura padrão de 44 px; ações compactas de 33–36 px.
- Hover de 160 ms, foco visível com contorno de 3 px e estado desabilitado com opacidade reduzida. Preferência por movimento reduzido é respeitada.

### Navegação

Barra lateral escura com item selecionado em azul. Separar navegação principal de gerenciamento. O cartão da conta fica sempre visível no rodapé e é o único acesso ao perfil na barra lateral. Não adicionar um item “Meu perfil” redundante. Manter a logo fixa no topo e a ajuda como um botão compacto acima do perfil; não usar os antigos cartões “Meu espaço” e “Conte com a gente”. O menu cabe sem rolagem nas resoluções comuns; somente a lista de navegação pode rolar em alturas muito pequenas, com uma barra discreta. No celular, abrir o menu por botão; permitir fechamento por Escape e manter a navegação por Tab dentro dele.

### Indicadores

Quatro cartões: pedidos ativos, propostas recebidas, serviços concluídos e avaliação. Número em destaque, rótulo legível e contexto curto. Cada cartão abre a informação correspondente. Totais de pedidos e propostas derivam dos dados da sessão.

### Pedidos e serviços

Substituir a tabela densa por cartões com categoria, título, localização, status textual e ação. Filtros: Todos, Aguardando propostas e Em andamento. Busca por título ou categoria, com estado vazio e opção de limpar filtros. As abas aceitam setas, Home e End.

Serviços concluídos exibem somente as informações fornecidas pela API.

### Formulários e diálogos

Usar `dialog` nativo, nome acessível, fechamento por Escape e retorno do foco ao controle de origem. Inputs com rótulos, campos obrigatórios e limite de caracteres. Formulários e mensagens apresentam retorno visual das ações.

### Criação de pedido

Usar um formulário vazio com rótulos, campos obrigatórios e limites de caracteres. A publicação envia os dados à API. Durante o envio, impedir alterações e submissões repetidas. Em caso de falha, manter o preenchimento e exibir a mensagem.

## Responsividade

| Largura          | Comportamento                                                            |
| ---------------- | ------------------------------------------------------------------------ |
| Acima de 1050 px | Barra lateral fixa, quatro indicadores, pedidos e histórico lado a lado  |
| 761–1050 px      | Barra lateral compacta, dois indicadores por linha e painéis empilhados  |
| Até 760 px       | Menu recolhível, margens reduzidas e busca compacta                      |
| Até 560 px       | Status abaixo do título, ilustração discreta e diálogos adaptados à tela |

Validado sem rolagem horizontal em 320, 375, 390, 560, 760, 768, 1024, 1280, 1440 e 1920 px.

## Organização e validação

Os estilos globais ficam em `src/styles/`. O formulário usa `src/components/OrderForm.css`, e a lista de pedidos usa `src/pages/MyOrders.css`. Os componentes consultam os serviços em `src/services/`, e os tipos ficam em `src/types/`.

Validar alterações com lint, testes e build. A verificação das jornadas de autenticação, cadastro e publicação depende de uma API real disponível.
