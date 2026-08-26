-- CreateTable
CREATE TABLE "UserHistory" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousRole" "Role",
    "newRole" "Role",
    "previousStatus" "AccountStatus",
    "newStatus" "AccountStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetUserId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserHistory_targetUserId_idx" ON "UserHistory"("targetUserId");

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
