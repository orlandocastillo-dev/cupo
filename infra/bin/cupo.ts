import { App } from "aws-cdk-lib";
import { CupoStack } from "../lib/cupo-stack";

// Se configura con contexto:  npx cdk deploy -c sitio=https://cupo.vercel.app -c remitente=hola@midominio.com
const app = new App();
const sitio = app.node.tryGetContext("sitio") ?? "http://localhost:3000";

new CupoStack(app, "Cupo", {
  sitio,
  remitente: app.node.tryGetContext("remitente"),
  conservarDatos: app.node.tryGetContext("conservarDatos") === "true",
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION ?? "us-east-1" },
  description: "Cupo: reservas para negocios (API, Cognito, DynamoDB, fotos en S3 y CloudFront)",
});
