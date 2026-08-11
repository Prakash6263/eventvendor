import VendorHtmlPage from "./VendorHtmlPage";
import { getVendorMarkup } from "../lib/vendorTemplate";

export default function VendorScreen({ fileName }) {
  return <VendorHtmlPage markup={getVendorMarkup(fileName)} />;
}
