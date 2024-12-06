import { Migration } from '@mikro-orm/migrations';

export class Migration20241206023829 extends Migration {

  async up(): Promise<void> {
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_supplier_name" ON "supplier" (name) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_supplier_name";');
  }

}
