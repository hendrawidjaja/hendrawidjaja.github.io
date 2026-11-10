import { CVClient } from "@/components/CVClient";
import { getCVDataAction } from "./actions";

export default async function Page() {
  const initialData = await getCVDataAction();
  return <CVClient initialData={initialData} />;
}