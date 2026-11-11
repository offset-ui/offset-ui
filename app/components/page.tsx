import { redirect } from "next/navigation";
import { COMPONENTS } from "@/lib/registry";

export default function ComponentsIndex() {
  redirect(`/components/${COMPONENTS[0].slug}`);
}
