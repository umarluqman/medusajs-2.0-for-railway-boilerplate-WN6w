import { model } from "@medusajs/utils";
import { Supplier } from "./supplier";

const ProductSupplier = model.define("product_supplier", {
  id: model.id().primaryKey(),
  supplier: model.belongsTo(() => Supplier, {
    mappedBy: "products",
  }),
  product_id: model.text(),
  // Additional fields specific to the supplier-product relationship
  supply_price: model.number().nullable(),
  minimum_order_quantity: model.number().nullable(),
});

export default ProductSupplier;
