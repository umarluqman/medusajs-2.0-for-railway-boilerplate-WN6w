import { Migration } from '@mikro-orm/migrations';

export class Migration20241205135001 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "supplier" ("id" text not null, "name" text not null, "email" text not null, "phone" text not null, "address" text not null, "description" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));');

    this.addSql('create table if not exists "product_supplier" ("id" text not null, "supplier_id" text not null, "product_id" text not null, "supply_price" integer null, "minimum_order_quantity" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_supplier_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product_supplier_supplier_id" ON "product_supplier" (supplier_id) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "product_supplier" add constraint "product_supplier_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_supplier" drop constraint if exists "product_supplier_supplier_id_foreign";');

    this.addSql('drop table if exists "supplier" cascade;');

    this.addSql('drop table if exists "product_supplier" cascade;');
  }

}
