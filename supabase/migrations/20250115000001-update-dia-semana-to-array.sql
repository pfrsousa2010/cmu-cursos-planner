-- Primeiro, remover o valor padrão
ALTER TABLE cursos ALTER COLUMN dia_semana DROP DEFAULT;

-- Alterar coluna dia_semana de enum único para array de enums
ALTER TABLE cursos 
ALTER COLUMN dia_semana TYPE dia_semana_enum[] 
USING ARRAY[dia_semana]::dia_semana_enum[];

-- Adicionar novo valor padrão como array
ALTER TABLE cursos ALTER COLUMN dia_semana SET DEFAULT ARRAY['segunda']::dia_semana_enum[];

-- Atualizar função para verificar conflito de curso (incluindo array de dias da semana)
CREATE OR REPLACE FUNCTION verificar_conflito_curso()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se existe outro curso na mesma sala, mesmo período, com dias da semana sobrepostos, com datas sobrepostas
  IF EXISTS (
    SELECT 1 
    FROM cursos 
    WHERE sala_id = NEW.sala_id 
      AND periodo = NEW.periodo 
      AND dia_semana && NEW.dia_semana -- Operador && verifica se os arrays têm elementos em comum
      AND id != COALESCE(NEW.id, gen_random_uuid()) -- Para INSERT, NEW.id será NULL
      AND (
        -- Verificar sobreposição de datas
        (NEW.inicio <= fim AND NEW.fim >= inicio)
      )
  ) THEN
    RAISE EXCEPTION 'Já existe um curso na mesma sala, período e dias da semana sobrepostos com datas sobrepostas';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar comentário da coluna
COMMENT ON COLUMN cursos.dia_semana IS 'Lista de dias da semana em que o curso é ministrado (obrigatório)';
