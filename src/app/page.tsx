import App from "~/components/App";
import Pitch from "~/components/Pitch";
import { getServerAuthSession } from "~/server/auth";

export default async function HomePage() {
  const session = await getServerAuthSession();
  if (session) {
    return <App />;
  } else {
    return <Pitch />;
  }
}
