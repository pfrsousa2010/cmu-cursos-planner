-- Criar enum para dias da semana
CREATE TYPE dia_semana_enum AS ENUM ('segunda', 'terca', 'quarta', 'quinta', 'sexta');

-- Adicionar novas colunas na tabela cursos
ALTER TABLE cursos 
ADD COLUMN carga_horaria INTEGER NULL,
ADD COLUMN vaga_inicio INTEGER NULL,
ADD COLUMN vaga_fim INTEGER NULL,
ADD COLUMN dia_semana dia_semana_enum[] NOT NULL DEFAULT ARRAY['segunda']::dia_semana_enum[];

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN cursos.carga_horaria IS 'Carga horária total do curso em horas';
COMMENT ON COLUMN cursos.vaga_inicio IS 'Quantidade de alunos com que o curso iniciou';
COMMENT ON COLUMN cursos.vaga_fim IS 'Quantidade de alunos com que o curso finalizou';
COMMENT ON COLUMN cursos.dia_semana IS 'Lista de dias da semana em que o curso é ministrado (obrigatório)';

-- Atualizar função para verificar conflito de curso (incluindo dia da semana)
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
