# Guia de Versionamento - Gestor de Cursos CMU

Este documento descreve as diretrizes de versionamento para o projeto CMU Cursos Planner.

## Versionamento Semântico

O projeto segue o [Versionamento Semântico (SemVer)](https://semver.org/lang/pt-BR/) com o formato `MAJOR.MINOR.PATCH`:

- **MAJOR** (X.0.0): Mudanças incompatíveis na API ou funcionalidades que quebram compatibilidade
- **MINOR** (X.Y.0): Novas funcionalidades adicionadas de forma compatível
- **PATCH** (X.Y.Z): Correções de bugs compatíveis

## Estrutura de Versionamento

### Versões Principais (MAJOR)
- Mudanças significativas na arquitetura
- Remoção de funcionalidades existentes
- Mudanças incompatíveis na API
- Alterações que requerem migração de dados

### Versões Menores (MINOR)
- Novas funcionalidades
- Melhorias na interface
- Novos componentes ou páginas
- Novos tipos de relatórios
- Melhorias de performance

### Versões de Correção (PATCH)
- Correções de bugs
- Ajustes de interface
- Melhorias de acessibilidade
- Correções de segurança
- Ajustes de performance

## Processo de Release

### 1. Preparação da Release

1. **Atualizar CHANGELOG.md**
   - Adicionar nova seção para a versão
   - Documentar todas as mudanças
   - Seguir o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

2. **Atualizar package.json**
   - Incrementar a versão conforme o tipo de mudança
   - Verificar se todas as dependências estão atualizadas

3. **Testes**
   - Executar todos os testes
   - Verificar se não há erros de linting
   - Testar funcionalidades principais

### 2. Criação da Release

1. **Commit das mudanças**
   ```bash
   git add .
   git commit -m "chore: prepare release vX.Y.Z"
   ```

2. **Criar tag Git**
   ```bash
   git tag -a vX.Y.Z -m "Release version X.Y.Z"
   ```

3. **Push para repositório**
   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

### 3. Documentação da Release

1. **Atualizar README.md** (se necessário)
2. **Criar Release Notes no GitHub** (se usando GitHub)
3. **Notificar equipe** sobre a nova versão

## Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Tipos de Commit

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Formatação, ponto e vírgula ausente, etc.
- **refactor**: Refatoração de código
- **perf**: Melhorias de performance
- **test**: Adição ou correção de testes
- **chore**: Mudanças em ferramentas, configurações, etc.

### Exemplos

```bash
feat(calendario): adicionar filtro por período
fix(dashboard): corrigir cálculo de métricas
docs(readme): atualizar instruções de instalação
style(ui): ajustar espaçamento dos componentes
refactor(hooks): simplificar lógica de exportação
perf(relatorios): otimizar geração de PDFs
test(components): adicionar testes para CalendarioMensal
chore(deps): atualizar dependências do projeto
```

## Histórico de Versões

### v1.0.0 (2025-01-15)
- **Tipo**: MAJOR
- **Descrição**: Release inicial com sistema completo de planejamento de cursos
- **Funcionalidades**:
  - Dashboard com métricas e gráficos
  - Calendário mensal e semanal
  - Gerenciamento completo de cursos
  - Sistema de relatórios com exportação
  - Gerenciamento de usuários e permissões
  - Integração com Supabase
  - Interface responsiva com tema claro/escuro

## Próximas Versões Planejadas

### v1.1.0 (Planejada)
- **Tipo**: MINOR
- **Funcionalidades**:
  - Notificações em tempo real
  - Melhorias na interface do usuário
  - Novos tipos de relatórios
  - Sistema de backup automático

### v1.2.0 (Futura)
- **Tipo**: MINOR
- **Funcionalidades**:
  - Integração com sistemas externos
  - API REST para integrações
  - Sistema de auditoria
  - Dashboard avançado com mais métricas

## Ferramentas de Apoio

### Automatização
- **Git Hooks**: Para validação de commits
- **GitHub Actions**: Para CI/CD e releases automáticas
- **Conventional Changelog**: Para geração automática de changelog

### Comandos Úteis

```bash
# Ver versão atual
npm version

# Incrementar versão patch
npm version patch

# Incrementar versão minor
npm version minor

# Incrementar versão major
npm version major

# Ver tags existentes
git tag -l

# Ver informações de uma tag
git show v1.0.0
```

## Contato

Para dúvidas sobre versionamento, entre em contato com a equipe de desenvolvimento do CMU.
