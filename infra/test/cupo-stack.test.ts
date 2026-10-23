import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { beforeAll, describe, expect, it } from "vitest";
import { CupoStack } from "../lib/cupo-stack";

let plantilla: Template;

beforeAll(() => {
  const app = new App();
  const stack = new CupoStack(app, "Prueba", {
    sitio: "https://cupo.vercel.app",
    remitente: "reservas@cupo.co",
    env: { account: "123456789012", region: "us-east-1" },
  });
  plantilla = Template.fromStack(stack);
}, 120_000);

describe("CupoStack", () => {
  it("crea una tabla con los dos índices y recuperación en el tiempo", () => {
    plantilla.hasResourceProperties("AWS::DynamoDB::GlobalTable", {
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: Match.arrayWith([Match.objectLike({ IndexName: "GSI1" }), Match.objectLike({ IndexName: "GSI2" })]),
      Replicas: [Match.objectLike({ PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true } })],
    });
  });

  it("protege todas las rutas del panel con el autorizador de Cognito y deja abiertas las públicas", () => {
    const rutas = plantilla.findResources("AWS::ApiGatewayV2::Route");
    const porRuta = Object.values(rutas).map((r) => r.Properties as { RouteKey: string; AuthorizationType?: string });
    const panel = porRuta.filter((r) => r.RouteKey.includes(" /panel"));
    const publicas = porRuta.filter((r) => !r.RouteKey.includes(" /panel"));
    expect(panel).toHaveLength(11);
    expect(panel.every((r) => r.AuthorizationType === "JWT")).toBe(true);
    expect(publicas).toHaveLength(5);
    expect(publicas.every((r) => r.AuthorizationType === undefined || r.AuthorizationType === "NONE")).toBe(true);
  });

  it("limita las peticiones por segundo en la API", () => {
    plantilla.hasResourceProperties("AWS::ApiGatewayV2::Stage", {
      DefaultRouteSettings: { ThrottlingRateLimit: 20, ThrottlingBurstLimit: 40 },
    });
  });

  it("solo permite CORS desde el sitio y localhost", () => {
    plantilla.hasResourceProperties("AWS::ApiGatewayV2::Api", {
      CorsConfiguration: Match.objectLike({ AllowOrigins: ["https://cupo.vercel.app", "http://localhost:3000"] }),
    });
  });

  it("guarda las fotos en un bucket privado servido por CloudFront", () => {
    plantilla.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true },
    });
    plantilla.resourceCountIs("AWS::CloudFront::Distribution", 1);
    plantilla.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);
  });

  it("corre los recordatorios todos los días a las 6 p. m. de Colombia", () => {
    plantilla.hasResourceProperties("AWS::Events::Rule", { ScheduleExpression: "cron(0 23 * * ? *)" });
  });

  it("las Lambdas usan Node 22 en ARM y conocen la tabla", () => {
    const funciones = Object.values(plantilla.findResources("AWS::Lambda::Function")).filter(
      // Fuera queda la función auxiliar que CDK crea para vaciar el bucket.
      (f) => (f.Properties as { Environment?: { Variables?: Record<string, unknown> } }).Environment?.Variables?.TABLA !== undefined,
    );
    expect(funciones).toHaveLength(3);
    for (const f of funciones) {
      expect(f.Properties).toMatchObject({ Runtime: "nodejs22.x", Architectures: ["arm64"], Environment: { Variables: { SITIO: "https://cupo.vercel.app" } } });
    }
  });

  it("el inicio de sesión de Cognito vuelve al panel del sitio", () => {
    plantilla.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      CallbackURLs: ["https://cupo.vercel.app/panel/entrar", "http://localhost:3000/panel/entrar"],
      AllowedOAuthFlows: ["code"],
      GenerateSecret: false,
    });
  });
});
