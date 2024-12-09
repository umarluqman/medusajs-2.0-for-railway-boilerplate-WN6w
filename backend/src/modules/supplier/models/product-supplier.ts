import { model } from "@medusajs/utils";
import { Supplier } from "./supplier";

const ProductSupplier = model.define("product_supplier", {
  id: model.id().primaryKey(),
  supplier_id: model.text(),
  product_id: model.text(),
  supplierRelation: model.belongsTo(() => Supplier, {
    mappedBy: "supplierProducts",
  }),
  supply_price: model.number().nullable(),
  minimum_order_quantity: model.number().nullable(),
});

export default ProductSupplier;
