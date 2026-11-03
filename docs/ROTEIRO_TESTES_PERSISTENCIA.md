# Roteiro de testes manuais — persistência e restauração
**Projeto:** Sobrenatural: O Mapinguari  
**Branch-alvo:** `design/investigacao-confronto-desfechos`  
**Versão de referência:** commit de auditoria `49c77a8dd684a9d1cf676bcfc358b44bb2fcf9b5` ou commit posterior dessa mesma branch  
**Tipo:** teste manual funcional em navegador  
**Status inicial:** não executado

> Não marque nenhum caso como aprovado sem executar no navegador. Análise estática de código não substitui estes testes. Registre navegador, sistema operacional, data e commit testado.

## Preparação
1. Abra o repositório local no VS Code.
2. Confirme a branch com `git branch --show-current`; o resultado esperado é `design/investigacao-confronto-desfechos`.
3. Confirme que o commit local contém a documentação de auditoria citada acima ou um commit posterior da mesma branch.
4. Inicie o Live Server ou outro servidor HTTP local. Não abra `index.html` via `file://`.
5. Abra as ferramentas de desenvolvedor do navegador e observe Console e Network.
6. Se for necessário limpar o estado inicial, use o botão Reiniciar ou limpe apenas o armazenamento deste site de teste. Não apague outros dados do navegador.
7. Antes de cada cenário independente, reinicie a história e confirme que não há estado de teste anterior.

## Como registrar
Para cada caso, marque **Aprovado**, **Falhou** ou **Bloqueado** e anote:
- resultado esperado e observado;
- passos exatos para reproduzir;
- mensagens de erro do Console;
- cena, estratégia e recursos/evidências envolvidos;
- navegador, sistema operacional e resolução aproximada;
- captura de tela, se ajudar a demonstrar a falha.

## Casos de teste

### PERSIST-01 — carregamento inicial
**Passos**
1. Inicie sem save existente.
2. Abra o jogo por HTTP local.
3. Aguarde o carregamento.

**Esperado**
- O roteiro carrega e a cena inicial aparece.
- Não há erro de carregamento de `roteiro.json`.
- A interface de diálogo e os controles iniciais funcionam.

### PERSIST-02 — restauração durante evento narrativo
**Passos**
1. Avance até uma cena com mais de um evento narrativo.
2. Deixe o texto em exibição ou avance para o próximo evento.
3. Recarregue a página.
4. Observe o evento exibido e avance.

**Esperado**
- A aplicação abre a cena salva.
- Não pula silenciosamente um evento nem repete indefinidamente o mesmo evento.
- O jogador consegue continuar a narrativa.

**Nota:** o momento exato do salvamento pode depender do callback do texto digitado. Registre precisamente quando recarregou.

### PERSIST-03 — restauração durante diálogo
**Passos**
1. Avance até um diálogo de personagem.
2. Recarregue a página durante a exibição ou imediatamente após concluir o texto.
3. Continue avançando.

**Esperado**
- Cena, personagem e posição aproximada do diálogo são coerentes.
- Não há repetição infinita, salto de fala ou travamento.

### PERSIST-04 — evidências e recursos após recarga
**Passos**
1. Chegue à cena 6 e colete uma evidência disponível.
2. Recarregue a página.
3. Abra o Caderno e confira a evidência.
4. Verifique se o ponto de coleta já utilizado permanece oculto.
5. Repita o processo com um recurso da cena 7 ou 8.

**Esperado**
- Evidências e recursos coletados continuam no Caderno.
- Os pontos já coletados não reaparecem como coletáveis.
- Pontos ainda não coletados permanecem disponíveis.
- Não há duplicação de evidências/recursos.

### PERSIST-05 — cena 8 antes de escolher estratégia
**Passos**
1. Chegue à cena 8 e colete alguns recursos/evidências.
2. Quando o painel de estratégia aparecer, recarregue a página antes de selecionar.
3. Observe o painel e o Caderno.

**Esperado**
- O jogo restaura a cena e os dados da investigação.
- A estratégia continua sem escolha, caso ainda não tenha sido selecionada.
- O jogador consegue selecionar uma estratégia.

### PERSIST-06 — cena 8 após escolher estratégia
**Passos**
1. Chegue à cena 8 e selecione uma estratégia.
2. Avance até a transição para a cena correspondente.
3. Recarregue a página.
4. Abra o Caderno e confira a estratégia e os recursos/evidências.

**Esperado**
- A escolha não se perde nem muda para outra estratégia.
- Os requisitos da estratégia são avaliados com o estado restaurado.
- O jogo continua sem bloquear a interação.

### PERSIST-07 — compatibilidade com save versão 2
**Pré-condição:** obter um payload versão 2 real de uma versão anterior do projeto ou criar um caso de teste isolado com formato conhecido. Não substituir dados reais do navegador sem backup.

**Passos**
1. Em ambiente de teste isolado, preparar um save versão 2 válido, apontando para uma cena existente.
2. Carregar o jogo.
3. Verificar se a restauração é aceita.

**Esperado**
- O jogo trata o payload versão 2 sem erro fatal e restaura os campos compatíveis.
- Campos ausentes recebem valores padrão seguros.

**Importante:** não inventar o formato histórico do payload versão 2. Se não houver um exemplo confiável, marque como **Bloqueado** e registre que falta um fixture histórico.

### PERSIST-08 — save inválido
**Passos**
1. Em ambiente de teste isolado, salvar um JSON malformado ou um payload com versão não suportada/cena inexistente.
2. Recarregar o jogo.

**Esperado**
- O jogo não fica travado na tela de carregamento.
- O save inválido é tratado e o jogo inicia de forma recuperável.
- O Console pode registrar um aviso, mas não deve haver falha fatal não tratada.

### PERSIST-09 — reinício manual
**Passos**
1. Avance algumas cenas e colete pelo menos uma evidência/recurso.
2. Use Reiniciar e confirme.
3. Confira cena, Caderno, histórico e mapa.

**Esperado**
- A jornada começa novamente na cena 1.
- Estado de investigação, históricos, cenas visitadas e save anterior são removidos conforme o comportamento definido.

### PERSIST-10 — encerramentos
**Passos**
1. Complete uma rota de vitória.
2. Reinicie e complete uma rota de fuga.
3. Reinicie e provoque uma derrota.
4. Em cada resultado, observe o encerramento e, quando possível, recarregue a página.

**Esperado**
- O encerramento correto aparece.
- O comportamento do save após o final corresponde à documentação e não retoma inesperadamente uma jornada encerrada.
- Botões de jogar novamente/reiniciar funcionam.

## Matriz de estratégias
Executar em partidas separadas, registrando os recursos e as evidências antes de selecionar a estratégia.

| Estratégia | Condição | Resultado esperado segundo a lógica atual |
|---|---|---|
| Espinhos + explosivo | Galho espinhoso e explosivo presentes | Vitória |
| Espinhos + explosivo | Falta galho ou explosivo | Derrota |
| Arma + munição | Arma/cordas, sangue e livro de campo presentes | Vitória |
| Arma + munição | Falta qualquer um dos três requisitos | Derrota |
| Cordas/fuga | Arma/cordas e pegadas presentes | Fuga |
| Cordas/fuga | Arma/cordas e sangue presentes | Fuga |
| Cordas/fuga | Sem arma/cordas | Derrota |
| Cordas/fuga | Arma/cordas presente, mas sem pegadas e sem sangue | Derrota |

Esta tabela descreve as regras atuais observadas no código; não é uma avaliação de balanceamento narrativo.

## Registro de resultados

| ID | Status | Observações / evidência |
|---|---|---|
| PERSIST-01 | Não executado | |
| PERSIST-02 | Não executado | |
| PERSIST-03 | Não executado | |
| PERSIST-04 | Não executado | |
| PERSIST-05 | Não executado | |
| PERSIST-06 | Não executado | |
| PERSIST-07 | Não executado | |
| PERSIST-08 | Não executado | |
| PERSIST-09 | Não executado | |
| PERSIST-10 | Não executado | |

## Critério para abrir correção
Só abrir uma correção depois de registrar uma falha reproduzível. Para cada falha:
1. Escrever o comportamento esperado e o observado.
2. Identificar o ponto do código envolvido e reler a documentação atual.
3. Definir o menor ajuste que resolva o problema.
4. Evitar refatoração ampla junto de uma correção funcional.
5. Reexecutar o caso que falhou e os casos relacionados.
6. Atualizar este arquivo e a auditoria com os resultados reais.

## Limitações
Este roteiro não foi executado no navegador no momento da criação. Todos os casos permanecem **Não executado** até validação manual.
