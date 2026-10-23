import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const fuente = (archivo: string) => path.join(aqui, "../../api/src", archivo);

export interface CupoProps extends StackProps {
  /** Dirección del frontend (Vercel), para CORS, Cognito y los enlaces de los correos. */
  sitio: string;
  /** Correo verificado en SES. Sin él no se mandan confirmaciones ni recordatorios. */
  remitente?: string;
  /** En producción la tabla y las fotos se conservan aunque se borre el stack. */
  conservarDatos?: boolean;
}

export class CupoStack extends Stack {
  constructor(scope: Construct, id: string, props: CupoProps) {
    super(scope, id, props);
    const { sitio, remitente } = props;
    const origenes = [...new Set([sitio, "http://localhost:3000"])];
    const politica = props.conservarDatos ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    // ---- Datos ----

    const tabla = new dynamodb.TableV2(this, "Tabla", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: politica,
      globalSecondaryIndexes: [
        {
          indexName: "GSI1",
          partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: "GSI2",
          partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // ---- Fotos de los negocios: S3 privado, servido por CloudFront ----

    const fotos = new s3.Bucket(this, "Fotos", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: politica,
      autoDeleteObjects: !props.conservarDatos,
      cors: [{ allowedMethods: [s3.HttpMethods.PUT], allowedOrigins: origenes, allowedHeaders: ["content-type"], maxAge: 3000 }],
    });

    const cdn = new cloudfront.Distribution(this, "CdnFotos", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(fotos),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: "Fotos de los negocios de Cupo",
    });

    // ---- Cuentas de los dueños ----

    const usuarios = new cognito.UserPool(this, "Duenos", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: { minLength: 8, requireLowercase: true, requireDigits: true, requireUppercase: false, requireSymbols: false },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: politica,
    });

    const dominio = usuarios.addDomain("Dominio", {
      cognitoDomain: { domainPrefix: `cupo-${this.account}` },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    const app = usuarios.addClient("Web", {
      generateSecret: false,
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: origenes.map((o) => `${o}/panel/entrar`),
        logoutUrls: origenes.map((o) => `${o}/panel`),
      },
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    new cognito.CfnManagedLoginBranding(this, "MarcaLogin", {
      userPoolId: usuarios.userPoolId,
      clientId: app.userPoolClientId,
      useCognitoProvidedValues: true,
    });

    // ---- Lambdas ----

    const comun = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node22",
        format: OutputFormat.ESM,
        // Se empaqueta el SDK con el código para no depender de la versión que trae el runtime.
        externalModules: [],
        banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      environment: {
        TABLA: tabla.tableName,
        SITIO: sitio,
        REMITENTE: remitente ?? "",
        NODE_OPTIONS: "--enable-source-maps",
      },
    };

    const funcion = (nombre: string, archivo: string, extra: Record<string, string> = {}) =>
      new NodejsFunction(this, nombre, {
        ...comun,
        entry: fuente(archivo),
        handler: "handler",
        environment: { ...comun.environment, ...extra },
        logGroup: new logs.LogGroup(this, `${nombre}Logs`, { retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY }),
      });

    const publico = funcion("Publico", "publico.ts");
    const panel = funcion("Panel", "panel.ts", { BUCKET_FOTOS: fotos.bucketName, CDN: cdn.distributionDomainName });
    const recordatorios = funcion("Recordatorios", "recordatorios.ts");

    tabla.grantReadWriteData(publico);
    tabla.grantReadWriteData(panel);
    tabla.grantReadData(recordatorios);
    fotos.grantPut(panel);

    if (remitente) {
      const enviarCorreo = new iam.PolicyStatement({ actions: ["ses:SendEmail"], resources: ["*"] });
      publico.addToRolePolicy(enviarCorreo);
      recordatorios.addToRolePolicy(enviarCorreo);
    }

    // Todos los días a las 6 p. m. de Colombia (23:00 UTC).
    new events.Rule(this, "CadaTarde", {
      schedule: events.Schedule.cron({ minute: "0", hour: "23" }),
      targets: [new targets.LambdaFunction(recordatorios)],
    });

    // ---- API ----

    const api = new apigw.HttpApi(this, "Api", {
      corsPreflight: {
        allowOrigins: origenes,
        allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.PUT, apigw.CorsHttpMethod.DELETE],
        allowHeaders: ["content-type", "authorization"],
        maxAge: Duration.hours(1),
      },
    });

    // Límite por defecto para que nadie llene la agenda con un script.
    const etapa = api.defaultStage?.node.defaultChild as apigw.CfnStage;
    etapa.defaultRouteSettings = { throttlingRateLimit: 20, throttlingBurstLimit: 40 };

    const autorizador = new HttpJwtAuthorizer("Cognito", usuarios.userPoolProviderUrl, { jwtAudience: [app.userPoolClientId] });
    const conPublico = new HttpLambdaIntegration("IntegracionPublico", publico);
    const conPanel = new HttpLambdaIntegration("IntegracionPanel", panel);
    const { GET, POST, PUT, DELETE } = apigw.HttpMethod;

    const rutasPublicas: [apigw.HttpMethod, string][] = [
      [GET, "/negocios/{slug}"],
      [GET, "/negocios/{slug}/disponibilidad"],
      [POST, "/negocios/{slug}/reservas"],
      [GET, "/reservas/{id}"],
      [POST, "/reservas/{id}/cancelar"],
    ];
    const rutasPanel: [apigw.HttpMethod, string][] = [
      [GET, "/panel"],
      [POST, "/panel/negocio"],
      [PUT, "/panel/negocio"],
      [POST, "/panel/servicios"],
      [PUT, "/panel/servicios/{id}"],
      [DELETE, "/panel/servicios/{id}"],
      [PUT, "/panel/horario"],
      [GET, "/panel/agenda"],
      [POST, "/panel/reservas/{id}/estado"],
      [GET, "/panel/resumen"],
      [POST, "/panel/foto"],
    ];
    for (const [metodo, ruta] of rutasPublicas) api.addRoutes({ path: ruta, methods: [metodo], integration: conPublico });
    for (const [metodo, ruta] of rutasPanel) api.addRoutes({ path: ruta, methods: [metodo], integration: conPanel, authorizer: autorizador });

    // ---- Lo que necesita el frontend (van como variables de entorno en Vercel) ----

    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "CognitoClientId", { value: app.userPoolClientId });
    new CfnOutput(this, "CognitoDominio", { value: dominio.baseUrl() });
    new CfnOutput(this, "DominioFotos", { value: cdn.distributionDomainName });
  }
}
