-- Remove a coluna status da tabela cursos
ALTER TABLE cursos DROP COLUMN IF EXISTS status;

-- Remove o enum status_curso se não estiver sendo usado em outras tabelas
DROP TYPE IF EXISTS status_curso;
