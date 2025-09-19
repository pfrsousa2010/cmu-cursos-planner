# Regras de Negócio - Gestor de Cursos CMU

## 📋 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Regras de Usuários e Permissões](#2-regras-de-usuários-e-permissões)
3. [Regras de Cursos](#3-regras-de-cursos)
4. [Regras de Calendário e Agendamento](#4-regras-de-calendário-e-agendamento)
5. [Regras de Relatórios e Exportação](#5-regras-de-relatórios-e-exportação)
6. [Regras de Validação e Integridade](#6-regras-de-validação-e-integridade)
7. [Regras de Interface e UX](#7-regras-de-interface-e-ux)
8. [Regras de Dados e Estrutura](#8-regras-de-dados-e-estrutura)
9. [Fluxos de Validação](#9-fluxos-de-validação)
10. [Exceções e Casos Especiais](#10-exceções-e-casos-especiais)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito
O Gestor de Cursos CMU é um sistema web para planejamento, gerenciamento e acompanhamento de cursos oferecidos pela ONG Clube das Mães Unidas (CMU).

### 1.2 Funcionalidades Principais
- **Dashboard**: Métricas e estatísticas em tempo real
- **Calendário**: Visualização mensal e semanal de cursos
- **Gerenciamento de Cursos**: CRUD completo com controle de vagas e status
- **Relatórios**: Geração e exportação de relatórios detalhados
- **Gestão de Usuários**: Sistema de autenticação e controle de permissões
- **Gestão de Recursos**: Unidades, salas, matérias e insumos

### 1.3 Tecnologias
- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Backend**: Supabase 2.50.3
- **UI**: Tailwind CSS 3.4.11 + shadcn/ui
- **Build**: Vite 5.4.1

---

## 2. Regras de Usuários e Permissões

### 2.1 Níveis de Acesso

#### 2.1.1 Admin
- **Acesso completo** a todas as funcionalidades
- **Gerenciamento de usuários** (único nível com esta permissão)
- **Gerenciamento de unidades e salas**
- **Gerenciamento de cursos, matérias e insumos**
- **Acesso a relatórios**

#### 2.1.2 Editor
- **Gerenciamento de cursos** (criar, editar, excluir)
- **Gerenciamento de unidades e salas**
- **Gerenciamento de matérias e insumos**
- **Acesso a relatórios**
- **NÃO pode gerenciar usuários**

#### 2.1.3 Visualizador
- **Apenas visualização** de dados
- **NÃO pode criar, editar ou excluir** nenhum registro
- **Acesso limitado**

### 2.2 Regras de Autenticação

#### 2.2.1 Login
- **Email obrigatório** e deve estar confirmado
- **Senha obrigatória**
- **Usuário deve estar ativo** (`isActive = true`)
- **Sessão válida** é verificada automaticamente

#### 2.2.2 Controle de Sessão
- **Verificação automática** de token válido
- **Logout automático** se usuário inativo
- **Logout automático** se token inválido
- **Renovação automática** de token quando possível

#### 2.2.3 Usuários Inativos
- **Bloqueio imediato** de acesso
- **Logout automático** ao tentar acessar
- **Mensagem específica** para usuário inativo

---

## 3. Regras de Cursos

### 3.1 Estrutura de Curso

#### 3.1.1 Campos Obrigatórios
- **Título**: Nome do curso
- **Professor**: Nome do instrutor
- **Período**: Manhã, Tarde ou Noite
- **Data de Início**: Data de início do curso
- **Data de Fim**: Data de término do curso
- **Sala**: Sala onde será ministrado
- **Unidade**: Unidade da CMU
- **Matérias**: Matérias do curso
- **Dias da Semana**: Array de dias (segunda a sexta)

#### 3.1.2 Campos Opcionais
- **Carga Horária**: Número de horas do curso
- **Insumos**: Insumos do curso
- **Vagas**: Número total de vagas disponíveis
- **Alunos Iniciaram**: Quantidade de alunos que iniciaram
- **Alunos Concluíram**: Quantidade de alunos que concluíram

### 3.2 Períodos de Curso

#### 3.2.1 Períodos Válidos
- **Manhã** (`manha`)
- **Tarde** (`tarde`)
- **Noite** (`noite`)

#### 3.2.2 Ordenação de Períodos
1. Manhã (prioridade 1)
2. Tarde (prioridade 2)
3. Noite (prioridade 3)

### 3.3 Dias da Semana

#### 3.3.1 Dias Válidos
- **Segunda-feira** (`segunda`)
- **Terça-feira** (`terca`)
- **Quarta-feira** (`quarta`)
- **Quinta-feira** (`quinta`)
- **Sexta-feira** (`sexta`)

#### 3.3.2 Regras de Dias
- **Fins de semana não permitidos** (sábado e domingo)
- **Múltiplos dias** podem ser selecionados
- **Pelo menos um dia** deve ser selecionado
- **Valor padrão**: Segunda-feira

### 3.4 Status de Curso

#### 3.4.1 Cálculo Automático de Status
```typescript
// Regra de cálculo de status
if (dataInicio > hoje) return 'Previsto'
if (dataInicio <= hoje && dataFim >= hoje) return 'Em andamento'
if (dataFim < hoje) return 'Finalizado'
```

#### 3.4.2 Estados de Status
- **Previsto**: Curso ainda não iniciou
- **Em andamento**: Curso está acontecendo
- **Finalizado**: Curso já terminou

#### 3.4.3 Cores de Status
- **Previsto**: Azul (`bg-blue-100 text-blue-800`)
- **Em andamento**: Verde (`bg-green-100 text-green-800`)
- **Finalizado**: Vermelho (`bg-red-100 text-red-800`)

---

## 4. Regras de Calendário e Agendamento

### 4.1 Visualizações de Calendário

#### 4.1.1 Calendário Mensal
- **Exibição por mês** completo
- **Linhas por sala e período** (manhã, tarde, noite)
- **Colunas por dia** do mês
- **Fins de semana desabilitados** para interação

#### 4.1.2 Calendário Semanal
- **Exibição por semana** (segunda a sexta)
- **Linhas por sala e período**
- **Colunas por dia** da semana
- **Fins de semana removidos** da visualização

### 4.2 Regras de Agendamento

#### 4.2.1 Conflitos de Agendamento
**NÃO é permitido** ter cursos com:
- **Mesma sala**
- **Mesmo período**
- **Dias da semana sobrepostos**
- **Datas sobrepostas**

#### 4.2.2 Validação de Conflitos
```sql
-- Regra SQL para verificar conflitos
WHERE sala_id = NEW.sala_id 
  AND periodo = NEW.periodo 
  AND dia_semana && NEW.dia_semana -- Arrays têm elementos em comum
  AND (NEW.inicio <= fim AND NEW.fim >= inicio) -- Datas sobrepostas
```

### 4.3 Regras de Exibição

#### 4.3.1 Fins de Semana
- **Células vazias** sem interação
- **Fundo cinza** para indicar indisponibilidade
- **Nenhum curso** pode ser agendado

#### 4.3.2 Dispositivos Móveis
- **Usuários visualizadores**: Apenas visualização
- **Usuários editores/admin**: Interação limitada
- **Relatórios ocultos** em dispositivos móveis

### 4.4 Ordenação de Cursos

#### 4.4.1 Ordem de Prioridade
1. **Unidade** (alfabética)
2. **Período** (manhã → tarde → noite)
3. **Sala** (alfabética)

#### 4.4.2 Agrupamento
- **Por unidade e sala** nos relatórios
- **Cursos finalizados** aparecem no final
- **Cursos ativos** têm prioridade

---

## 5. Regras de Relatórios e Exportação

### 5.1 Tipos de Relatórios

#### 5.1.1 Relatórios de Cursos
- **Lista completa** de cursos
- **Filtros por período** e tipo
- **Estatísticas** de ocupação e performance
- **Exportação** em PDF e Excel

#### 5.1.2 Relatórios de Dashboard
- **Métricas em tempo real**
- **Gráficos de ocupação**
- **Análise de evasão**
- **Distribuição por período**

### 5.2 Regras de Exportação

#### 5.2.1 Formato PDF
- **Orientação paisagem** para melhor visualização
- **Tabelas formatadas** com larguras específicas
- **Cabeçalho** com informações do relatório
- **Rodapé** com data de geração

#### 5.2.2 Formato Excel
- **Múltiplas planilhas** (dados + estatísticas)
- **Colunas dimensionadas** automaticamente
- **Formatação** preservada
- **Filtros** habilitados

### 5.3 Cálculos de Estatísticas

#### 5.3.1 Taxa de Ocupação
```typescript
// Cálculo de ocupação por sala
const ocupacaoMedia = sala.quantidade > 0 ? 
  (sala.totalAlunosConcluiram / sala.quantidade) : 0;
const taxaOcupacao = sala.capacidade > 0 ? 
  (ocupacaoMedia / sala.capacidade) * 100 : 0;
```

#### 5.3.2 Taxa de Evasão
```typescript
// Cálculo de evasão de alunos
const evasao = (alunosIniciaram - alunosConcluiram);
const taxaEvasao = alunosIniciaram > 0 ? 
  (evasao / alunosIniciaram) * 100 : 0;
```

---

## 6. Regras de Validação e Integridade

### 6.1 Validações de Curso

#### 6.1.1 Validações Obrigatórias
- **Título**: Não pode ser vazio
- **Professor**: Não pode ser vazio
- **Matéria**: Não pode ser vazio
- **Período**: Deve ser um dos valores válidos
- **Datas**: Data início < Data fim
- **Sala**: Deve existir e estar ativa
- **Unidade**: Deve existir e estar ativa
- **Dias da semana**: Pelo menos um dia válido

#### 6.1.2 Validações de Negócio
- **Conflitos de agendamento**: Verificação automática
- **Datas futuras**: Validação de consistência
- **Capacidade da sala**: Verificação de vagas disponíveis

### 6.2 Validações de Usuário

#### 6.2.1 Validações de Login
- **Email**: Formato válido e confirmado
- **Senha**: Não pode ser vazia
- **Usuário ativo**: Verificação de status

#### 6.2.2 Validações de Permissão
- **Acesso a funcionalidades**: Baseado no role
- **Operações CRUD**: Verificação de permissões
- **Recursos específicos**: Validação por contexto

---

## 7. Regras de Interface e UX

### 7.1 Responsividade

#### 7.1.1 Dispositivos Móveis
- **Menu lateral** colapsável
- **Relatórios ocultos** (performance)
- **Interações limitadas** para visualizadores
- **Layout adaptativo** para telas pequenas

#### 7.1.2 Tablets
- **Layout intermediário** entre mobile e desktop
- **Funcionalidades reduzidas** comparado ao desktop
- **Navegação otimizada** para touch

### 7.2 Tema e Cores

#### 7.2.1 Tema Claro/Escuro
- **Suporte automático** baseado no sistema
- **Cores consistentes** entre temas
- **Transições suaves** entre modos

#### 7.2.2 Cores por Unidade
- **Cores únicas** geradas por hash do nome
- **Consistência** entre componentes
- **Contraste adequado** para acessibilidade

### 7.3 Navegação

#### 7.3.1 Menu Principal
- **Itens dinâmicos** baseados em permissões
- **Ícones consistentes** com Lucide React
- **Indicadores visuais** de página ativa

#### 7.3.2 Breadcrumbs
- **Navegação hierárquica** clara
- **Links funcionais** para navegação
- **Contexto atual** sempre visível

---

## 8. Regras de Dados e Estrutura

### 8.1 Estrutura de Banco de Dados

#### 8.1.1 Tabela Cursos
```sql
-- Campos principais
id: UUID (PK)
titulo: VARCHAR (obrigatório)
professor: VARCHAR (obrigatório)
periodo: ENUM('manha', 'tarde', 'noite') (obrigatório)
inicio: DATE (obrigatório)
fim: DATE (obrigatório)
sala_id: UUID (FK, obrigatório)
unidade_id: UUID (FK, obrigatório)
dia_semana: dia_semana_enum[] (obrigatório)
carga_horaria: INTEGER (opcional)
vagas: INTEGER (opcional)
qtd_alunos_iniciaram: INTEGER (opcional)
qtd_alunos_concluiram: INTEGER (opcional)
```

#### 8.1.2 Tabela Profiles
```sql
-- Campos de usuário
id: UUID (PK, FK para auth.users)
email: VARCHAR (obrigatório)
nome: VARCHAR (opcional)
role: ENUM('admin', 'editor', 'visualizador') (obrigatório)
isActive: BOOLEAN (obrigatório, padrão true)
```

### 8.2 Relacionamentos

#### 8.2.1 Cursos → Salas
- **Relacionamento obrigatório**
- **Cascade delete** não permitido
- **Integridade referencial** mantida

#### 8.2.2 Cursos → Unidades
- **Relacionamento obrigatório**
- **Cascade delete** não permitido
- **Integridade referencial** mantida

### 8.3 Triggers e Constraints

#### 8.3.1 Trigger de Conflito
```sql
-- Verificação automática de conflitos
CREATE TRIGGER verificar_conflito_curso
  BEFORE INSERT OR UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION verificar_conflito_curso();
```

#### 8.3.2 Constraints de Integridade
- **Foreign keys** para salas e unidades
- **Check constraints** para períodos válidos
- **Not null** para campos obrigatórios

---

## 9. Fluxos de Validação

### 9.1 Criação de Curso

#### 9.1.1 Fluxo de Validação
1. **Validação de campos obrigatórios**
2. **Verificação de conflitos de agendamento**
3. **Validação de datas** (início < fim)
4. **Verificação de permissões** do usuário
5. **Inserção no banco** com triggers

#### 9.1.2 Tratamento de Erros
- **Mensagens específicas** para cada tipo de erro
- **Rollback automático** em caso de falha
- **Feedback visual** para o usuário

### 9.2 Login de Usuário

#### 9.2.1 Fluxo de Autenticação
1. **Validação de credenciais**
2. **Verificação de email confirmado**
3. **Verificação de usuário ativo**
4. **Criação de sessão**
5. **Carregamento de perfil**

#### 9.2.2 Casos de Erro
- **Email não confirmado**: Mensagem específica
- **Usuário inativo**: Logout automático
- **Credenciais inválidas**: Mensagem genérica

---

## 10. Exceções e Casos Especiais

### 10.1 Casos de Erro Comum

#### 10.1.1 Conflitos de Agendamento
- **Mensagem**: "Já existe um curso na mesma sala, período e dias da semana sobrepostos com datas sobrepostas"
- **Ação**: Impedir criação/edição
- **Solução**: Sugerir alteração de horário ou sala

#### 10.1.2 Usuário Inativo
- **Mensagem**: "Conta inativa. Entre em contato com o administrador"
- **Ação**: Logout automático
- **Solução**: Ativar usuário via painel admin

### 10.2 Casos Especiais de Interface

#### 10.2.1 Fins de Semana
- **Comportamento**: Células desabilitadas
- **Visual**: Fundo cinza com opacidade
- **Interação**: Nenhuma ação permitida

#### 10.2.2 Dispositivos Móveis
- **Relatórios**: Ocultos para melhor performance
- **Interações**: Limitadas baseadas em permissões
- **Layout**: Adaptado para touch

### 10.3 Tratamento de Dados Ausentes

#### 10.3.1 Valores Nulos
- **Campos opcionais**: Exibidos como "Não informado"
- **Relacionamentos**: Exibidos como "Sem [recurso]"
- **Cálculos**: Tratados como zero

#### 10.3.2 Dados Inconsistentes
- **Validação automática** antes da exibição
- **Correção sugerida** quando possível
- **Log de erros** para administradores

---

## 📝 Notas de Manutenção

### Atualizações
- **Versão atual**: 1.0.0
- **Última atualização**: Setembro 2025
- **Próxima revisão**: A cada mudança significativa nas regras

### Contato
- **Desenvolvedor**: Micro Focus Pro
- **Email**: microfocuspro@gmail.com
- **Repositório**: [https://github.com/pfrsousa2010/cmu-cursos-planner](https://github.com/pfrsousa2010/cmu-cursos-planner)

---

*Este documento deve ser atualizado sempre que houver mudanças nas regras de negócio do sistema.*
