-- Criar trigger para auth.users (esquema auth, não public)
-- Primeiro, vamos garantir que a função existe no esquema correto

-- Recriar a função no esquema public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir o perfil diretamente, ignorando se já existe
  INSERT INTO public.profiles (id, nome, email, role, isActive)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'visualizador',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não quebrar o processo
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger no esquema auth (se possível)
-- Nota: Em alguns casos, o Supabase pode não permitir triggers no esquema auth
-- Por isso, vamos também criar uma função que pode ser chamada manualmente

-- Função para criar perfil manualmente (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_name TEXT, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, isActive)
  VALUES (user_id, user_name, user_email, 'visualizador', true)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tentar criar o trigger (pode falhar se não tiver permissão)
DO $$
BEGIN
  -- Remover trigger existente se houver
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Criar novo trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
  RAISE NOTICE 'Trigger criado com sucesso';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Não foi possível criar trigger no auth.users - usando fallback manual';
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar trigger: %', SQLERRM;
END $$;
