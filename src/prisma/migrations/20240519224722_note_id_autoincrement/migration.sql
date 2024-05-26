-- AlterTable
CREATE SEQUENCE notes_id_seq;
ALTER TABLE "notes" ALTER COLUMN "id" SET DEFAULT nextval('notes_id_seq');
ALTER SEQUENCE notes_id_seq OWNED BY "notes"."id";
