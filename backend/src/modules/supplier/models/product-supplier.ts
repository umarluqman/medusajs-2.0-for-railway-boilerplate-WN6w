import { model } from "@medusajs/utils";
import { Supplier } from "./supplier";
// import Product from "@medusajs/product";

const ProductSupplier = model.define("product_supplier", {
  id: model.id().primaryKey(),
  supplier: model.belongsTo(() => Supplier, {
    mappedBy: "product_suppliers",
  }),
  // Additional fields specific to the supplier-product relationship
  supply_price: model.number().nullable(),
  minimum_order_quantity: model.number().nullable(),
});

export default ProductSupplier;
