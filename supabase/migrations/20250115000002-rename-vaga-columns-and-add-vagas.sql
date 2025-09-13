-- Renomear colunas de vagas para quantidades de alunos
ALTER TABLE cursos 
RENAME COLUMN vaga_inicio TO qtd_alunos_iniciaram;

ALTER TABLE cursos 
RENAME COLUMN vaga_fim TO qtd_alunos_concluiram;

-- Adicionar nova coluna vagas
ALTER TABLE cursos 
ADD COLUMN vagas INTEGER NULL;
