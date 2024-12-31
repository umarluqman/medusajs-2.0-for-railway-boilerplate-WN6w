import { model } from "@medusajs/utils";

export const ProductVideo = model.define("product_video", {
  id: model.id().primaryKey(),
  title: model.text().nullable(),
  description: model.text().nullable(),
  url: model.text(), // URL from MinIO storage
  file_key: model.text(), // MinIO file key for deletion/management
  mime_type: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
});
