-- AlterTable
ALTER TABLE "TeamindelingPublicatie" ADD COLUMN "toelichtingBlokken" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "kalenderBlokken" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "kennismakingBlokken" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "tcOproepBlokken" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "vragenBlokken" JSONB NOT NULL DEFAULT '[]';
