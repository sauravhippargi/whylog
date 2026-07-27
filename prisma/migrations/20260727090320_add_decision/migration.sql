-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decisionSummary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "alternativesConsidered" TEXT,
    "decidedBy" TEXT,
    "decisionDate" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "links" TEXT[],
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Decision_supersededById_key" ON "Decision"("supersededById");

-- CreateIndex
CREATE INDEX "Decision_projectId_idx" ON "Decision"("projectId");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
