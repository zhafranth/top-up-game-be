-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `product_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
