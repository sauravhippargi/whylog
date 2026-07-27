-- Phase 3: enable pgvector and add the Decision.embedding column.
-- Hand-written raw-SQL migration (rules.md §4): the vector type must exist
-- before the column can be added, and Prisma does not manage extensions.
-- Dimension is 768 to match gemini-embedding-001 with outputDimensionality=768.

CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Decision" ADD COLUMN "embedding" vector(768);
