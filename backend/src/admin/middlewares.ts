import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework";
import {
  PostAdminCreateSupplier,
  PutAdminUpdateSupplier,
} from "../api/admin/suppliers/validators";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/suppliers",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateSupplier)],
    },
    {
      matcher: "/admin/suppliers/:id",
      method: "PUT",
      middlewares: [validateAndTransformBody(PutAdminUpdateSupplier)],
    },
  ],
});
