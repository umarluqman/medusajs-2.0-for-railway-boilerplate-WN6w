import { model } from "@medusajs/utils";
import ProductSupplier from "./product-supplier";

export const Supplier = model.define("supplier", {
  id: model.id().primaryKey(),
  name: model.text().index(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  product_suppliers: model.hasMany(() => ProductSupplier),
});
