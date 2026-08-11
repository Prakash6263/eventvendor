import { vendorMarkup } from "../generated/vendorMarkup";

export function getVendorMarkup(fileName) {
  return vendorMarkup[fileName] ?? "";
}
