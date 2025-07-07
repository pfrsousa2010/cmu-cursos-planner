
-- Criar enum para roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'visualizador');

-- Criar enum para períodos
CREATE TYPE periodo_enum AS ENUM ('manha', 'tarde', 'noite');

-- Criar enum para status de curso
CREATE TYPE status_curso AS ENUM ('ativo', 'finalizado');

-- Tabela de Unidades
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Salas
CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Matérias
CREATE TABLE materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Insumos
CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cursos
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  professor TEXT NOT NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  periodo periodo_enum NOT NULL,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE NOT NULL,
  sala_id UUID REFERENCES salas(id) ON DELETE SET NULL,
  status status_curso DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento Curso-Matéria (N:N)
CREATE TABLE curso_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE NOT NULL,
  materia_id UUID REFERENCES materias(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(curso_id, materia_id)
);

-- Tabela de relacionamento Curso-Insumo (N:N) com quantidade
CREATE TABLE curso_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE NOT NULL,
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  UNIQUE(curso_id, insumo_id)
);

-- Tabela de Perfis de Usuário (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'visualizador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'visualizador'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS em todas as tabelas
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para Unidades (apenas admin pode criar)
CREATE POLICY "Todos podem ver unidades" ON unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admin pode criar unidades" ON unidades FOR INSERT TO authenticated 
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Apenas admin pode atualizar unidades" ON unidades FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Apenas admin pode deletar unidades" ON unidades FOR DELETE TO authenticated 
  USING (get_user_role(auth.uid()) = 'admin');

-- Políticas RLS para Salas (admin e editor podem gerenciar)
CREATE POLICY "Todos podem ver salas" ON salas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem criar salas" ON salas FOR INSERT TO authenticated 
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem atualizar salas" ON salas FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem deletar salas" ON salas FOR DELETE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- Políticas RLS para Matérias (admin e editor podem gerenciar)
CREATE POLICY "Todos podem ver materias" ON materias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem criar materias" ON materias FOR INSERT TO authenticated 
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem atualizar materias" ON materias FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem deletar materias" ON materias FOR DELETE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- Políticas RLS para Insumos (admin e editor podem gerenciar)
CREATE POLICY "Todos podem ver insumos" ON insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem criar insumos" ON insumos FOR INSERT TO authenticated 
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem atualizar insumos" ON insumos FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem deletar insumos" ON insumos FOR DELETE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- Políticas RLS para Cursos (admin e editor podem gerenciar)
CREATE POLICY "Todos podem ver cursos" ON cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem criar cursos" ON cursos FOR INSERT TO authenticated 
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem atualizar cursos" ON cursos FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admin e editor podem deletar cursos" ON cursos FOR DELETE TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- Políticas RLS para relacionamentos (admin e editor podem gerenciar)
CREATE POLICY "Todos podem ver curso_materias" ON curso_materias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem gerenciar curso_materias" ON curso_materias FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Todos podem ver curso_insumos" ON curso_insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e editor podem gerenciar curso_insumos" ON curso_insumos FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- Políticas RLS para Profiles (admins podem ver todos, usuários podem ver o próprio)
CREATE POLICY "Admin pode ver todos os perfis" ON profiles FOR SELECT TO authenticated 
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Usuário pode ver próprio perfil" ON profiles FOR SELECT TO authenticated 
  USING (auth.uid() = id);
CREATE POLICY "Admin pode atualizar perfis" ON profiles FOR UPDATE TO authenticated 
  USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Usuário pode atualizar próprio perfil" ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Inserir dados iniciais de exemplo
INSERT INTO unidades (nome, endereco, telefone) VALUES 
  ('Unidade Centro', 'Rua das Flores, 123 - Centro', '(11) 1234-5678'),
  ('Unidade Norte', 'Av. dos Estados, 456 - Zona Norte', '(11) 2345-6789'),
  ('Unidade Sul', 'Rua do Comércio, 789 - Zona Sul', '(11) 3456-7890');

INSERT INTO materias (nome) VALUES 
  ('Português'),
  ('Matemática'),
  ('Informática'),
  ('Artesanato'),
  ('Culinária'),
  ('Costura'),
  ('Empreendedorismo');

INSERT INTO insumos (nome) VALUES 
  ('Papel A4'),
  ('Canetas'),
  ('Lápis'),
  ('Borrachas'),
  ('Tesouras'),
  ('Cola'),
  ('Tecidos'),
  ('Linha de costura'),
  ('Agulhas'),
  ('Ingredientes culinários');

-- Inserir salas para as unidades
INSERT INTO salas (nome, unidade_id, capacidade, observacoes) 
SELECT 'Sala ' || num, u.id, 20, 'Sala equipada com projetor'
FROM unidades u
CROSS JOIN generate_series(1, 3) num;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salas_updated_at BEFORE UPDATE ON salas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
