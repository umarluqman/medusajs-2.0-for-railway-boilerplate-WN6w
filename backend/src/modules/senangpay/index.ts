import SenangPayServiceProvider from "./service";
import { ModuleProviderExports } from "@medusajs/types";

console.log("[SenangPay] Registering payment module");

const services = [SenangPayServiceProvider];

const providerExport: ModuleProviderExports = {
  services,
};

export default providerExport;
