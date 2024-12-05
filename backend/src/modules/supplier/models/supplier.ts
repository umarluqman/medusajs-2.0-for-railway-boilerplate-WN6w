import { model } from "@medusajs/utils";
import Product from "./product-supplier";

export const Supplier = model.define("supplier", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text(),
  address: model.text(),
  description: model.text(),
  products: model.hasMany(() => Product),
});
