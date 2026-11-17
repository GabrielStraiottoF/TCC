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
| UI-005 | Aviso visual de falha ao *salvar* implementado nesta branch; aguarda execução do teste de regressão | P2 |
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
- **Validação:** incluído no fluxo automático. A execução real no Windows em 17/11/2026 passou: `save-feedback.cjs` — 7 aprovados, 0 reprovados. Resultado consolidado registrado na seção 8.


## 6. Reaproveitamento do protótipo 20 — primeira integração

- Criado `audio.js`, isolando o sintetizador procedural Web Audio do protótipo, sem dependência de arquivos externos.
- Integrados efeitos de passos, coleta, interação, salto, alerta da criatura e captura em `gameplay.js`.
- Adicionado botão para ligar/desligar os efeitos sonoros; a preferência é persistida em uma chave separada do save da partida.
- Criado `tests/audio.cjs` para verificar estado inicial, alternância, persistência e chamadas silenciosas quando o áudio está desligado.
- Criado `docs/PLANO_INTEGRACAO_PROTOTIPO20.md` com matriz de compatibilidade e limites de integração.
- **Validação:** a integração foi exercitada pela suíte `audio.cjs` no Windows em 17/11/2026: 5 aprovados, 0 reprovados. A cobertura continua limitada aos comportamentos explicitamente testados.


## 7. Ajuste do ambiente de testes após execução no Windows

- **Causa provável identificada:** os testes de navegador iniciavam o servidor estático com `spawn("python3", ...)`. Em instalações Windows nas quais o executável `python3` não está disponível no PATH, o processo não inicia; como sua saída era ignorada, todos os testes falhavam com a mesma mensagem genérica.
- **Correção:** criado `tests/http-server.js`, servidor HTTP estático implementado com APIs nativas do Node. Os nove testes de navegador agora usam esse helper e não dependem de Python.
- **Escopo:** não altera lógica do jogo nem os casos de teste; corrige somente a infraestrutura que entrega os arquivos ao Chromium.
- **Validação:** confirmada em execução local no Windows em 17/11/2026; as dez suítes concluíram sem falhas. Ver seção 8.


## 8. Resultado da execução no Windows — 17/11/2026

O autor atualizou a branch `fix/recovery-prototype20-integration` com `git fetch`, `git switch` e `git pull`, e executou `npm test` localmente após a substituição do servidor HTTP.

| Suíte | Aprovados | Reprovados |
|---|---:|---:|
| audio.cjs | 5 | 0 |
| chase.cjs | 16 | 0 |
| checkpoint.cjs | 16 | 0 |
| confronto.cjs | 51 | 0 |
| display.cjs | 14 | 0 |
| graph.cjs | 11 | 0 |
| intro.cjs | 12 | 0 |
| restart.cjs | 26 | 0 |
| save-feedback.cjs | 7 | 0 |
| save-integrity.cjs | 40 | 0 |
| **Total** | **198** | **0** |

**Conclusão:** a infraestrutura corrigida funciona no ambiente Windows informado e todas as verificações automatizadas atuais passaram. Isso não equivale a uma validação completa do jogo: permanecem pendentes testes em navegadores/dispositivos reais, acessibilidade, versão publicada e funcionalidades sem cobertura automatizada.


## 9. Auditoria funcional — exploração (primeira correção)

- **Defeito identificado:** as cenas sem mapa próprio (1–5 e 9–14) reutilizam o objeto `testScene`. O renderizador oculta o mapa genérico quando `SHOW_TEST_MAP = false`, mas a função `collides()` continuava aplicando suas caixas de colisão.
- **Impacto:** o jogador podia encontrar obstáculos invisíveis nas cenas que ainda não possuem mapa próprio.
- **Correção:** `collides()` e `chaseBlocked()` agora ignoram colisões do mapa de teste quando sua visualização está desativada. Se o mapa de teste for habilitado para desenvolvimento, as colisões voltam a acompanhar os elementos visíveis.
- **Regressão:** criado `tests/exploration.cjs`, que verifica a ausência do mapa genérico e se Alex consegue atravessar a área antes bloqueada nas cenas 1 e 9.
- **Higiene:** atualizados os comentários dos nove testes de navegador; eles não dependem mais de Python, pois usam `tests/http-server.js`.
- **Validação:** a primeira execução no Windows passou em `exploration.cjs` (8/8), mas revelou um erro de sintaxe nos imports de `audio.cjs` e `save-feedback.cjs`. Correção dos imports aplicada; a suíte completa precisa ser reexecutada para validar o estado atualizado. A correção está na branch de trabalho e não foi mesclada.


## 10. Correção de imports nos testes — 17/11/2026

- **Falha:** `audio.cjs` e `save-feedback.cjs` continham uma quebra de linha perdida no cabeçalho: a declaração `const path = require("path");` foi concatenada ao comentário anterior e acabou não sendo interpretada como código.
- **Impacto:** ambos encerravam imediatamente com `ReferenceError: path is not defined`, antes de iniciar Chromium ou executar qualquer asserção.
- **Correção:** restaurada a separação entre comentário e declaração `require("path")` nos dois arquivos. Nenhuma lógica de áudio, salvamento ou gameplay foi alterada.
- **Validação:** pendente de nova execução de `npm test` pelo autor após atualizar a branch.
