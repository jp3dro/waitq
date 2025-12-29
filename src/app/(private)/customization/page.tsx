import { redirect } from "next/navigation";

export const metadata = { title: "Customization" };

export default async function CustomizationPage() {
  redirect("/business");
}
