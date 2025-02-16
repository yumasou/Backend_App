-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "lastReadMessageId" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Massage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "chatId" INTEGER NOT NULL,
    "createAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL,
    CONSTRAINT "Massage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Massage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Massage" ("chatId", "content", "createAt", "id", "senderId", "updateAt") SELECT "chatId", "content", "createAt", "id", "senderId", "updateAt" FROM "Massage";
DROP TABLE "Massage";
ALTER TABLE "new_Massage" RENAME TO "Massage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
