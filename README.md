# Filtro de puzzles do Lichess

Aplicação para montar uma lista de treino a partir do banco de puzzles do [Lichess](https://lichess.org). O arquivo CSV fica no seu computador. O filtro roda no navegador, sem conta e sem backend. A lista, os filtros, os puzzles já feitos e a meta do dia ficam gravados só no seu navegador.

Versão publicada: [filters-puzzles-lichess.vercel.app](https://filters-puzzles-lichess.vercel.app/)

Cada puzzle da lista abre em `https://lichess.org/training/{id}`.

## Capturas

<img width="546" height="1009" alt="5" src="https://github.com/user-attachments/assets/93ecb3d9-eee1-4894-ab46-79d503619b24" />
<img width="520" height="989" alt="4" src="https://github.com/user-attachments/assets/a14c3597-f77d-43cc-a839-d65ff7d2ad42" />
<img width="1492" height="1025" alt="3" src="https://github.com/user-attachments/assets/3ce894dc-e9cc-4da2-a9a0-45c2176110f8" />
<img width="1309" height="1029" alt="2" src="https://github.com/user-attachments/assets/e09d7c4d-961b-4115-bab1-8845f1027f42" />
<img width="1279" height="1026" alt="1" src="https://github.com/user-attachments/assets/799e8258-ab38-422f-bd41-7bd5cd0a10b4" />


## O que dá para fazer

- Escolher o CSV do Lichess e filtrar por tema, lances, rating e popularidade.
- Guardar uma lista de até 10.000 puzzles, em ordem aleatória ou na ordem do arquivo.
- Ver uma miniatura da posição, o rating colorido, o id e a popularidade.
- Marcar puzzles como feitos, copiar os links dos pendentes e acompanhar uma meta diária com sequência.
- Ordenar a lista por rating, popularidade, id, lances ou partidas.
- Alternar tema claro e escuro. No celular, recolher os cards de filtros e da lista.

## Requisitos

- [Node.js](https://nodejs.org) 20.19 ou mais recente, ou 22.12 ou mais recente.
- Um navegador atual com Chromium (Chrome ou Edge) ou Firefox. A cópia do CSV usa a [Origin Private File System](https://developer.mozilla.org/docs/Web/API/File_System_API/Origin_private_file_system), disponível nesses navegadores.
- O CSV descompactado dos puzzles. O arquivo `.zst` não é aceito.

## Como rodar

Na pasta do projeto:

```bash
npm install
npm run dev
```

O Vite mostra o endereço local, em geral `http://127.0.0.1:5173`. Se a porta estiver ocupada, ele escolhe a seguinte.

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento com recarga ao salvar. |
| `npm run build` | Confere os tipos (`tsc -b`) e gera a pasta `dist`. |
| `npm run preview` | Serve a pasta `dist` para ver o build. |
| `npm run lint` | Roda o [Oxlint](https://oxc.rs) com as regras de React e TypeScript de `.oxlintrc.json`. |

Não há testes automatizados.

## De onde vem o CSV

O banco oficial está em [database.lichess.org/#puzzles](https://database.lichess.org/#puzzles). O arquivo costuma se chamar `lichess_db_puzzle.csv.zst` e tem centenas de megabytes depois de descompactar.

1. Baixe o `.zst`.
2. Descompacte até obter um `.csv`. No Windows, [7-Zip](https://www.7-zip.org) ou `zstd -d lichess_db_puzzle.csv.zst` servem.
3. Na aplicação, em **Filtros → 1. Arquivo CSV**, escolha esse `.csv`.

A leitura é em fluxo: o arquivo não é carregado inteiro na memória de uma vez. O progresso aparece a cada cerca de 4 MB lidos. Linhas com menos de 8 colunas são ignoradas. A primeira linha, que começa com `PuzzleId`, é o cabeçalho e também é ignorada.

Se o nome terminar em `.zst`, a escolha é recusada e o campo de arquivo é limpo.

### Colunas usadas

O Lichess separa os campos por vírgula. O FEN não contém vírgulas, então `split(',')` é suficiente.

| Índice | Coluna | Uso |
| --- | --- | --- |
| 0 | `PuzzleId` | Id do puzzle e link de treino. |
| 1 | `FEN` | Posição desenhada na miniatura. É a posição **antes** do lance inicial do adversário. |
| 2 | `Moves` | Lances em UCI, separados por espaço. A quantidade de lances do jogador é o número de lances dividido por 2, porque o primeiro lance é a jogada de preparação do adversário. |
| 3 | `Rating` | Rating do puzzle. |
| 4 | `RatingDeviation` | Não é usada. |
| 5 | `Popularity` | Popularidade, de −100 a 100. |
| 6 | `NbPlays` | Quantidade de partidas em que o puzzle foi jogado. |
| 7 | `Themes` | Temas separados por espaço, por exemplo `fork middlegame short`. |
| 8+ | `GameUrl`, aberturas | Não são usadas. |

## Como usar

1. Escolha o CSV. O navegador guarda uma cópia para a próxima visita. O aviso passa a dizer que o arquivo está salvo neste navegador. Se não houver espaço, o arquivo vale só na visita atual e a mensagem avisa.
2. Escolha os temas, os lances, o rating, a popularidade, a quantidade e o modo de seleção.
3. Toque em **Filtrar**. A lista nova substitui a anterior. Os puzzles marcados como feitos continuam marcados.
4. Abra um puzzle pelo rating. A miniatura mostra a posição do CSV. **Brancas embaixo** / **Pretas embaixo** vira o tabuleiro da lista inteira.
5. Marque o checkbox quando terminar o puzzle. **Copiar pendentes** coloca no clipboard um link por linha, só dos que ainda não estão feitos. **Limpar feitos** apaga todas as marcações de uma vez.

No celular, abaixo de 960 px, **Filtros** fica acima de **Minha lista**. Os dois cards abrem e fecham pelo título. No desktop, os filtros ficam à esquerda, grudados na rolagem, e a lista à direita. Os dois permanecem abertos.

## Filtros

Os valores iniciais estão em `DEFAULT_FILTERS`, em `src/types.ts`.

| Controle | Padrão | Intervalo | Passo da faixa |
| --- | --- | --- | --- |
| Temas | `fork` (Garfo) | 73 temas oficiais, em 9 grupos | — |
| Outros temas | vazio | chaves separadas por espaço | — |
| Combinar temas | Todos (E) | Todos (E) ou Qualquer (OU) | — |
| Lances | 1–10 | 1 a 10 lances do jogador | 1 |
| Rating | 0–4000 | 0 a 4000 | 50 |
| Popularidade | −100–100 | −100 a 100 | 5 |
| Máx. de puzzles | 500 | 1 a 10.000 | — |
| Seleção | Aleatórios | Aleatórios ou Primeiros do arquivo | — |
| Ordenar por | Rating | Rating, Popularidade, Id, Lances, Partidas | — |
| Ordem | Crescente | Crescente ou Decrescente | — |
| Pular feitos | ligado | — | — |

**Limpar filtros** devolve temas, o campo extra, o modo de combinação, lances, rating e popularidade ao padrão. Não apaga o CSV, a quantidade, a seleção, a ordenação, a opção de pular feitos, a lista nem as marcações.

### Temas

O seletor é uma busca com grupos, não uma lista de checkboxes. Os nomes em português acompanham os temas oficiais do Lichess. A chave em inglês aparece à direita de cada opção e é o valor que existe no CSV.

Grupos em `src/themes.ts`:

- Fases
- Motivos táticos
- Avançado
- Xeque-mates
- Temas de mate
- Movimentos especiais
- Objetivos
- Distância
- Origem

**Todos (E)** exige que o puzzle tenha todos os temas escolhidos. **Qualquer (OU)** aceita o puzzle se ele tiver pelo menos um. O campo **Outros temas** entra na mesma lista: escreva chaves oficiais separadas por espaço, como `mateIn3 crushing`, quando quiser um tema que não está no seletor ou quer montar a combinação na mão.

Sem nenhum tema, o filtro aceita qualquer tema. O padrão já vem com `fork`.

### Lances, rating e popularidade

Cada um é uma faixa com dois controles. O texto embaixo mostra o intervalo, por exemplo `1 – 10`. Um controle não cruza o outro: ao encostar, empurra o par.

Lances conta só os lances de quem resolve. Um puzzle cujo campo `Moves` tem dois lances (`lanceDoAdversario lanceDoJogador`) vale 1. O máximo da faixa é 10. Puzzles mais longos ficam de fora quando o controle da direita está em 10.

A faixa de lances abre em `1 – 10`. Quem já tinha o padrão antigo `1 – 1` gravado recebe `1 – 10` na primeira abertura depois dessa mudança. Uma escolha posterior de exatamente 1 lance continua gravada.

Rating e popularidade começam no intervalo inteiro, então não cortam nada até você estreitar.

### Quantidade e seleção

**Aleatórios** usa amostragem de reservatório: cada puzzle que passa no filtro tem a mesma chance de entrar, mesmo que o arquivo tenha milhões de linhas e o limite seja 500.

**Primeiros do arquivo** guarda as primeiras linhas que passam no filtro, até o limite.

O limite digitado é apertado entre 1 e 10.000. Vazio ou inválido vira 500.

**Pular puzzles que já marquei como feitos** tira da lista nova os ids que já estão no conjunto de feitos. A lista que já está na tela não é refiltrada sozinha: é preciso tocar em **Filtrar** de novo.

Depois de montar a lista, ela é ordenada pelo critério atual de **Ordenar por** e **Ordem**.

## A lista

Cada linha mostra:

- checkbox de feito;
- miniatura 112×112, com peças Staunton;
- número na lista, rating, id e popularidade, quando esse número existe;
- lances ou partidas, só quando a ordenação ativa é uma dessas duas.

O rating usa quatro faixas:

| Rating | Faixa |
| --- | --- |
| até 1199 | baixa |
| 1200–1599 | média |
| 1600–1999 | alta |
| 2000 ou mais | topo, em negrito |

Um puzzle feito fica riscado e mais claro. Um pendente tem uma barra verde à esquerda.

Se o FEN não veio na lista (listas antigas, gravadas antes desse campo), a miniatura mostra “Posição indisponível”. Filtrar de novo preenche o FEN, os lances e as partidas. Enquanto esses números não existem, ordenar por lances ou partidas deixa essas linhas no fim e mostra “Lances indisponíveis” ou “Partidas indisponíveis”.

A lista longa é virtualizada com `@tanstack/react-virtual`: só as linhas visíveis, mais uma margem, entram no DOM.

### Ordenação

A troca de campo ou de direção reordena na hora e grava a lista. Os critérios:

- **Rating**, **Popularidade**, **Lances** e **Partidas**: número. Valores ausentes ficam no fim nas duas direções.
- **Id**: ordem de texto com números naturais (`pt-BR`).
- Empate: id, em ordem crescente.

Ao abrir a página, a lista aparece na ordem em que foi gravada. Ela não é reordenada de novo só porque o navegador recarregou.

**Mostrar** alterna entre todos e só pendentes. Em “só pendentes”, marcar um puzzle não o tira da tela na hora. A lista de pendentes é congelada até você mudar a vista ou gerar outra lista.

## Meta diária

No topo, **Meta** mostra `feitos hoje / quantidade`. O padrão é 5 puzzles. A quantidade aceita de 1 a 100.

A sequência sobe uma vez no dia em que a meta é alcançada. Se a meta de ontem também foi cumprida, a sequência continua. Se o dia anterior não foi cumprido, ela recomeça em 1. Desmarcar puzzles no mesmo dia não apaga a sequência. Abrir o app num dia seguinte sem ter cumprido a meta zera a sequência.

A meta do dia e a sequência não são apagadas por **Limpar feitos**. O contador do dia só muda quando um puzzle é marcado ou desmarcado, ou quando a quantidade da meta muda.

## O que fica salvo

Tudo fica neste navegador, neste endereço. Outro navegador, uma janela anônima ou outro `localhost` com porta diferente não enxerga esses dados. Nada é enviado a um servidor.

| Onde | Chave ou arquivo | Conteúdo |
| --- | --- | --- |
| `localStorage` | `pl_filtros` | Temas, lances, rating, popularidade, limite, seleção, ordenação e “pular feitos”. |
| `localStorage` | `pl_lista` | Lista versão 2: id, rating, FEN, popularidade, lances, partidas e o texto que descreve o filtro. Listas antigas no formato `id:rating` ainda abrem, sem FEN. |
| `localStorage` | `pl_feitos` | Ids marcados como feitos. |
| `localStorage` | `pl_dia` | Data, meta, ids do dia, sequência e o último dia em que a meta foi cumprida. |
| `localStorage` | `pl_tema` | `light` ou `dark`. |
| `localStorage` | `pl_csv_nome` | Nome original do CSV, para mostrar de novo. |
| `localStorage` | `pl_lances_faixa` | Marca de que o padrão antigo de 1 lance já foi atualizado para 1–10. |
| Origin Private File System | `puzzle.csv` | Cópia do CSV escolhido. |

Na primeira visita, se não houver tema gravado, o app olha `prefers-color-scheme` uma vez e grava claro ou escuro. Não existe opção “sistema” depois disso.

O que não volta ao recarregar:

- se os cards estavam recolhidos;
- se o tabuleiro estava virado;
- a vista “só pendentes”, que reabre em “todos”.

Trocar o CSV escolhido substitui a cópia guardada. Apagar os dados do site no navegador apaga a lista, os feitos, a meta e o arquivo.

## Aparência

O fundo é um verde de feltro com duas luzes suaves, uma verde e outra âmbar. Os cards são vidro fosco: translúcidos, com desfoque e um filete claro na borda. Quem pede menos transparência no sistema (`prefers-reduced-transparency`) recebe cards opacos. Quem pede menos movimento não recebe a transição dos botões nem da barra de progresso.

As casas do tabuleiro continuam sólidas, no marfim e no marrom clássicos, para as peças não se misturarem com o fundo. As peças são o desenho Staunton Cburnett, o mesmo família usada pelo Lichess. Peças brancas levam contorno escuro. No tema escuro, as pretas levam contorno claro.

O rei ao lado do título usa o dourado do tema com contorno preto.

## Estrutura

```text
docs/                   capturas usadas no README
index.html              página, idioma pt-BR
src/main.tsx            entrada do React
src/App.tsx             estado, gravação e meta do dia
src/components/
  AppHeader.tsx         título, meta, sequência e tema
  FilterPanel.tsx       CSV, temas e faixas; carregado sob demanda
  ThemePicker.tsx       busca de temas
  PuzzleList.tsx        lista virtualizada, ordenação e feitos
  MiniBoard.tsx         miniatura a partir do FEN, sem biblioteca de xadrez
  pieceGlyphs.tsx       SVG das seis peças
  DualRange.tsx         faixa com dois controles
src/filterCsv.ts        leitura em fluxo, filtro e amostragem
src/sortItems.ts        ordenação da lista
src/csvStore.ts         cópia do CSV no navegador
src/storage.ts          localStorage, meta e sequência
src/themes.ts           temas oficiais e o link de treino
src/ratingTone.ts       faixas de cor do rating
src/types.ts            tipos e valores padrão
src/index.css           tema, vidro, tabuleiro e layout
```

`FilterPanel` e, com ele, o seletor de temas são carregados com `React.lazy`. O painel de filtros mostra “Carregando filtros” enquanto o módulo não chega.

## Stack

- [Vite](https://vite.dev) 8
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org) 7, com `verbatimModuleSyntax`. Os imports locais usam o sufixo `.ts` ou `.tsx`.
- [Oxlint](https://oxc.rs)
- [@tanstack/react-virtual](https://tanstack.com/virtual) para a lista

Não há roteador, backend, banco nem conta de usuário.

## Créditos

- Puzzles, temas e o banco CSV são do [Lichess](https://lichess.org), sob as licenças publicadas em [database.lichess.org](https://database.lichess.org).
- O desenho das peças é o Staunton de Colin M. L. Burnett (Cburnett), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), o mesmo conjunto publicado pelo Lichess em `public/piece/cburnett`.

## Limitações

- O filtro não roda sozinho quando o banco do Lichess é atualizado. É preciso baixar o CSV novo, escolher o arquivo de novo e filtrar outra vez.
- A cópia do CSV pode falhar se o navegador não tiver cota suficiente. Nesse caso o arquivo só existe até fechar a aba.
- Listas gravadas antes do FEN, dos lances e das partidas não ganham esses campos até um filtro novo.
- A miniatura não anima os lances. Ela mostra só a posição inicial do CSV.
- Não há sincronização entre aparelhos.
