# Relatório técnico — Programação e implementação

**Projeto:** Sobrenatural: O Mapinguari  
**Data de corte:** 02/11/2026  
**Branch documentada:** `design/investigacao-confronto-desfechos`  
**Commit de referência anterior à documentação:** `cecf3f481808e107d40239cb32527e0e709e5c77`

> Este relatório registra o que está implementado no código da branch na data de corte. Ele separa funcionalidades existentes de intenções descritas no GDD e não considera uma validação visual ou de navegador como concluída quando ela não foi executada.

## 1. Visão técnica

O jogo é uma aplicação web estática, executada no navegador, organizada em HTML, CSS, JavaScript e JSON. O roteiro é carregado de `roteiro.json`; o motor interpreta eventos, diálogos, escolhas, transições e estados de jogo.

### Tecnologias e responsabilidades

| Tecnologia/arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura da interface, camadas de exploração, diálogo, navegação, modais e telas de resultado |
| `style.css` | Estilos gerais da interface |
| `backgrounds.css` | Fundos narrativos associados às 14 cenas |
| `gameplay.css` | Interface e apresentação da exploração, jogador e caderno |
| `test-scene.css` | Mapas de exploração e elementos visuais das cenas investigativas |
| `app.js` | Inicialização, leitura/validação do roteiro, narrativa, navegação, escolhas, histórico, mapa e persistência |
| `gameplay.js` | Movimento de Alex, colisões, pontos de interação e mapas de exploração |
| `investigation.js` | Catálogo de evidências e recursos, caderno e resolução determinística das estratégias |
| `restore-fix.js` | Restauração do progresso salvo, evitando executar a narrativa antes de restaurar os índices |
| `roteiro.json` | Personagens, locais, eventos e diálogos |
| `docs/GDD_Roteiro_Sobrenatural_Mapinguari_v1.2.md` | Documento de direção de game design e narrativa |

## 2. Funcionalidades implementadas

### 2.1 Carregamento e validação do roteiro

- O jogo busca `roteiro.json` com `fetch()`.
- A inicialização verifica se o documento possui personagens e cenas em estruturas válidas e verifica referências usadas pelo roteiro.
- Erros de carregamento são apresentados em uma camada própria.
- Como o roteiro é carregado por requisição HTTP, a execução deve ser feita por servidor local (por exemplo, Live Server ou `npx http-server`), não abrindo o HTML diretamente via `file://`.

### 2.2 Motor narrativo

- Eventos de narração são apresentados antes dos diálogos de cada cena.
- Falas são exibidas com efeito de máquina de escrever.
- Enter, Espaço e Seta para a direita avançam a narrativa; se o texto ainda está sendo escrito, o primeiro comando conclui a animação antes de avançar.
- A cena atual atualiza o título/local e o atributo usado para selecionar o fundo correspondente.
- As transições padrão seguem a ordem das cenas, salvo quando o motor aplica uma rota específica.
- Há telas distintas para game over, fuga e encerramento.

### 2.3 Exploração e controles

- Alex pode ser movimentado com **W, A, S e D**.
- A tecla **E** interage com o ponto mais próximo.
- Enter, Espaço e Seta para a direita ficam reservados ao avanço narrativo, evitando conflito entre movimento/interação e diálogo.
- O movimento é processado por ciclo de animação e respeita colisões definidas por cena.
- Os pontos de interação são botões posicionados no mapa. Podem avançar a cena ou registrar evidências/itens.
- Interações são bloqueadas quando há modal ou overlay ativo.
- O sistema atualiza os pontos já coletados quando o jogador muda de cena ou restaura um save.
- Há feedback visual simples de caminhada e uma legenda de controles na tela.

### 2.4 Mapas de exploração

Foram criados mapas específicos para as cenas 6, 7 e 8:

- **Cena 6 — Clareira destruída:** árvores caídas, troncos partidos, raízes, destroços, pegadas e pelos.
- **Cena 7 — Trilha da perseguição:** vegetação densa, troncos, rastro de sangue, arbusto espinhoso e vegetação inclinada.
- **Cena 8 — Acampamento abandonado:** barracas, mesa de suprimentos, fogueira, local do livro, caixas e saco de dormir.

Esses mapas possuem elementos decorativos posicionados por coordenadas percentuais e áreas de colisão calculadas pelo código. As outras cenas ainda utilizam a configuração de mapa genérico/teste existente no módulo de exploração; isso não significa que todas as 14 cenas tenham mapas exploráveis exclusivos.

### 2.5 Investigação e caderno

O módulo `investigation.js` mantém uma única estrutura compartilhada de investigação, consultada pela exploração e pelo motor narrativo.

**Evidências catalogadas:**

| Identificador | Evidência | Origem |
|---|---|---:|
| `tracks` | Pegadas gigantescas | Cena 6 |
| `fur` | Pelos encontrados | Cena 6 |
| `blood` | Sangue na perseguição | Cena 7 |
| `field_book` | Livro do acampamento | Cena 8 |

**Recursos catalogados:**

| Identificador | Recurso |
|---|---|
| `thorn_branch` | Galho espinhoso |
| `improvised_grenade` | Explosivo improvisado |
| `weapon_and_rope` | Arma, uma munição e cordas |

O caderno é aberto pela interface e apresenta evidências coletadas, três hipóteses textuais, recursos e estratégia escolhida. As hipóteses deixam explícito que o sangue demonstra que a criatura pode ser ferida, que a reação aos espinhos não prova uma fraqueza decisiva e que o livro é uma fonte a confrontar com vestígios.

**Limite atual:** as hipóteses são textos fixos. O caderno não calcula relações dinâmicas de apoio/contradição entre cada pista, não possui árvore de deduções e não altera automaticamente cada hipótese conforme novas pistas são encontradas.

### 2.6 Escolha e resolução das estratégias

A cena 8 oferece três escolhas, implementadas por botões:

1. Armadilha de espinhos e granada — cena 9.
2. Arma e disparo no ponto fraco — cena 10.
3. Armadilha com cordas — cena 11.

A resolução atual é determinística e verifica presença de evidências/recursos:

| Estratégia | Condições verificadas | Resultado no código |
|---|---|---|
| Espinhos + explosivo | `thorn_branch` e `improvised_grenade` | Vitória; caso contrário, derrota |
| Arma + munição limitada | `weapon_and_rope`, pista `blood` e pista `field_book` | Vitória; caso contrário, derrota |
| Cordas | `weapon_and_rope` e pelo menos uma entre `tracks` ou `blood` | Fuga; caso contrário, derrota |

As cenas 9 e 10 só seguem para a cena 12 se a resolução retornar vitória. A cena 11 apresenta fuga quando as condições da estratégia de cordas são atendidas; nos demais casos, apresenta game over.

**Limite importante:** isto ainda não é um sistema de combate por turnos. Não há ciclo completo de turnos, ações táticas, dano, estados detalhados da criatura, consumo granular de munição, cálculo de probabilidades ou falhas parciais. A resolução é uma verificação de requisitos de inventário e evidências. O GDD descreve uma direção mais ampla, que não deve ser confundida com o que já foi programado.

### 2.7 Persistência e restauração

- O progresso é armazenado em `localStorage`.
- A versão atual do payload de save é **3**.
- O save registra cena atual, posição nos eventos e diálogos, histórico da cena, histórico da jornada, cenas visitadas e estado da investigação.
- O restaurador aceita saves das versões **2 e 3**.
- A restauração carrega a cena sem disparar imediatamente a narração, recupera índices e listas, restaura a investigação, sincroniza os pontos coletados e só então retoma a execução.
- Pistas e recursos restaurados não devem reaparecer como itens ainda não coletados.
- O progresso é removido ao concluir finais, apresentar game over ou reiniciar a jornada.

### 2.8 Interface e estados

A interface inclui:
- área de exploração e representação visual do jogador;
- identificação da cena e local;
- caixa de narração/diálogo e retrato ou fallback textual;
- histórico da jornada;
- mapa de cenas visitadas;
- botão do caderno de investigação;
- painel de escolha da cena 8;
- telas de fuga, derrota e encerramento;
- controles e avisos de interação.

Foi corrigida a ausência do painel de escolhas da cena 8, que podia deixar o jogo no estado de escolha sem apresentar opções. O painel agora existe no HTML e é preenchido pelo motor.

## 3. Fundos narrativos das 14 cenas

Foi adicionado ao final de `backgrounds.css` um bloco de regras que associa fundos CSS às cenas por `#game-container[data-scene="N"]`. A composição utiliza gradientes e pseudo-elementos, sem introduzir imagens externas.

| Cena | Direção visual do fundo |
|---:|---|
| 1 | Rodoviária noturna e iluminação artificial |
| 2 | Interior do ônibus, bancos e janelas |
| 3 | Posto, píer, madeira e margem do rio |
| 4 | Travessia pelo rio, reflexos, barco e mata nas margens |
| 5 | Desembarque, barranco, areia e entrada da floresta |
| 6 | Clareira destruída, árvores partidas e terra revolvida |
| 7 | Corredor de perseguição, vegetação fechada e sangue |
| 8 | Acampamento abandonado, barracas e fogueira |
| 9 | Armadilha de espinhos e clarão da explosão |
| 10 | Confronto direto e silhueta da criatura |
| 11 | Passagem estreita e armadilha de cordas |
| 12 | Clareira após a vitória e luz de amanhecer |
| 13 | Oficina mecânica e Opala em reparo |
| 14 | Estrada ao pôr do sol e partida do Opala |

Os fundos são ilustrações abstratas feitas em CSS, não cenários fotográficos nem arte final. A aparência precisa ser conferida no navegador em diferentes resoluções.

## 4. Correções de funcionamento registradas

O histórico recente da branch registra as seguintes correções:

- sincronização das pistas e itens após restauração;
- feedback visual de caminhada;
- prevenção de conflito entre a seta direita e a animação/movimento;
- bloqueio de interação com overlays abertos;
- padronização de movimento em WASD e interação em E;
- atualização da legenda de controles;
- criação de mapas próprios para as cenas 6–8;
- correção da troca e identificação visual dos mapas;
- prevenção de início antecipado da narração durante a restauração;
- restauração do progresso sem disparar narração antes de recuperar os índices;
- inclusão do painel de escolhas ausente da cena 8;
- alinhamento dos fundos das 14 cenas com os acontecimentos do roteiro.

## 5. Histórico de commits relevantes

Os commits abaixo pertencem à branch documentada. Os hashes estão abreviados para facilitar a leitura.

| Commit | Alteração registrada |
|---|---|
| `d689a0ec` | Corrige transições dos finais de vitória |
| `d8636485` | Adiciona o GDD v1.2 com direção aprovada |
| `a79ecb90` | Persiste investigação e adiciona resultado de fuga |
| `d3600e23` | Adiciona interações específicas de investigação |
| `af99a48a` | Adiciona caderno e tela de fuga |
| `40cfd42f` | Estiliza o caderno |
| `bcc14073` | Restaura estado de investigação a partir do save |
| `15bcc5ed` | Adiciona estado compartilhado e caderno |
| `c88540d1` | Atualiza documentação do comportamento investigativo |
| `57e2a936` | Valida preparação antes das rotas de vitória |
| `0b14c7a1` | Trata o livro como hipótese e neutraliza eventos da rota das cordas |
| `aa432a75` | Corrige restauração de marcadores coletados |
| `8a67e536` | Corrige controles e sincronização da exploração |
| `b6de0b9f` | Sincroniza pistas após restaurar progresso |
| `90235f72` | Adiciona feedback visual de caminhada |
| `dacbaf86` | Evita conflito da seta direita e animação de caminhada |
| `21b43a60` | Bloqueia interações com overlays abertos |
| `a2320921` | Padroniza movimento em WASD |
| `0d29e9a1` | Atualiza legenda dos controles |
| `a948749f` | Cria mapas próprios para cenas de investigação |
| `9d24b544` | Adiciona estilos dos mapas |
| `1d099e0a` | Corrige troca e identificação visual dos mapas |
| `0b48d310` | Evita iniciar narração antes de restaurar progresso |
| `76d127e6` | Restaura progresso sem disparar narração antecipada |
| `49f2209b` | Corrige painel ausente de escolhas da cena 8 |
| `cecf3f48` | Alinha fundos das 14 cenas à narração |

## 6. Verificações e testes

### Verificações técnicas registradas

- Sintaxe dos arquivos JavaScript alterados verificada.
- Estrutura de `roteiro.json` validada como JSON e conferida com 14 cenas.
- Fluxos de resolução das três estratégias simulados com os requisitos de evidência/recurso.
- Cenários de save/restore simulados, incluindo compatibilidade com versões anteriores aceitas.
- Presença dos elementos HTML necessários ao painel de escolhas conferida e ausência de IDs duplicados verificada.
- Regras CSS conferidas quanto ao balanceamento de chaves e à presença das regras para as 14 cenas.
- O usuário confirmou em teste manual que movimento, interação e apresentação de narração/diálogos voltaram a funcionar normalmente.

### O que não foi comprovado

- Não foi executado teste ponta a ponta automatizado em navegador.
- Não foi feita inspeção visual automatizada ou captura de todas as 14 cenas.
- Não foi validado o balanceamento de dificuldade das três estratégias com jogadores.
- Não foi comprovado o comportamento em todos os navegadores, resoluções e dispositivos.
- A validação estrutural do CSS não substitui a inspeção visual real.

## 7. Limitações técnicas conhecidas

1. O jogo continua sendo uma aplicação estática; não há backend, autenticação ou banco de dados.
2. O save fica restrito ao navegador/dispositivo em que foi criado.
3. As cenas 6–8 têm mapas específicos; as demais ainda utilizam o mapa genérico de exploração.
4. O caderno tem hipóteses fixas, não um sistema dinâmico de dedução.
5. O confronto usa condições booleanas determinísticas, não combate tático por turnos.
6. A rota de fuga tem uma tela própria, mas ainda não possui um epílogo narrativo tão desenvolvido quanto o percurso de vitória.
7. Os fundos são composições CSS provisórias e precisam de avaliação visual.
8. Testes de regressão completos ainda são necessários após mudanças futuras.

## 8. Próximas verificações recomendadas

- Percorrer as 14 cenas no navegador e conferir fundo, texto, transição e posicionamento da exploração.
- Testar cada uma das três estratégias com todos os requisitos presentes e ausentes.
- Testar coleta opcional de pistas, sem coletar todas, e confirmar que a campanha continua.
- Testar save/load antes e depois da escolha da cena 8.
- Testar reinício, histórico e mapa de cenas visitadas.
- Testar os caminhos 9 → 12 → 13 → 14, 10 → 12 → 13 → 14 e 11 → fuga/game over.
- Verificar colisões e pontos de interação em telas menores.
- Atualizar este relatório sempre que o comportamento real divergir do que está descrito.

## 9. Integridade do repositório

Este relatório descreve a branch `design/investigacao-confronto-desfechos`. As alterações documentadas não foram feitas em `main` e não implicam merge ou publicação.
