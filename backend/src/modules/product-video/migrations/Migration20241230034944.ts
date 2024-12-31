import { Migration } from '@mikro-orm/migrations';

export class Migration20241230034944 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "product_video" ("id" text not null, "title" text not null, "description" text null, "url" text not null, "file_key" text not null, "mime_type" text null, "thumbnail_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_video_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_product_video_deleted_at" ON "product_video" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "product_video" cascade;');
  }

}
