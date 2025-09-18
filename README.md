# Gestor de Cursos Clube das Mães Unidas (CMU)

Sistema de planejamento e gerenciamento de cursos.

## 📋 Sobre o Projeto

O Gestor de cursos CMU é uma aplicação web desenvolvida para facilitar o planejamento, gerenciamento e acompanhamento de cursos oferecidos pela ONG Clube das Mães Unidas (CMU). O sistema oferece uma interface intuitiva para administradores e usuários visualizarem cursos, gerar relatórios e gerenciar recursos.

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral com métricas de cursos
- Gráficos de ocupação e performance
- Estatísticas em tempo real
- Lista de cursos próximos

### 📅 Calendário
- Visualização mensal e semanal
- Filtros por período e tipo de curso
- Navegação intuitiva entre datas
- Exportação de calendários

### 📚 Gerenciamento de Cursos
- CRUD completo para cursos
- Controle de vagas e status
- Gestão de insumos e materiais
- Sistema de aprovação

### 📊 Relatórios
- Geração de relatórios detalhados
- Exportação em PDF e Excel
- Métricas de performance
- Análise de ocupação

### 👥 Usuários
- Sistema de autenticação
- Controle de permissões
- Perfis de usuário
- Gestão de acessos

## 🚀 Tecnologias

- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1
- **Styling**: Tailwind CSS 3.4.11 + shadcn/ui
- **Backend**: Supabase 2.50.3
- **Routing**: React Router DOM 6.26.2
- **Charts**: Recharts 2.12.7
- **Forms**: React Hook Form 7.53.0 + Zod 3.23.8

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase

### Passos para instalação

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd cmu-cursos-planner
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run build:dev` - Gera build de desenvolvimento
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── calendario/     # Componentes do calendário
│   ├── dashboard/      # Componentes do dashboard
│   └── ui/            # Componentes de interface
├── contexts/           # Contextos React
├── hooks/             # Hooks customizados
├── integrations/      # Integrações externas
│   └── supabase/      # Configuração do Supabase
├── lib/               # Utilitários
├── pages/             # Páginas da aplicação
├── types/             # Definições de tipos TypeScript
└── utils/             # Funções utilitárias
```

## 🔄 Versionamento

Este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades adicionadas de forma compatível
- **PATCH**: Correções de bugs compatíveis

Veja o [CHANGELOG.md](./CHANGELOG.md) para detalhes das versões.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, entre em contato através dos canais oficiais da Micro Focus Pro.

**Email**: microfocuspro@gmail.com

---

**Versão atual**: 1.0.0  
**Última atualização**: Setembro 2025
