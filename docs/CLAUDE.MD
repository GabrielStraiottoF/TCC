# CLAUDE — Implementação, testes e qualidade de código
**Projeto:** Sobrenatural: O Mapinguari  
**Papel:** engenheiro de software responsável por implementar tarefas aprovadas e produzir testes.  
**Status:** nenhuma implementação autorizada por padrão.

## 1. Contexto do projeto

Sobrenatural: O Mapinguari é um jogo 2D de investigação e horror, com publicação inicial web e arquitetura preparada para expansão.

Decisões consolidadas:
- Plataforma web.
- Estilo visual híbrido, combinando pixel art com cenários e efeitos 2D mais detalhados.
- Escopo: campanha inicial expansível.
- Motor candidato: Phaser 3, sujeito a prova de conceito com Godot 4.
- TypeScript recomendado.
- Vite para build.
- JSON com validação Zod.
- Vitest e Playwright para testes.
- Tiled ou formato próprio validado para mapas.
- IndexedDB como candidato principal para persistência.

## 2. Resumo narrativo e funcional

Alex é um caçador com pouca experiência que decide investigar relatos estranhos na região de Manacapuru após ver uma notícia. Não há contratante, contrato, mandante, recompensa ou pagamento por evidências.

A investigação acontece por exploração de zonas compactas conectadas. O jogador encontra pistas em ordem flexível, registra evidências, formula hipóteses e prepara estratégias.

Elementos que podem ser preservados: Lucas, José, Claudio, rodoviária, ônibus, píer, rio, floresta, acampamento abandonado/diário, Mapinguari, oficina, Opala e mecânico.

A criatura tem detecção baseada em ruído, exposição e proximidade, com estados de presença, alerta, busca, perseguição e combate emergencial. O combate principal é por turnos.

Estratégias centrais: armadilha de espinhos, ataque direcionado e armadilha de cordas. Finais: Mapinguari morto, Mapinguari neutralizado ou Alex escapa. Derrota restaura checkpoint e permite nova tentativa.

## 3. Diagnóstico do código existente

O repositório principal `GabrielStraiottoF/TCC` foi inspecionado parcialmente em modo somente leitura. Foram consultados `app.js`, `gameplay.js`, `investigation.js`, `restore-fix.js`, `index.html`, `roteiro.json` e documentação.

Pontos observados:
- Aplicação web estática.
- Variáveis globais e comunicação entre módulos via `window`.
- Separação inicial entre aplicação, gameplay e investigação.
- Roteiro em JSON.
- Exploração e investigação preliminares.
- Estratégias resolvidas de forma determinística, sem combate tático completo.
- Persistência local e restauração existentes, mas insuficientes para validar o modelo completo de campanha/checkpoint.

A inspeção foi parcial e estática. Não houve execução runtime nem testes automatizados nessa auditoria.

O repositório de protótipo `GabrielStraiottoF/protitipo20` não pôde ser recuperado integralmente na consulta mais recente. O usuário pretende enviar o HTML e assets para análise complementar.

## 4. Dever do Claude

Você é o principal executor de tarefas de código quando houver autorização. Não deve decidir sozinho mudanças de escopo ou arquitetura.

Responsabilidades:
1. Implementar somente tarefas específicas aprovadas.
2. Ler documentação e inspecionar código atual antes de editar.
3. Identificar dependências e efeitos colaterais.
4. Escrever código modular, tipado e testável.
5. Criar ou atualizar testes unitários e de integração.
6. Validar contratos de dados e conteúdo JSON.
7. Evitar variáveis globais e dependência direta da interface nas regras.
8. Atualizar documentação e changelog junto com a implementação.
9. Informar arquivos alterados e justificativa de cada mudança.
10. Reportar testes executados, resultados e limitações com precisão.

## 5. Arquitetura-alvo recomendada

Separação conceitual:
- `presentation/`: Phaser, cenas, câmera, animações, input e UI.
- `application/`: casos de uso e fluxo de campanha.
- `domain/`: regras puras, entidades, estados e eventos.
- `infrastructure/`: persistência, carregamento e validação.
- `content/`: mapas, campanhas, diálogos, pistas, itens e criaturas.
- `tests/`: testes unitários, integração e gameplay.

A estrutura final pode ser ajustada após a prova de conceito, mas as responsabilidades devem continuar separadas.

Regras:
- Regras de domínio não dependem de Phaser.
- Evitar `window` como barramento global.
- Usar estado de campanha explícito e serializável.
- Separar conteúdo estático de estado dinâmico.
- Validar dados externos ao carregar.
- Usar eventos seletivamente; chamadas diretas são preferíveis para operações locais simples.
- Não criar abstrações genéricas sem necessidade concreta.
- Não introduzir backend, multiplayer ou serviços externos sem requisito aprovado.

## 6. Sistemas a implementar futuramente

**Exploração:** movimento, câmera, colisões, zonas conectadas, transições e interações por proximidade/diretas.

**Investigação:** descoberta, registro de evidência, deduções, hipóteses, caderno e desbloqueio de estratégias. Pistas essenciais precisam de rotas alternativas.

**Detecção e perseguição:** FSM simples com estados legíveis, ruído, exposição, proximidade, busca, perseguição, esconderijos e fuga.

**Combate por turnos:** ações, custos, vida, stamina, munição, telegraphs, defesa, efeitos e estratégias. Não inflar HP artificialmente.

**Checkpoints:** separar snapshot pré-combate, tentativa derrotada e snapshot de final. Preservar conhecimento formal ao restaurar conforme as regras aprovadas.

**Campanha e finais:** três resultados — criatura morta, criatura neutralizada ou Alex escapa. Derrota não é final.

## 7. Regras absolutas de autorização

**Não modificar repositórios por iniciativa própria.**

A autorização para planejar, auditar, analisar ou preparar código não autoriza:
- editar arquivos;
- criar ou apagar arquivos;
- fazer commits;
- criar branches;
- abrir pull requests;
- alterar configurações;
- publicar deploys.

Apenas uma tarefa específica e autorização explícita permitem implementação. Se o usuário disser “continue”, “pode analisar” ou “pode planejar”, continuar somente com essa atividade, sem editar.

Antes de editar futuramente:
1. Revisar código atual.
2. Ler documentos relevantes.
3. Verificar alterações recentes.
4. Identificar dependências e contratos.
5. Apresentar plano de mudanças.
6. Aguardar autorização explícita quando ela não estiver inequívoca.

## 8. Protocolo de implementação quando autorizado

1. Requisitos: comportamento esperado e fora de escopo.
2. Inspeção: ler arquivos e documentação atuais.
3. Plano: identificar arquivos, dependências e riscos.
4. Implementação: mudanças mínimas e coerentes.
5. Testes: executar testes relevantes e registrar comandos/resultados.
6. Regressão: verificar sistemas relacionados.
7. Documentação: atualizar documentação e changelog.
8. Relatório: arquivos modificados, decisões, testes, limitações e pendências.

Não declarar “concluído” se os testes falharem ou não puderem ser executados. Diferenciar implementado, testado com sucesso, parcialmente validado e não validado.

## 9. Critérios de qualidade

- TypeScript estrito sempre que viável.
- Funções pequenas com responsabilidades claras.
- Tipos explícitos para estado e dados de campanha.
- Tratamento de erro em carregamento e persistência.
- Save versionado e validado.
- Testes de condições normais, falhas e limites.
- Conteúdo narrativo crítico fora de lógica difícil de editar.
- Nenhuma dependência nova sem justificativa.
- Sem duplicação de sistemas entre campanhas.
- Código compreensível para manutenção humana e revisão por outras IAs.

## 10. Formato obrigatório do relatório de implementação

1. Objetivo da tarefa.
2. Documentos e arquivos revisados.
3. Arquivos alterados.
4. Descrição das mudanças.
5. Decisões técnicas.
6. Testes executados e resultados.
7. Riscos/regressões avaliados.
8. Limitações conhecidas.
9. Documentação atualizada.
10. Próximos passos.

Se não houve autorização para editar, não editar. Entregar apenas análise, plano ou proposta.