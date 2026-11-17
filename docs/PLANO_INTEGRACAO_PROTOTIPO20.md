# Plano de integração do protótipo 20

**Branch de trabalho:** `fix/recovery-prototype20-integration`  
**Repositório principal:** `GabrielStraiottoF/TCC`  
**Fonte de referência:** `GabrielStraiottoF/protitipo20`, arquivo `prototipo20.html`

## 1. Diretriz de integração

O protótipo 20 é uma fonte de mecânicas, lógica visual e efeitos, não uma base substituta para o jogo atual. Seu código está concentrado em um único HTML de aproximadamente 1,18 MB, com CSS, JavaScript, desenho procedural e estado global.

O projeto principal deve continuar responsável pelo roteiro, investigação, escolhas, checkpoints e persistência. Componentes do protótipo só entram depois de isolados, adaptados à arquitetura atual e cobertos por testes.

## 2. Compatibilidade por sistema

| Sistema do protótipo 20 | Compatibilidade | Decisão |
|---|---|---|
| Efeitos sonoros via Web Audio | Alta | Portar como módulo independente, sem copiar o HTML monolítico |
| Sons de passos, alerta e interação | Alta | Integrar em pontos já existentes do sistema de exploração |
| Desenho procedural de personagens e criaturas | Média | Reaproveitar funções e parâmetros após definir uma camada de renderização compatível |
| Mapas da cidade e cenários Canvas | Baixa no formato atual | Não substituir a exploração DOM/CSS; avaliar como cenas específicas em módulo separado |
| Combate de ação (faca, arma, bombinhas, armadilhas, curativos) | Baixa tecnicamente; alto impacto de design | Não integrar ao confronto narrativo sem decisão explícita sobre o modelo de combate |
| Perseguição e percepção da criatura | Média | Comparar comportamento e parâmetros; o jogo atual já possui visão, ruído, memória, patrulha e esconderijos |
| Salvamento do protótipo | Baixa | Não portar: o projeto atual possui save v3, validação, migração compatível e checkpoint |
| Controles de toque | Média | Reaproveitar padrões de interação, mantendo os controles atuais até testes em dispositivos reais |

## 3. Integração de áudio

O módulo `audio.js` foi criado a partir do sintetizador procedural do protótipo:

- Osciladores e ruído gerado por Web Audio, sem arquivos de áudio externos.
- Efeitos de passos, coleta, interação, salto, alerta e impacto.
- Inicialização após gesto do usuário, respeitando a política de autoplay dos navegadores.
- Controle para ligar/desligar, com preferência persistida separadamente do save da partida.
- Falha ou indisponibilidade de Web Audio não deve impedir a partida.

Pontos de integração atuais:

- `gameplay.js`: passos, coleta de pista/item, transição, salto, alerta e captura.
- `index.html`: botão de áudio na navegação.
- `tests/audio.cjs`: controle e persistência da preferência.
- `audio.js`: implementação isolada.

## 4. Sistemas que não devem ser mesclados diretamente

### Combate

O protótipo usa um modelo de ação em tempo real com vida do jogador, pontos de vida da criatura, armas e consumíveis. O jogo atual resolve o confronto a partir de evidências, estratégia e requisitos narrativos.

Mesclar os dois sem decisão de design criaria dois modelos concorrentes de resolução e poderia invalidar os testes de confronto existentes. A implementação de combate deve aguardar uma decisão sobre manter o confronto narrativo, substituí-lo ou criar uma sequência de ação separada.

### Persistência

O protótipo usa flags e uma estrutura de save própria. O jogo atual possui validação de payload, versão 3, compatibilidade com saves v2 e checkpoint da cena 8. Não importar o salvamento antigo nem manter duas fontes de verdade.

### Exploração e mapas

O protótipo desenha o mundo em Canvas, com câmera, colisões e entidades ordenadas por profundidade. O projeto atual posiciona personagem e pontos de interação no DOM/CSS. A lógica de mapa precisa de um adaptador; copiar funções isoladas sem o renderer resultaria em dependências ausentes.

## 5. Ordem de trabalho

1. Corrigir defeitos técnicos reproduzíveis e ampliar os testes de regressão.
2. Portar recursos autônomos de baixo risco, como áudio procedural.
3. Auditar arte procedural e mapear o que pode ser convertido em assets independentes.
4. Avaliar mapas e cenas Canvas como um subsistema separado.
5. Só então decidir e planejar eventual combate de ação.

## 6. Critérios de aceite para cada port

- O módulo novo não altera o roteiro nem a estrutura do save sem necessidade.
- Não cria estado duplicado quando já existe uma fonte de verdade.
- Possui fallback quando API do navegador não está disponível.
- Tem teste automatizado para o comportamento observável.
- Mantém os testes existentes de roteiro, investigação, confronto, perseguição e persistência.
- É documentado com dependências, pontos de integração e limitações.

## 7. Pendências de decisão do autor

- Modelo do confronto final: narrativo, ação em tempo real ou híbrido.
- Escopo de novos mapas próprios e cenas da cidade.
- Se os recursos coletados devem ser consumidos durante o confronto e quais regras definem o consumo.
- Nome oficial a ser padronizado na interface e documentação.

Essas decisões não serão inferidas apenas a partir do código legado.
