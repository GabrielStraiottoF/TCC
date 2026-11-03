# Auditoria técnica — Sobrenatural: O Mapinguari
**Data:** 2026-11-03  
**Branch auditada:** `design/investigacao-confronto-desfechos`  
**Escopo:** análise estática de código, documentação, integridade do roteiro e lógica das estratégias.  
**Estado:** somente leitura durante a auditoria; nenhuma alteração de código foi realizada nesta análise.

> Esta auditoria descreve o estado observado na branch indicada na data acima. Antes de usar as conclusões para uma alteração futura, compare a branch e os arquivos com o estado atual do repositório.

## 1. Fontes revisadas

- `README.md`
- `index.html`
- `app.js`
- `gameplay.js`
- `investigation.js`
- `restore-fix.js`
- `roteiro.json`
- `gameplay.css`
- `backgrounds.css`
- `docs/GDD_Roteiro_Sobrenatural_Mapinguari_v1.2.md`
- `docs/RELATORIO_PROGRAMACAO.md`
- `docs/RELATORIO_ENREDO.md`

Comparação de branch consultada: `design/investigacao-confronto-desfechos` está 29 commits à frente de `main` e 0 commits atrás no momento da consulta.

## 2. Resumo executivo

O protótipo possui motor narrativo em JavaScript, conteúdo separado em JSON, exploração com movimento e pontos de interação, sistema de evidências/recursos e três estratégias de confronto. O escopo atual não é um combate tático por turnos: a resolução é determinística, baseada em recursos e evidências.

A verificação estática encontrou um grafo narrativo completo para as 14 cenas: todas são alcançáveis a partir da cena 1, os destinos observados existem e não foi encontrada cena inalcançável. Isso não substitui um teste real de navegador.

**Não foram realizadas alterações de código, commits de correção ou merges como parte da auditoria.**

## 3. Verificações estáticas executadas

| Verificação | Resultado observado |
|---|---|
| Parse de `roteiro.json` | JSON válido |
| Quantidade de cenas | 14 |
| IDs de cena | Únicos: 1–14 |
| Diálogos | 55; personagens referenciados estão cadastrados |
| Eventos narrativos | 46, conforme inventário anterior do roteiro/documentação |
| Escolhas da cena 8 | Destinos 9, 10 e 11 existem |
| Destinos explícitos | Cenas 9 e 10 apontam para a cena 12, que existe |
| Grafo narrativo | Todas as 14 cenas alcançáveis; nenhum destino inexistente encontrado na análise |
| IDs HTML | Nenhum ID duplicado encontrado no conteúdo inspecionado |
| Scripts no HTML | `app.js`, `investigation.js`, `restore-fix.js`, `gameplay.js` referenciados |
| Pontos de coleta | Os IDs de evidências e recursos catalogados possuem pontos de coleta correspondentes |
| Estratégias | 10 casos lógicos simulados, incluindo requisitos completos e ausentes; resultados coerentes com as condições atuais |

Os testes de estratégia foram simulações da lógica condicional lida no código, não testes de interação ponta a ponta.

## 4. Grafo de cenas observado

- Cena 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
- Cena 8 → 9 → 12 → 13 → 14
- Cena 8 → 10 → 12 → 13 → 14
- Cena 8 → 11 → desfecho de fuga ou game over, conforme a resolução da investigação

As cenas 9 e 10 convergem para a cena 12. A cena 11 é resolvida diretamente e não continua para a sequência de vitória. A validação atual de `validateRoteiro()` verifica estrutura, IDs duplicados e diálogos, mas não faz uma análise completa e preventiva do grafo narrativo. Embora o grafo atual tenha passado na verificação estática, recomenda-se incorporar essa checagem à validação automatizada para detectar erros futuros antes de iniciar o jogo.

## 5. Regras atuais das estratégias

### Estratégia 1 — espinhos + explosivo
Requer:
- `thorn_branch`
- `improvised_grenade`

Resultado atual: vitória somente quando os dois recursos estão registrados.

### Estratégia 2 — arma + munição limitada
Requer:
- `weapon_and_rope`
- evidência `blood`
- evidência `field_book`

Resultado atual: vitória quando os três requisitos estão registrados.

### Estratégia 3 — cordas/fuga
Requer:
- `weapon_and_rope`
- evidência `tracks` ou `blood`

Resultado atual: fuga se os requisitos forem satisfeitos; caso contrário, derrota.

**Decisão de design pendente:** `weapon_and_rope` agrupa arma, uma munição e cordas. A regra da fuga também depende desse recurso agrupado. Antes de separar os recursos, confirmar se essa dependência é intencional. Não alterar sem decisão de design.

## 6. Persistência e restauração

O salvamento registra versão 3 do payload e inclui cena atual, estado de investigação, índices de evento/diálogo, histórico da cena, histórico da jornada e cenas visitadas. O carregamento aceita versões 2 e 3 e valida se a cena salva existe.

Há duas declarações de `restoreSave()`: uma em `app.js` e outra em `restore-fix.js`. Pela ordem dos scripts no HTML, a segunda implementação é a que prevalece no fluxo normal. Ela carrega a cena sem iniciar a narrativa, restaura os índices e históricos, restaura a investigação, sincroniza os pontos de exploração e só então retoma a narrativa.

Isso não foi confirmado em execução real. A duplicação de função é um acoplamento frágil e deve ser consolidada somente depois de testes de regressão que demonstrem que a sequência de restauração continua correta.

**Correção de uma hipótese anterior:** a preocupação de que os pontos de coleta necessariamente reapareçam depois da restauração não foi confirmada pelo código atual. `restore-fix.js` chama `refreshExplorationState()`, e `gameplay.js` reconstrói `discoveredItems` a partir das evidências e recursos restaurados. O comportamento visual ainda deve ser testado no navegador.

A chave de armazenamento `tcc-mapinguari-save-v2` tem nome antigo, enquanto o payload atual é versão 3. Isso é potencialmente confuso, mas não é, por si só, uma falha funcional.

## 7. Achado narrativo a revisar

A cena 14 contém um evento que revela a frase final “Onde existe um… existem outros.”. Depois que os eventos e diálogos terminam, o fluxo chega a `showEnding()`, que apresenta a mesma frase novamente no painel de encerramento.

Pelo fluxo de código, a frase é solicitada em dois momentos consecutivos. Isso pode ser uma repetição intencional, mas deve ser confirmado como decisão narrativa. Não remover nenhuma das ocorrências sem aprovação.

## 8. Arquitetura e exploração

- `app.js` controla fluxo narrativo, estado, histórico, salvamento e transições.
- `roteiro.json` mantém conteúdo narrativo separado da execução.
- `gameplay.js` controla movimento, colisões, pontos de interação e sincronização da exploração.
- `investigation.js` cataloga evidências e recursos, exibe hipóteses fixas e resolve estratégias.
- `restore-fix.js` substitui a implementação de restauração declarada no motor principal.

O módulo de exploração chama `window.advanceScene()` diretamente e usa APIs globais compartilhadas. Isso funciona no arranjo atual, mas aumenta o risco de regressões quando os módulos forem modificados.

As cenas 6–8 têm configurações específicas de exploração. As demais usam o mapa de teste genérico, conforme a documentação atual. A expansão de mapas deve depender de uma decisão explícita de escopo, não ser presumida como requisito automático.

## 9. Uso de HTML dinâmico

Foram observadas utilizações de `innerHTML` em pontos de interface. Algumas montam marcação fixa ou valores escapados; outras devem ser avaliadas individualmente. A presença de `innerHTML` não basta para concluir que há vulnerabilidade.

Recomendação: para conteúdo puramente textual, preferir `textContent`; manter montagem HTML somente quando houver necessidade concreta de marcação e garantir que os valores interpolados sejam controlados ou escapados.

## 10. Limitações desta auditoria

Não foi possível comprovar nesta etapa:
- execução ponta a ponta em navegador;
- funcionamento de teclado, toque, movimento e colisões em diferentes dispositivos;
- restauração visual e continuidade exata dos índices de narrativa;
- experiência visual de todas as cenas;
- regressões em todos os navegadores e resoluções;
- balanceamento das estratégias com jogadores reais.

As verificações estáticas não devem ser descritas como testes de navegador.

## 11. Plano de validação priorizado

### P1 — Testes funcionais e persistência
1. Iniciar um jogo limpo e percorrer até a cena 8.
2. Testar cada estratégia com requisitos completos e com cada requisito ausente.
3. Salvar/recarregar durante eventos e diálogos.
4. Salvar/recarregar na cena 8 antes da escolha.
5. Salvar/recarregar depois da escolha, verificando estratégia, evidências, recursos, índices e histórico.
6. Confirmar que pontos já coletados continuam ocultos após recarregar.
7. Confirmar que vitória, fuga e derrota limpam ou mantêm o save conforme o comportamento pretendido.

### P1 — Validação do grafo automatizada
1. Verificar IDs únicos.
2. Verificar todos os destinos explícitos e todos os destinos das escolhas.
3. Calcular cenas alcançáveis desde a cena inicial.
4. Verificar rotas que terminam em vitória, fuga e derrota.
5. Falhar a validação com mensagens úteis quando houver destino inválido.

### P2 — Revisão de design e UX
1. Confirmar a repetição da frase final.
2. Decidir se o item agrupado `weapon_and_rope` representa a regra pretendida.
3. Testar mapas, colisões e interação em tela pequena.
4. Avaliar a cobertura de mapas específicos para cenas além de 6–8.
5. Revisar acessibilidade e feedback dos pontos interativos.

### P2 — Manutenibilidade
1. Consolidar a restauração duplicada somente após os testes.
2. Definir contratos entre motor, exploração e investigação antes de refatorar globais.
3. Adicionar testes automatizados para as regras de investigação e o grafo.
4. Auditar cada uso de `innerHTML` por necessidade e origem dos dados.

### P3 — Polimento
Depois de estabilizar o núcleo: fundos, responsividade, animações, efeitos sonoros e refinamento visual.

## 12. Critério para começar a corrigir

Antes de cada mudança:
1. Ler novamente os arquivos afetados e este relatório.
2. Confirmar que a branch e os arquivos ainda correspondem ao estado auditado.
3. Descrever o problema confirmado, o impacto e a correção mínima.
4. Definir critério de aceite e teste de regressão.
5. Evitar reescritas amplas ou troca de engine sem evidência de necessidade.
6. Atualizar esta documentação quando a implementação ou o resultado dos testes mudar.

## 13. Referências do repositório

- Branch: https://github.com/GabrielStraiottoF/TCC/tree/design/investigacao-confronto-desfechos
- GDD: https://github.com/GabrielStraiottoF/TCC/blob/design/investigacao-confronto-desfechos/docs/GDD_Roteiro_Sobrenatural_Mapinguari_v1.2.md
- Relatório técnico: https://github.com/GabrielStraiottoF/TCC/blob/design/investigacao-confronto-desfechos/docs/RELATORIO_PROGRAMACAO.md
- Relatório narrativo: https://github.com/GabrielStraiottoF/TCC/blob/design/investigacao-confronto-desfechos/docs/RELATORIO_ENREDO.md
