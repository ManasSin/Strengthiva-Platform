import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import StrengthivaSsoAuthService from "./service"

export default ModuleProvider(Modules.AUTH, {
  services: [StrengthivaSsoAuthService],
})
