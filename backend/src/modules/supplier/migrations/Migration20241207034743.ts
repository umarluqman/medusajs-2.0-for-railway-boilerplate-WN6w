import { Migration } from '@mikro-orm/migrations';

export class Migration20241207034743 extends Migration {

  async up(): Promise<void> {
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product_supplier_deleted_at" ON "product_supplier" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_supplier_deleted_at";');

    this.addSql('drop index if exists "IDX_product_supplier_deleted_at";');
  }

}
