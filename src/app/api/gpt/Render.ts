import {
  Enumeration,
  OpenAPIRoute,
  Str,
  Obj,
} from "@cloudflare/itty-router-openapi";
import { nanoid } from "nanoid";
import { json } from "itty-router-extras";

const URL = process.env.NEXT_PUBLIC_SITE_URL!;

export class TodoV1 extends OpenAPIRoute {
  static schema = {
    summary: "",
    requestBody: {
      // TODO:
    },
    responses: {
      /*
       * Code for un processable content: The request was well-formed (i.e.,
       * syntactically correct) but could not be processed
       */
      "422": {
        description: "Error while creating the document",
        schema: {
          errorMessage: new Str(),
        },
      },
      "200": {
        description: "Success",
        schema: {
          liveViewLink: new Str({
            description: "Link to live view, show after rendering the preview",
          }),
          // previewLink: new Str({
          //   description:
          // "link to the preview of the document,
          // you should render it in line using markdown ![alt text](link)", }),
        },
      },
    },
  };

  async handle(
    request: Request,
    data: {
      body: {
        // TODO
      };
    },
  ) {
    return json({
      liveViewLink: `${URL}/api/gpt/render/${nanoid()}`,
    });
  }
}
