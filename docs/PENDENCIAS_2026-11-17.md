# Pendências — reconciliação em 17/11/2026

**Base:** `PENDENCIAS_2026-11-04.md` (commit auditado `835b60d`) comparada com o código em `design/investigacao-confronto-desfechos` após os commits de 05–06/11 e os desta data.
**Como foi verificado:** `npm test` em Chromium headless — **8 arquivos, 186 verificações, 0 falhas**. Itens marcados "não reverificado" não foram relidos no código nesta data.

## 1. Resolvidas (com o teste que as cobre)

| ID | O que mudou | Evidência |
|---|---|---|
| SAVE-001, 002, 003, 005, TEST-006 | Save inválido (itens, cena, versão, JSON, nulo) é recusado com aviso e **não é apagado**; índices são limitados | `tests/save-integrity.cjs` (40) |
| SAVE-007 | "Começar" com save existente pede confirmação | `app.js` (`startNewGame`), citado em `save-integrity.cjs` |
| SAVE-008 (D-01a) | Derrota volta ao checkpoint da cena 8 (pistas e itens mantidos); fuga e vitória apagam o save | `tests/checkpoint.cjs` (16) |
| TEST-005 | Reinício após vitória, fuga, derrota e pelo menu zera estado | `tests/restart.cjs` (26) |
| SAVE-006 / ARQ-002 | `restoreSave` único (`restore-fix.js`); a cópia morta de `app.js`, que apagava o save em silêncio, foi removida | commit `1c86ad6` |
| NAR-004 / TEST-003 | Validador de grafo: destinos, auto-referência, alcançabilidade, ciclos, becos sem saída; rejeita o roteiro no carregamento | `roteiro-graph.js`, `tests/graph.cjs` (11) |
| TEST-001 / TEST-002 | `npm test` versionado no repositório | `package.json`, `tests/run-all.cjs` |
| INV-001 | Hipóteses do caderno só aparecem com a evidência-base e mostram base, limite e confronto | `tests/confronto.cjs` |
| CON-001 (D-04a) | Escolha da cena 8 **informa** requisitos (✓/✗ com texto) e risco; não bloqueia | `tests/confronto.cjs` |
| NAR-001 (D-02) | Plano sem requisitos vai direto à derrota, com o que faltou; não narra a execução como sucesso. Textos das cenas 9–11 intactos | `tests/confronto.cjs` |
| TEST (matriz) | 11 casos de confronto percorridos pelo fluxo real até o final | `tests/confronto.cjs` |

Efeito colateral corrigido junto: os itens da cena 8 só eram coletáveis antes da escolha; sem volta, mostrar requisitos seria inútil. Agora **Esc** / "Procurar mais no acampamento" retoma a exploração e **Enter** reabre a decisão.

## 2. Abertas — dependem de decisão do autor

| ID | Questão | Opções |
|---|---|---|
| D-05 / NAR-002 | A frase "Onde existe um… existem outros." aparece no evento da cena 14 (`roteiro.json:394`) e de novo em `showEnding()` (`app.js:585`) | manter uma, as duas ou nenhuma |
| D-06 / NAR-006 | Final "criatura neutralizada" (GDD B.5) não existe | descartar ou escrever |
| D-07 / UI-001 | Três nomes em uso: "Sons da Noite" (`<title>`), "Sobrenatural: O Mapinguari" (README, GDD), "Herança Maldita" (projeto) | escolher um e padronizar |
| D-08 / INV-002 | Pista `fur` (pelos) é coletável e não entra em nenhuma regra | só registro ou efeito no confronto |
| D-09 / INV-004 | `weapon_and_rope` agrupa arma, munição e cordas | agrupado ou separado |
| D-10 / SAVE-004 | Saves v2 de usuários reais ainda existem? | aceitos hoje; migrar ou ignorar |
| D-11 / EXP-001 | Cenas 1–5 e 9–14 não têm mapa próprio | só fundo + pontos, mapa genérico ou mapas próprios |
| D-12 / CON-002 | Resultado parcial para as estratégias 1 e 2 | manter 3 resultados ou acrescentar fuga parcial |
| P-4 | Dificuldade só grava um rótulo no save, sem efeito no jogo | definir efeitos |
| UI-002 | Retratos de Lucas, José, Claudio e Mecânico não existem (há fallback textual) | criar arte ou remover referências |
| D-13 | Stack | manter JavaScript puro (recomendado) ou migrar |
| D-14 / DOC-002 | `docs/CLAUDE.MD` cita commit antigo e checkpoint | atualizar |

## 3. Abertas — técnicas

| ID | Pendência | Prioridade |
|---|---|---|
| TEST-007 | Versão publicada não verificada (URL protegida por login) | P1 |
| TEST-008 | Só Chromium headless; sem Firefox, Safari ou aparelho real | P2 |
| UI-004 | Acessibilidade não auditada: foco visível, contraste, leitor de tela. Teclado na escolha (1–3, Esc, Enter) está testado | P2 |
| UI-005 | Falhas ao *salvar* seguem só em `console.warn` (restauração já avisa) — não reverificado | P2 |
| INV-005 / INV-006 | Itens não são consumidos; `gameplay.js` mantém `discoveredItems` separado do estado de `investigation.js` | P2 |
| ARQ-001 / 003 | Estado global em `let` lido por vários scripts; regra de confronto dividida entre `app.js` e `investigation.js` | P2 |
| NAR-003 / 005 | Diálogos sem condição; navegação implícita pela ordem do array | P2 |
| EXP-004 | Código do mapa de teste (`SHOW_TEST_MAP = false`) ainda no `gameplay.js` | P3 |
| DOC-001 | `RELATORIO_PROGRAMACAO.md` seção 6 dizia que não havia teste automatizado — atualizado na seção 10 | fechada nesta data |

## 4. Limites desta reconciliação

- A decisão D-04 foi tomada como "informar, não bloquear", e D-02 como "resolver antes de narrar". São escolhas de implementação reversíveis; confirmar com o autor.
- Os arquivos `tests/` anteriores (checkpoint, restart, save-integrity, chase, intro, display) foram executados e passam, mas não foram relidos linha a linha.
- Nada foi verificado em aparelho real nem na versão publicada.


## 5. Atualização técnica — branch `fix/recovery-prototype20-integration`

- **UI-005 (feedback de salvamento):** implementação adicionada em `app.js`, `index.html` e `style.css`. Falhas ao gravar o save agora exibem um aviso persistente, acessível por `role="status"` e `aria-live="polite"`; um salvamento posterior bem-sucedido remove o aviso.
- **Regressão:** criado `tests/save-feedback.cjs`, cobrindo falha simulada de quota, conteúdo do aviso, acessibilidade e recuperação após novo salvamento.
- **Validação:** o teste foi adicionado ao fluxo automático porque `tests/run-all.cjs` descobre arquivos `.cjs` automaticamente. A execução real ainda está pendente: este ambiente não conseguiu clonar o repositório para instalar Playwright/Chromium. Não declarar a suíte aprovada até executar `npm test` em ambiente com as dependências instaladas.
