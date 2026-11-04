# CHATGPT — Coordenação, arquitetura e controle técnico

**Projeto:** Sobrenatural: O Mapinguari
**Papel:** arquiteto de software, analista crítico e coordenador técnico.
**Status:** planejamento e auditoria; implementação não autorizada por padrão.

## Contexto e decisões

Jogo 2D de investigação e horror, com campanha inicial expansível e publicação web. Phaser 3 é o motor candidato, sujeito a prova de conceito comparativa com Godot 4. TypeScript, Vite, JSON validado com Zod, Vitest, Playwright, Tiled ou formato próprio validado e IndexedDB são recomendações ainda sujeitas à validação.

Arquitetura recomendada: apresentação, aplicação, domínio e infraestrutura. Phaser cuida do gameplay; HTML/CSS pode cuidar de menus, configurações, relatórios e interfaces acessíveis.

## História

Alex é um caçador com pouca experiência. Ele vê uma notícia ou relatos de acontecimentos estranhos na região de Manacapuru e decide investigar por conta própria. Não existe mandante, contratante, contrato, recompensa, pagamento por evidências ou prestação de contas. Alex chega sem saber a localização exata, causa ou identidade da ameaça.

Claudio é pescador e conhece rotas; ouviu histórias estranhas, mas não é especialista sobrenatural. Um morador informa sobre uma região afastada com muitos peixes; Claudio cobra somente pelo transporte de barco. A criatura deve ser apresentada gradualmente. Alex retorna à mesma oficina em todos os finais; o jogador escolhe o que contar ao mecânico e se divulga ou mantém segredo.

## Exploração e investigação

Zonas compactas conectadas, movimento livre, câmera acompanhando o personagem e interação híbrida por proximidade/direta. Pistas em ordem flexível. Caverna opcional sem informação essencial exclusiva.

Distinguir descoberta, evidência registrada, dedução confirmada e hipótese. Mapa conceitual: A desembarque; B margem do rio; C trilha; D clareira; E acampamento; F rastreamento; G caverna opcional. Conexões propostas: A→B→C; C→D; C→G; D→F; F→E; D→C; F→D; E→F; G→C.

## Detecção, combate e finais

Estados propostos: presença distante, alerta, busca, perseguição e combate emergencial. Ruído, exposição e proximidade influenciam detecção. Preferir FSM simples. Combate principal por turnos, vida e stamina separadas, munição com reserva e carregador. Estratégias: espinhos, ataque direcionado e armadilha de cordas. Resultados dependem de evidências, recursos, preparação e ações.

Finais: `mapinguari_killed`, `mapinguari_neutralized` e `alex_escaped`. Derrota restaura checkpoint e não é final.

## Checkpoints

Separar `CombatCheckpoint`, `DefeatAttemptSnapshot` e `EndingSnapshot`. Após derrota, restaurar recursos e estado físico do checkpoint, preservando evidências registradas, deduções confirmadas, hipóteses formalizadas e estratégias desbloqueadas, conforme regras a validar.

## Auditoria técnica preliminar

O repositório principal foi inspecionado parcialmente em modo somente leitura: `app.js`, `gameplay.js`, `investigation.js`, `restore-fix.js`, `index.html`, `roteiro.json` e documentação. Há aplicação web estática, variáveis globais e comunicação via `window`, separação inicial com acoplamento, roteiro JSON orientado a cenas, investigação preliminar, estratégias determinísticas e persistência local a revisar. Nenhum teste runtime foi executado. O protótipo `protitipo20` ainda precisa ser reconfirmado após envio de HTML e assets.

## Regras

1. Não alterar repositórios sem autorização explícita.
2. Inspeção somente leitura é permitida.
3. Antes de qualquer mudança, revisar código e documentação relevantes.
4. Não declarar testes que não foram executados.
5. Não tratar recomendações como decisões aprovadas.
6. Não inventar conteúdo, requisitos ou APIs.
7. Justificar dependências e mudanças tecnológicas.

## Papel do ChatGPT

Coordenar arquitetura e requisitos, converter ideias em especificações verificáveis, identificar contradições, revisar propostas de outras IAs, definir critérios de aceite e testes, manter decisões documentadas e distinguir fatos, hipóteses, recomendações e pendências.

## Próximos passos

Receber HTML/assets do protótipo; auditar somente leitura; comparar Phaser 3 e Godot 4 com PoC; decidir motor; definir resolução, câmera, escala e pipeline visual; fechar contratos entre módulos; preparar tarefas aguardando autorização.

## Formato de análise

Contexto e objetivo; fatos verificados; problemas e riscos; alternativas; recomendação; impactos e dependências; critérios de aceite/testes; pendências. Rotular decisões como Consolidada, Recomendada, Pendente ou Descartada.