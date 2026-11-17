# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

## [Unreleased]

### Corrigido
- Colisões do mapa genérico de teste deixam de bloquear o jogador quando o mapa está oculto.
- Servidor HTTP dos testes usa APIs nativas do Node, sem dependência de `python3`.
- Imports de `path` restaurados em `audio.cjs` e `save-feedback.cjs`.
- Falha ao salvar o progresso exibe aviso persistente e acessível; um salvamento posterior bem-sucedido remove o aviso.
- Visão da criatura agora respeita obstáculos sólidos na cena 7.
- Passos e ruído só são emitidos quando Alex realmente se desloca; o estado de corrida também depende do deslocamento.

### Adicionado
- Teste de regressão da exploração para colisões invisíveis nas cenas 1 e 9.
- Testes de perseguição para linha de visão, alcance visual agachado e ruído com/sem deslocamento.
- Módulo independente de efeitos sonoros procedurais com Web Audio.
- Controle para ativar/desativar efeitos sonoros, com preferência persistida separadamente do progresso.
- Efeitos de passos, coleta, interação, salto, alerta da criatura e captura.
- Testes de regressão para falha de salvamento e controle de áudio.
- Plano documentado para integração segura dos sistemas do protótipo 20.

### Validação
- Execução de referência no Windows em 17/11/2026: **11 suítes, 206 verificações aprovadas, 0 falhas**.
- As alterações posteriores na perseguição ainda aguardam nova execução de `npm test`; os 206 resultados não as cobrem.
- Suítes: audio (5), chase (16), checkpoint (16), confronto (51), display (14), exploration (8), graph (11), intro (12), restart (26), save-feedback (7), save-integrity (40).

### Ainda pendente
- Testes em Firefox, Safari e dispositivos reais.
- Auditoria de acessibilidade e validação da versão publicada.
- Decisões narrativas e de design listadas em `docs/PENDENCIAS_2026-11-17.md`.
