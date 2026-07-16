-- Clear all related data first
DELETE FROM "AuditLog";
DELETE FROM "MonthlySettlement";
DELETE FROM "Notification";
DELETE FROM "PushSubscription";
DELETE FROM "User";

-- Update enum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN');
EXCEPTION WHEN duplicate_object THEN
  ALTER TYPE "UserRole" RENAME TO "UserRole_old";
  CREATE TYPE "UserRole" AS ENUM ('ADMIN');
  DROP TYPE "UserRole_old";
END $$;
