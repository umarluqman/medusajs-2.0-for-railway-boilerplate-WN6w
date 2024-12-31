import { Migration } from '@mikro-orm/migrations';

export class Migration20241230073258 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product_video" alter column "title" type text using ("title"::text);');
    this.addSql('alter table if exists "product_video" alter column "title" drop not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_video" alter column "title" type text using ("title"::text);');
    this.addSql('alter table if exists "product_video" alter column "title" set not null;');
  }

}
