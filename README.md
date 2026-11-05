# Sobrenatural: O Mapinguari

Projeto de Trabalho de Conclusão de Curso desenvolvido como uma experiência narrativa interativa para navegador.

## Objetivo

Desenvolver um jogo narrativo em que o jogador acompanha a jornada de Alex, investiga vestígios do Mapinguari e escolhe como enfrentar ou evitar a criatura, chegando a diferentes resultados.

## Tecnologias

- HTML5 — estrutura da aplicação.
- CSS3 — interface, responsividade, mapas e fundos.
- JavaScript — motor narrativo, exploração, investigação, escolhas e persistência.
- JSON — armazenamento dos personagens, cenas, eventos e diálogos.

## Como executar

O jogo utiliza `fetch()` para carregar `roteiro.json`. Execute por um servidor HTTP local em vez de abrir `index.html` diretamente.

### VS Code

1. Abra a pasta do projeto no VS Code.
2. Inicie um servidor com Live Server.
3. Abra o endereço local informado pela extensão.

### Servidor simples

```bash
npx http-server
```

Acesse o endereço local informado pelo servidor.

## Como jogar

- **W, A, S, D:** movimentar Alex.
- **E:** interagir com o ponto mais próximo; sem ponto por perto, esconde-se em uma moita (E de novo para sair).
- **C:** agachar ou levantar. Agachado, Alex anda em silêncio e não corre.
- **Shift:** correr (faz barulho, que pode atrair o Mapinguari).
- **Enter, Espaço ou Seta para a direita:** avançar narração e diálogos.
- Na cena 8, escolha uma das três estratégias pelo painel apresentado.
- **Caderno:** consultar evidências, hipóteses, recursos e estratégia escolhida.
- **Histórico:** consultar os registros da jornada.
- **Mapa:** navegar pelas cenas já visitadas.
- **Reiniciar:** começar novamente.

## Estrutura

```text
TCC/
├── index.html
├── app.js
├── investigation.js
├── gameplay.js
├── restore-fix.js
├── roteiro.json
├── style.css
├── backgrounds.css
├── gameplay.css
├── test-scene.css
├── imagens/
└── docs/
    ├── GDD_Roteiro_Sobrenatural_Mapinguari_v1.2.md
    ├── RELATORIO_PROGRAMACAO.md
    └── RELATORIO_ENREDO.md
```

## Arquitetura

O projeto separa o conteúdo narrativo da execução. O `roteiro.json` mantém personagens, cenas, eventos e diálogos; `app.js` interpreta esses dados e controla a interface; `gameplay.js` administra exploração e interações; `investigation.js` mantém o estado compartilhado de investigação; e `restore-fix.js` restaura o progresso salvo.

As cenas 6, 7 e 8 possuem mapas de exploração específicos. A investigação registra evidências e recursos, que são consultados na resolução das três estratégias apresentadas na cena 8.

## Persistência

O progresso é salvo no `localStorage` do navegador. O save versão 3 armazena cena atual, posição dos eventos e diálogos, histórico, cenas visitadas e estado da investigação. O restaurador aceita saves das versões 2 e 3.

O progresso é removido ao concluir um final, ao ocorrer game over ou ao reiniciar a história. Os dados não são sincronizados entre dispositivos.

## Documentação

- [Relatório de programação](RELATORIO_PROGRAMACAO.md) — arquitetura, módulos, controles, exploração, investigação, estratégias, persistência, histórico de alterações, testes e limitações.
- [Relatório de enredo](RELATORIO_ENREDO.md) — personagens, resumo das 14 cenas, evidências, estratégias, finais e decisões narrativas pendentes.
- [GDD e roteiro v1.2](GDD_Roteiro_Sobrenatural_Mapinguari_v1.2.md) — direção de game design, critérios de aceite e decisões aprovadas.

## Testes recomendados

Antes da apresentação, verificar:
- carregamento do roteiro e execução das 14 cenas;
- movimento, colisões e pontos de interação;
- coleta das evidências nas cenas 6, 7 e 8;
- painel e seleção das três estratégias;
- vitória, fuga e derrota;
- caminhos 9 → 12 → 13 → 14 e 10 → 12 → 13 → 14;
- rota 11 com e sem requisitos de fuga;
- save/load, reinício, histórico e mapa;
- fundos e mapas em diferentes resoluções;
- carregamento dos retratos e fallback.

## Limitações conhecidas

- A aplicação é estática, sem servidor ou banco de dados.
- O progresso fica restrito ao navegador/dispositivo.
- Apenas as cenas 6–8 possuem mapas de exploração específicos; as demais ainda usam o mapa genérico do módulo.
- As hipóteses do caderno são textos fixos; não há árvore dinâmica de dedução.
- A resolução do confronto é determinística por requisitos de pistas e recursos, não um sistema completo de combate por turnos.
- Os fundos são composições CSS e precisam de validação visual no navegador.
- Não há, até a data dos relatórios, teste ponta a ponta automatizado em navegador.

