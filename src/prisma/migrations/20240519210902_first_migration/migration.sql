-- CreateTable
CREATE TABLE "nabs_names" (
    "id" SERIAL NOT NULL,
    "nab_id" INTEGER NOT NULL,
    "name_idx" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "nabs_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nabs" (
    "id" INTEGER NOT NULL,
    "elo" INTEGER NOT NULL,
    "avatar" TEXT NOT NULL,
    "last_page" INTEGER NOT NULL DEFAULT 1,
    "region" TEXT NOT NULL,
    "syncer" BOOLEAN NOT NULL DEFAULT false,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "streak" INTEGER NOT NULL,

    CONSTRAINT "nabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" INTEGER NOT NULL,
    "nab_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitch_nabs" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "twitch_nabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nab_games" (
    "game_id" TEXT NOT NULL,
    "nab_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nabs_names_name_idx_idx" ON "nabs_names"("name_idx");

-- CreateIndex
CREATE INDEX "notes_nab_id_idx" ON "notes"("nab_id");

-- CreateIndex
CREATE INDEX "nab_games_nab_id_idx" ON "nab_games"("nab_id");

-- CreateIndex
CREATE INDEX "nab_games_game_id_idx" ON "nab_games"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "nab_games_game_id_nab_id_key" ON "nab_games"("game_id", "nab_id");
