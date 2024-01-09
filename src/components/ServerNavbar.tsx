import { getServerAuthSession } from "~/server/auth";
import ClientNavbar from "./ClientNavbar";

export default async function ServerNavbar() {
  const session = await getServerAuthSession();
  const prefetchedUser = session?.user;

  return <ClientNavbar prefetchedUser={prefetchedUser} />;
}
