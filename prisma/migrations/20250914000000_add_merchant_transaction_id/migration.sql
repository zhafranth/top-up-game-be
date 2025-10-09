-- Add merchant_transaction_id to transactions as required varchar(64) with unique index
-- Safe migration for existing data: add nullable, backfill, then enforce NOT NULL and UNIQUE

-- 1) Add column as NULLable first
ALTER TABLE `transactions`
  ADD COLUMN `merchant_transaction_id` VARCHAR(64) NULL;

-- 2) Backfill existing rows with a deterministic unique value (e.g., TRX-<id>)
UPDATE `transactions`
SET `merchant_transaction_id` = CONCAT('TRX-', `id`)
WHERE `merchant_transaction_id` IS NULL;

-- 3) Enforce NOT NULL
ALTER TABLE `transactions`
  MODIFY `merchant_transaction_id` VARCHAR(64) NOT NULL;

-- 4) Add UNIQUE index
CREATE UNIQUE INDEX `transactions_merchant_transaction_id_key`
  ON `transactions`(`merchant_transaction_id`);