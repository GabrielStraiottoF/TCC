# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

## [Unreleased]

### Corrigido
- Exibição de aviso persistente e acessível quando o navegador falha ao salvar o progresso.
- Remoção automática do aviso após um salvamento bem-sucedido.

### Adicionado
- Módulo independente de efeitos sonoros procedurais com Web Audio.
- Controle para ativar/desativar efeitos sonoros, com preferência persistida separadamente do progresso.
- Efeitos de passos, coleta, interação, salto, alerta da criatura e captura.
- Testes de regressão para falha de salvamento e controle de áudio.
- Plano documentado para integração segura dos sistemas do protótipo 20.

### Validação pendente
- Executar `npm test` em ambiente com Playwright e Chromium instalados.
- Verificar áudio e controles em navegadores e dispositivos reais.
