import { MedusaService } from "@medusajs/utils";
import { ProductVideo } from "./models/product-video";

class ProductVideoModuleService extends MedusaService({
  ProductVideo,
}) {}

export default ProductVideoModuleService;
