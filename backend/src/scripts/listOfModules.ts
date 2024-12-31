import { ExecArgs } from "@medusajs/types";

export default async function listModules({ container }: ExecArgs) {
  const config = container.resolve("configModule");
  console.log("Configured modules:");
  console.log(config.modules);
}
