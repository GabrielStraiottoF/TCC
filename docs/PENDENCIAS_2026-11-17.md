# Pendências — reconciliação em 17/11/2026

**Base:** `PENDENCIAS_2026-11-04.md` (commit auditado `835b60d`) comparada com o código em `design/investigacao-confronto-desfechos` após os commits de 05–06/11 e os desta data.
**Como foi verificado:** `npm test` em Chromium headless. Na execução final de 17/11/2026, **11 suítes, 206 verificações aprovadas, 0 falhas**. Itens marcados como pendentes não foram necessariamente cobertos pelos testes.

## 1. Resolvidas (com o teste que as cobre)

| ID | O que mudou | Evidência |
|---|---|---|
| SAVE-001, 002, 003, 005, TEST-006 | Save inválido (itens, cena, versão, JSON, nulo) é recusado com aviso e **não é apagado**; índices são limitados | `tests/save-integrity.cjs` (40) |
| SAVE-007 | "Começar" com save existente pede confirmação | `app.js` (`startNewGame`), `save-integrity.cjs` |
| SAVE-008 (D-01a) | Derrota volta ao checkpoint da cena 8 (pistas e itens mantidos); fuga e vitória apagam o save | `tests/checkpoint.cjs` (16) |
| TEST-005 | Reinício após vitória, fuga, derrota e pelo menu zera estado | `tests/restart.cjs` (26) |
| SAVE-006 / ARQ-002 | `restoreSave` único (`restore-fix.js`); cópia morta de `app.js` removida | commit `1c86ad6` |
| NAR-004 / TEST-003 | Validador de grafo: destinos, auto-referência, alcançabilidade, ciclos, becos sem saída | `roteiro-graph.js`, `tests/graph.cjs` (11) |
| TEST-001 / TEST-002 | `npm test` versionado no repositório | `package.json`, `tests/run-all.cjs` |
| INV-001 | Hipóteses do caderno só aparecem com evidência-base e mostram base, limite e confronto | `tests/confronto.cjs` |
| CON-001 (D-04a) | Escolha da cena 8 informa requisitos (✓/✗ com texto) e risco; não bloqueia | `tests/confronto.cjs` |
| NAR-001 (D-02) | Plano sem requisitos vai direto à derrota, sem narrar execução como sucesso | `tests/confronto.cjs` |
| UI-005 | Falha ao salvar exibe aviso persistente e acessível; salvamento posterior o remove | `tests/save-feedback.cjs` (7) |
| Áudio procedural | Web Audio isolado, controle liga/desliga e efeitos integrados à exploração/perseguição | `audio.js`, `tests/audio.cjs` (5) |
| EXP-002 (colisões invisíveis) | Colisões do mapa genérico desativadas quando o mapa está oculto | `gameplay.js`, `tests/exploration.cjs` (8) |
| TEST-ENV | Servidor estático dos testes usa Node, sem depender de `python3` | `tests/http-server.js` |

Efeito colateral corrigido na escolha da cena 8: **Esc** / "Procurar mais no acampamento" retoma a exploração e **Enter** reabre a decisão.

## 2. Abertas — dependem de decisão do autor

| ID | Questão | Opções |
|---|---|---|
| D-05 / NAR-002 | A frase "Onde existe um… existem outros." aparece no evento da cena 14 (`roteiro.json:394`) e em `showEnding()` (`app.js:585`) | manter uma, as duas ou nenhuma |
| D-06 / NAR-006 | Final "criatura neutralizada" (GDD B.5) não existe | descartar ou escrever |
| D-07 / UI-001 | Três nomes em uso: "Sons da Noite", "Sobrenatural: O Mapinguari", "Herança Maldita" | escolher um e padronizar |
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
| UI-004 | Acessibilidade não auditada: foco visível, contraste, leitor de tela | P2 |
| INV-005 / INV-006 | Itens não são consumidos; `gameplay.js` mantém `discoveredItems` separado do estado de `investigation.js` | P2 |
| ARQ-001 / 003 | Estado global em `let` lido por vários scripts; regra de confronto dividida entre `app.js` e `investigation.js` | P2 |
| NAR-003 / 005 | Diálogos sem condição; navegação implícita pela ordem do array | P2 |
| EXP-004 | Código do mapa de teste (`SHOW_TEST_MAP = false`) ainda no `gameplay.js` | P3 |

## 4. Limites desta reconciliação

- As decisões D-04 ("informar, não bloquear") e D-02 ("resolver antes de narrar") são reversíveis; confirmar com o autor.
- Os testes automatizados não equivalem a validação manual de jogabilidade, acessibilidade, navegadores diferentes ou dispositivos reais.
- Nada foi verificado em aparelho real nem na versão publicada.
- O reaproveitamento do protótipo 20 está restrito, nesta etapa, ao áudio procedural. Sistemas de combate em tempo real, arte Canvas, mapas e persistência do protótipo não foram transplantados.

## 5. Reaproveitamento do protótipo 20 — primeira integração

- Criado `audio.js`, isolando o sintetizador procedural Web Audio, sem arquivos externos.
- Integrados efeitos de passos, coleta, interação, salto, alerta da criatura e captura em `gameplay.js`.
- Adicionado botão para ligar/desligar os efeitos sonoros; preferência persistida em chave separada do save.
- Criado `tests/audio.cjs` (5 verificações) e `docs/PLANO_INTEGRACAO_PROTOTIPO20.md` com matriz de compatibilidade e limites.

## 6. Ambiente de testes no Windows

- Os testes de navegador antes iniciavam servidor com `spawn("python3", ...)`; isso falhava em ambientes Windows sem `python3` no PATH.
- Criado `tests/http-server.js`, servidor HTTP estático com APIs nativas do Node. Os testes passaram a usar esse helper.
- Dois arquivos (`audio.cjs` e `save-feedback.cjs`) tiveram um import de `path` concatenado ao comentário do cabeçalho. O import foi restaurado e a suíte foi reexecutada com sucesso.

## 7. Auditoria funcional — exploração

- **Defeito:** cenas sem mapa próprio (1–5 e 9–14) reutilizam `testScene`. O renderizador oculta o mapa genérico com `SHOW_TEST_MAP = false`, mas `collides()` e `chaseBlocked()` ainda aplicavam suas caixas de colisão.
- **Impacto:** obstáculos invisíveis bloqueavam o jogador.
- **Correção:** colisões do mapa de teste são ignoradas quando sua visualização está desativada.
- **Regressão:** `tests/exploration.cjs` verifica cenas 1 e 9 e confirma que Alex atravessa a área anteriormente bloqueada.

## 8. Validação final — Windows, 17/11/2026

O autor atualizou a branch `fix/recovery-prototype20-integration` e executou `npm test` localmente após as correções.

| Suíte | Aprovados | Reprovados |
|---|---:|---:|
| audio.cjs | 5 | 0 |
| chase.cjs | 16 | 0 |
| checkpoint.cjs | 16 | 0 |
| confronto.cjs | 51 | 0 |
| display.cjs | 14 | 0 |
| exploration.cjs | 8 | 0 |
| graph.cjs | 11 | 0 |
| intro.cjs | 12 | 0 |
| restart.cjs | 26 | 0 |
| save-feedback.cjs | 7 | 0 |
| save-integrity.cjs | 40 | 0 |
| **Total** | **206** | **0** |

**Conclusão:** todas as 11 suítes automatizadas passaram no ambiente Windows informado. Isso valida apenas os comportamentos cobertos pelos testes; as pendências da seção 2 e 3 continuam abertas.


## 9. Auditoria funcional — perseguição (17/11/2026)

### Achados

- **PER-001 — visão atravessa obstáculos:** a detecção considerava apenas distância. A criatura podia detectar Alex através dos troncos e da vegetação sólida da cena 7.
- **PER-002 — ruído sem deslocamento:** pressionar uma direção contra um obstáculo emitia passo e ruído mesmo quando a colisão impedia qualquer movimento.
- **PER-003 — estado de corrida inconsistente:** a corrida era marcada como ativa pela tecla pressionada, mesmo sem deslocamento. Isso podia ampliar indevidamente o alcance visual da criatura.

### Alterações na branch de trabalho

- Adicionada verificação geométrica de linha de visão entre criatura e jogador, usando as caixas de colisão do mapa da cena.
- Passos e ruído agora são emitidos somente quando há deslocamento real.
- O estado de corrida agora depende de deslocamento real.
- A interface de estado usada pelos testes passou a expor os dados do último ruído.
- Ampliado `tests/chase.cjs` para cobrir visão obstruída e desobstruída, alcance visual agachado, movimento bloqueado e ruído após movimento real.

### Esconderijos

A lógica atual permite esconder Alex, impede seu movimento enquanto escondido e permite que a criatura vasculhe a área e o force a sair. Os testes existentes cobrem entrada, bloqueio de movimento, saída e ausência de captura enquanto escondido. Ainda é necessário validar o comportamento em jogabilidade manual, inclusive a frequência de expulsão do esconderijo.

### Validação pendente

As alterações desta seção ainda **não foram executadas com `npm test` no ambiente Windows do autor**. A execução anterior de 206 verificações é uma linha de base histórica e não valida estes commits. Após a execução, atualizar a contagem e investigar qualquer falha antes de considerar a auditoria concluída.
