import { Migration } from '@mikro-orm/migrations';

export class Migration20241211080554 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product_supplier" drop column if exists "product_id";');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_supplier" add column if not exists "product_id" text not null;');
  }

}
