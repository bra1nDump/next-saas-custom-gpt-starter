# Starter Kit for creating a custom GPT
You can try the finished product here: TODO: Deploy this GPT

- [TODO: not actually there yet, also db does not have todo tables either] Example TODO APIs exposed for your custom GPT to call
- Prisma ORM with Postgres
- [Optional] Authentication (NextAuth.js) (TODO: Migrate to Auth.js)
- [Optional] Stripe Subscriptions


# High level overview of the app architecture:
TODO: This is outdated and focused on the rendering aspect, which this app does not even have. Lets create a new diagram that also explains authentication and subscriptions
![Architecuture of the app](https://diagrams.helpful.dev/d/d:WY9tArcE)

## The entry point - is a custom GPT, ChatGPT is essentially our UI
Custom GPT is ChatGPT with some baked in text instructions and optionally a list of APIs it can call and how to call them. As part of the chat with the GPT it can choose to call an API and interpret the response. I suggest to read the tutorial below, official docs and google yourself to better understand how it works.

Decent tutorial https://alexsniffin.medium.com/building-an-openai-gpt-with-your-api-a-step-by-step-guide-70168bef00e7
Official announcement https://openai.com/blog/introducing-gpts
Official docs https://platform.openai.com/docs/actions

# Lets get running locally
This means we should be able to make a request to the API on local host and create a todo list

- npm install
- Copy .env.example to .env.development.local
- Create a postgres database - I have included a script that will work for Mac if you have docker installed run `./scripts/toggle-postgres.sh` this will start or stop postgres in a docker container depending on the current state. If you have windows the script will not work, but you can setup postres manually
- run vscode default debug task (F5) - called Dev, you can try other ones too
- [TODO, not there actually] At this point you should access the example hardcoded todo: http://localhost:3000/todo/example

# Testing the API
- TODO: Create a Postman workspace and make it public
- You should get back a response with a link to your TODO list, open the link to make sure it works
- Congratulations you have run the app locally!

# Actually running the full loop GPT -> API -> GPT
What this will look like in the end:
- You will expose the localhost API to the internet using a PAID account on pinggy.io. It's important to account is paid - otherwise the openapi.json will fail to fetch without additional confirmation. If you have used ngrok before, this is a very similar service
  - When you run the ssh command for pinggy, you should see a URL. It MUST MATCH `NEXT_PUBLIC_SITE_URL in .env.development.local`. If not, update the .env.development.local
  - It must also NOT have a 'free' mentioned anywhere in the URL - that means the account is not paid and the openapi.json will fail to fetch when configuring the GPT
- You will go to the gpt builder and create a new GPT (or update an existing one)
  - You will configure the prompt - so ChatGPT knows how to interact with the end user. The current porompt can be found in `prompt.md`, just search this project
  - Click configure actions and use the openapi.json route in the builder so ChatGPT knows how to use our APIs: `https://<your-pinggy-url>/api/resume/gpt/openapi.json`
  - Usually: `https://rrktszfmlg.a.pinggy.online/api/resume/gpt/openapi.json`
- If you did everything right at this point you should be able to say something like this while still in the GPT builder (right side):
  - "Render the resume for Kirill Dubovitsky from scratch, I am debugging"
  - This should generate a preview, create a web link + pdf

# Congratulations! You have run the full loop! Most common issues are:
- The pinggy.io account is not paid
- The openapi.json route is not configured correctly in the GPT builder
- The NEXT_PUBLIC_SITE_URL is not configured correctly in the .env.development.local

# Configure Stripe to accept payments
TODO, it works but requries some manual steps
TODO: Make sure the app works fine without stripe and hints that its not setup properly

## Making changes to the API
- Locate file using OpenAPIRouter (this is what creates the /render route and openapi.json route)
- Locate the Render.ts file - handles the route itself, and also provides schema to create openapi.json