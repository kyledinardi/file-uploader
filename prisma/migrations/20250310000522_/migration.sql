/*
  Warnings:

  - You are about to drop the column `shareExpires` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `shareUrl` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `shareExpires` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `shareUrl` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "shareExpires",
DROP COLUMN "shareUrl";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "shareExpires",
DROP COLUMN "shareUrl";

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FolderToShare" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FolderToShare_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FileToShare" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileToShare_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FolderToShare_B_index" ON "_FolderToShare"("B");

-- CreateIndex
CREATE INDEX "_FileToShare_B_index" ON "_FileToShare"("B");

-- AddForeignKey
ALTER TABLE "_FolderToShare" ADD CONSTRAINT "_FolderToShare_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToShare" ADD CONSTRAINT "_FolderToShare_B_fkey" FOREIGN KEY ("B") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToShare" ADD CONSTRAINT "_FileToShare_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToShare" ADD CONSTRAINT "_FileToShare_B_fkey" FOREIGN KEY ("B") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;
