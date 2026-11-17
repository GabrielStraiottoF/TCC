# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

## [Unreleased]

### Corrigido
- Colisões do mapa genérico de teste deixam de bloquear o jogador quando o mapa está oculto.
- Inicialização do servidor HTTP dos testes sem dependência de `python3`, usando servidor nativo do Node para compatibilidade com Windows.
- Exibição de aviso persistente e acessível quando o navegador falha ao salvar o progresso.
- Remoção automática do aviso após um salvamento bem-sucedido.

### Adicionado
- Teste de regressão da exploração para colisões invisíveis nas cenas 1 e 9.
- Módulo independente de efeitos sonoros procedurais com Web Audio.
- Controle para ativar/desativar efeitos sonoros, com preferência persistida separadamente do progresso.
- Efeitos de passos, coleta, interação, salto, alerta da criatura e captura.
- Testes de regressão para falha de salvamento e controle de áudio.
- Plano documentado para integração segura dos sistemas do protótipo 20.

### Validação
- `npm test` executado no Windows em 17/11/2026: 10 suítes, 198 verificações aprovadas e 0 falhas.

### Ainda pendente
- Executar `npm test` após a correção das colisões invisíveis.
- Verificar áudio e controles em navegadores e dispositivos reais.
- Validar acessibilidade e a versão publicada.
