import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { TodoV1 } from "../Render";

const URL =
  process.env.NEXT_PUBLIC_SITE_URL === "http://localhost:3000"
    ? "https://rrktszfmlg.a.pinggy.online"
    : process.env.NEXT_PUBLIC_SITE_URL!;

const router = OpenAPIRouter({
  schema: {
    info: {
      title: "Document Generator",
      version: "1.0",
    },
    servers: [
      {
        url: URL,
        description: "Server",
      },
    ],
  },
  openapi_url: "/api/gpt/openapi.json",
});

router.post("/api/gpt/render", TodoV1);

router.all("*", () => new Response("404 Not Found...", { status: 200 }));

export async function POST(req: Request) {
  return router.handle(req);
}

export async function GET(req: Request) {
  return router.handle(req);
}
