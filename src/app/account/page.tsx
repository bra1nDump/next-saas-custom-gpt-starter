import { getServerAuthSession } from "~/server/auth";
import Authentication from "./authentication";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session) {
    return (
      <div>
        You are already signed in as {session.user.email} you are currently on
        plan: TODO
      </div>
    );
  }

  return <Authentication />;
}
