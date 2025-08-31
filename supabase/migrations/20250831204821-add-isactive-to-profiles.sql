-- Adicionar coluna isActive na tabela profiles
ALTER TABLE profiles 
ADD COLUMN isActive BOOLEAN DEFAULT true NOT NULL;

-- Comentário para documentar a coluna
COMMENT ON COLUMN profiles.isActive IS 'Indica se o perfil do usuário está ativo ou não';

-- Atualizar a função handle_new_user para incluir isActive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, isActive)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'visualizador',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;