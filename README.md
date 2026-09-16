# Sobrenatural: O Mapinguari

Projeto de Trabalho de Conclusão de Curso desenvolvido como uma experiência narrativa interativa para navegador.

## Objetivo

Desenvolver um jogo narrativo em que o jogador acompanha a jornada de Alex e pode tomar uma decisão durante a caçada ao Mapinguari, resultando em diferentes caminhos e desfechos.

## Tecnologias

- HTML5 — estrutura da aplicação
- CSS3 — interface, responsividade e cenários
- JavaScript — motor do jogo, diálogos, navegação, escolhas e persistência
- JSON — armazenamento do roteiro e dos dados narrativos

## Como executar

O jogo utiliza `fetch()` para carregar `roteiro.json`. Por isso, recomenda-se executar por um servidor HTTP local em vez de abrir `index.html` diretamente.

### VS Code

1. Abra a pasta do projeto no VS Code.
2. Execute com uma extensão como Live Server.
3. Abra a página gerada pelo servidor.

### Servidor simples

Também é possível utilizar qualquer servidor HTTP estático, por exemplo:

```bash
npx http-server
```

Depois, acesse o endereço informado pelo servidor.

## Como jogar

- Clique na caixa de diálogo para avançar.
- Use `Enter`, `Espaço` ou `Seta para a direita` para avançar.
- Na cena de escolha, use os botões ou as teclas `1`, `2` e `3`.
- Use **Histórico** para consultar os registros da jornada.
- Use **Mapa** para retornar a cenas que já foram visitadas.
- Use **Reiniciar** para começar novamente.

## Estrutura

```text
TCC/
├── index.html          # Interface principal
├── app.js              # Motor do jogo
├── roteiro.json        # Roteiro e dados narrativos
├── style.css           # Estilos da interface
├── backgrounds.css     # Cenários e fundos
├── imagens/            # Retratos dos personagens
└── README.md           # Documentação do projeto
```

## Arquitetura

O projeto separa o conteúdo narrativo da execução do jogo. O `roteiro.json` mantém personagens, cenas, eventos e diálogos, enquanto `app.js` interpreta esses dados e controla a interface.

As transições comuns seguem a ordem das cenas declarada no JSON quando não existe uma propriedade explícita de próxima cena. A decisão da cena 8 continua direcionando para os três caminhos já definidos no roteiro: cenas 9, 10 e 11.

A aplicação também possui validação do roteiro antes da inicialização, tratamento de erros, fallback para retratos ausentes e verificação das referências usadas pelas escolhas.

## Persistência

O progresso da sessão é salvo no `localStorage` do navegador. São armazenados a cena atual, a posição dos eventos e diálogos, o histórico e as cenas visitadas.

O progresso é removido ao concluir um final, ao ocorrer o game over ou ao reiniciar a história.

## Testes recomendados

Antes da apresentação, verificar:

- carregamento do roteiro;
- execução das cenas 1 a 8;
- as três escolhas da cena 8;
- caminho 9 → 12 → 13 → 14;
- caminho 10 → 12 → 13 → 14;
- caminho 11 → game over;
- reinício da história;
- restauração após atualizar a página;
- histórico da jornada;
- bloqueio das cenas ainda não visitadas no mapa;
- carregamento dos retratos;
- funcionamento em telas menores.

## Limitações conhecidas

- O jogo é uma aplicação estática e não possui servidor ou banco de dados.
- O progresso é armazenado apenas no navegador e não é sincronizado entre dispositivos.
- As escolhas da cena 8 são uma configuração de jogo mantida no motor JavaScript para preservar exatamente os caminhos definidos pelo roteiro.

## Trabalhos futuros

- adicionar efeitos sonoros e trilha sonora;
- ampliar o sistema de decisões;
- adicionar novos capítulos e personagens;
- implementar uma tela inicial e configurações;
- criar testes automatizados para o motor de navegação;
- disponibilizar o jogo em uma hospedagem pública.

## Observação sobre o roteiro

O conteúdo narrativo existente foi preservado. As alterações técnicas concentram-se no funcionamento da aplicação, navegação, validação, histórico, mapa e persistência, sem modificar as falas dos personagens.
