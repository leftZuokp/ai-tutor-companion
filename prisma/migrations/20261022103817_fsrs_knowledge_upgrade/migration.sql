/*
  Warnings:

  - You are about to drop the column `nextReviewDate` on the `ErrorBook` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStage` on the `ErrorBook` table. All the data in the column will be lost.
  - Added the required column `due` to the `ErrorBook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeNode" ADD COLUMN "card" TEXT;
ALTER TABLE "KnowledgeNode" ADD COLUMN "prerequisites" TEXT;
ALTER TABLE "KnowledgeNode" ADD COLUMN "thinkingMethods" TEXT;

-- CreateTable
CREATE TABLE "FsrsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorBookId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "stability" REAL NOT NULL,
    "difficulty" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FsrsLog_errorBookId_fkey" FOREIGN KEY ("errorBookId") REFERENCES "ErrorBook" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ErrorBook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 1,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "attribution" TEXT,
    "lastFailedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due" DATETIME NOT NULL,
    "fsrsState" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ErrorBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ErrorBook_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ErrorBook_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ErrorBook" ("createdAt", "errorCount", "id", "isResolved", "lastFailedAt", "nodeId", "questionId", "userId") SELECT "createdAt", "errorCount", "id", "isResolved", "lastFailedAt", "nodeId", "questionId", "userId" FROM "ErrorBook";
DROP TABLE "ErrorBook";
ALTER TABLE "new_ErrorBook" RENAME TO "ErrorBook";
CREATE INDEX "ErrorBook_userId_due_idx" ON "ErrorBook"("userId", "due");
CREATE UNIQUE INDEX "ErrorBook_userId_questionId_key" ON "ErrorBook"("userId", "questionId");
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'single_choice',
    "content" TEXT NOT NULL,
    "options" TEXT,
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "hints" TEXT,
    "dimension" TEXT NOT NULL DEFAULT 'concept',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Question_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("answer", "content", "difficulty", "explanation", "id", "nodeId", "options", "sortOrder", "type") SELECT "answer", "content", "difficulty", "explanation", "id", "nodeId", "options", "sortOrder", "type" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_nodeId_difficulty_idx" ON "Question"("nodeId", "difficulty");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FsrsLog_errorBookId_createdAt_idx" ON "FsrsLog"("errorBookId", "createdAt");
