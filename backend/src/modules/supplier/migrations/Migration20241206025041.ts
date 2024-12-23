import { Migration } from '@mikro-orm/migrations';

export class Migration20241206025041 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "supplier" alter column "email" type text using ("email"::text);');
    this.addSql('alter table if exists "supplier" alter column "email" drop not null;');
    this.addSql('alter table if exists "supplier" alter column "phone" type text using ("phone"::text);');
    this.addSql('alter table if exists "supplier" alter column "phone" drop not null;');
    this.addSql('alter table if exists "supplier" alter column "address" type text using ("address"::text);');
    this.addSql('alter table if exists "supplier" alter column "address" drop not null;');
    this.addSql('alter table if exists "supplier" drop column if exists "description";');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "supplier" add column if not exists "description" text not null;');
    this.addSql('alter table if exists "supplier" alter column "email" type text using ("email"::text);');
    this.addSql('alter table if exists "supplier" alter column "email" set not null;');
    this.addSql('alter table if exists "supplier" alter column "phone" type text using ("phone"::text);');
    this.addSql('alter table if exists "supplier" alter column "phone" set not null;');
    this.addSql('alter table if exists "supplier" alter column "address" type text using ("address"::text);');
    this.addSql('alter table if exists "supplier" alter column "address" set not null;');
  }

}
