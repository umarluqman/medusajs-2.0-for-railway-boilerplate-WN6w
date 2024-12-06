import { model } from "@medusajs/utils";
import Product from "./product-supplier";

export const Supplier = model.define("supplier", {
  id: model.id().primaryKey(),
  name: model.text().index(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  products: model.hasMany(() => Product),
});
