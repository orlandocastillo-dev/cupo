import { DynamoDBClient, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import type { Reserva } from "@cupo/core";
import { RepositorioDynamo } from "../src/dynamo";

const doc = mockClient(DynamoDBDocumentClient);
const repo = new RepositorioDynamo("cupo-prueba", new DynamoDBClient({ region: "us-east-1" }));

const reserva: Reserva = {
  id: "r1", negocioId: "n1", servicioId: "s1", servicioNombre: "Corte", precio: 25000, fecha: "2026-10-26", inicio: "09:00",
  fin: "09:45", cliente: { nombre: "Ana", telefono: "3000000000" }, estado: "confirmada", codigo: "ABC234", creada: "",
};

beforeEach(() => doc.reset());

describe("RepositorioDynamo", () => {
  it("guarda la reserva y sus bloques en una sola transacción con condiciones", async () => {
    doc.on(TransactWriteCommand).resolves({});
    await repo.crearReserva(reserva, ["09:00", "09:15", "09:30"]);

    const [llamada] = doc.commandCalls(TransactWriteCommand);
    const items = llamada!.args[0].input.TransactItems!;
    expect(items).toHaveLength(4);
    expect(items[0]?.Put?.Item).toMatchObject({ PK: "NEG#n1", SK: "RES#2026-10-26#09:00#r1", GSI1PK: "RES#r1", GSI2PK: "FECHA#2026-10-26" });
    expect(items.slice(1).map((i) => i.Put?.Item?.SK)).toEqual(["OCUPA#2026-10-26#09:00", "OCUPA#2026-10-26#09:15", "OCUPA#2026-10-26#09:30"]);
    expect(items.every((i) => i.Put?.ConditionExpression === "attribute_not_exists(PK)")).toBe(true);
  });

  it("si DynamoDB cancela la transacción, responde que la hora está ocupada", async () => {
    doc.on(TransactWriteCommand).rejects(new TransactionCanceledException({ message: "ConditionalCheckFailed", $metadata: {} }));
    await expect(repo.crearReserva(reserva, ["09:00"])).rejects.toMatchObject({ codigo: "ocupado" });
  });

  it("al cancelar suelta los bloques y solo cambia el estado si nadie lo cambió antes", async () => {
    doc.on(TransactWriteCommand).resolves({});
    const r = await repo.cambiarEstado(reserva, "cancelada", ["09:00", "09:15", "09:30"]);
    expect(r.estado).toBe("cancelada");

    const items = doc.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems!;
    expect(items[0]?.Update).toMatchObject({ ConditionExpression: "estado = :antes", ExpressionAttributeValues: { ":nuevo": "cancelada", ":antes": "confirmada" } });
    expect(items.slice(1).map((i) => i.Delete?.Key?.SK)).toEqual(["OCUPA#2026-10-26#09:00", "OCUPA#2026-10-26#09:15", "OCUPA#2026-10-26#09:30"]);
  });

  it("pasar de atendida a confirmada no toca los bloques", async () => {
    doc.on(TransactWriteCommand).resolves({});
    await repo.cambiarEstado({ ...reserva, estado: "atendida" }, "confirmada", ["09:00"]);
    expect(doc.commandCalls(TransactWriteCommand)[0]!.args[0].input.TransactItems).toHaveLength(1);
  });

  it("consulta la agenda por rango de fechas y quita las llaves internas", async () => {
    doc.on(QueryCommand).resolves({ Items: [{ PK: "NEG#n1", SK: "RES#2026-10-26#09:00#r1", GSI1PK: "RES#r1", entidad: "reserva", ...reserva }] });
    const reservas = await repo.reservasEntre("n1", "2026-10-26", "2026-11-01");
    expect(reservas).toEqual([reserva]);
    const input = doc.commandCalls(QueryCommand)[0]!.args[0].input;
    expect(input.ExpressionAttributeValues).toEqual({ ":pk": "NEG#n1", ":desde": "RES#2026-10-26", ":hasta": "RES#2026-11-01#~" });
  });

  it("devuelve el negocio con su tipo intacto", async () => {
    doc.on(GetCommand).resolves({ Item: { PK: "NEG#n1", SK: "PERFIL", entidad: "negocio", id: "n1", nombre: "El Parche", tipo: "barberia" } });
    expect(await repo.negocioPorId("n1")).toEqual({ id: "n1", nombre: "El Parche", tipo: "barberia" });
  });
});
