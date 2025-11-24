-- AlterTable
ALTER TABLE `products` ADD COLUMN `actual_price` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `actual_price` INTEGER NULL DEFAULT 0,
    ADD COLUMN `price` INTEGER NULL DEFAULT 0;
