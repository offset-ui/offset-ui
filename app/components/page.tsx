import { redirect } from "next/navigation";
import { COMPONENTS } from "@/lib/registry";
import { componentPath } from "@/lib/routes";

export default function ComponentsIndex() {
  redirect(componentPath(COMPONENTS[0].slug));
}
