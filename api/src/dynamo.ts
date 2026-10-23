import { DynamoDBClient, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ACTIVAS, ErrorCupo, type EstadoReserva, type Horario, type Negocio, type Repositorio, type Reserva, type Servicio } from "@cupo/core";

/*
  Una sola tabla. Todo lo de un negocio vive bajo la misma partición, así la agenda de una
  semana sale en una consulta.

  PK                 SK                              Qué es
  NEG#<id>           PERFIL                          el negocio
  NEG#<id>           SERV#<id>                       un servicio
  NEG#<id>           HORARIO                         el horario de la semana
  NEG#<id>           RES#<fecha>#<inicio>#<id>       una reserva (GSI1: RES#<id>, GSI2: FECHA#<fecha>)
  NEG#<id>           OCUPA#<fecha>#<HH:mm>           un bloque de 15 minutos tomado
  SLUG#<slug>        SLUG                            para que no haya dos negocios con la misma dirección
  DUENO#<sub>        NEGOCIO                         qué negocio administra cada usuario de Cognito
*/

type Item = Record<string, unknown>;

const neg = (id: string) => `NEG#${id}`;
const skReserva = (r: Pick<Reserva, "fecha" | "inicio" | "id">) => `RES#${r.fecha}#${r.inicio}#${r.id}`;
const skBloque = (fecha: string, bloque: string) => `OCUPA#${fecha}#${bloque}`;

function sinLlaves<T>(item: Item | undefined): T | null {
  if (!item) return null;
  const { PK: _pk, SK: _sk, GSI1PK: _g1, GSI1SK: _g1s, GSI2PK: _g2, GSI2SK: _g2s, entidad: _e, ...resto } = item;
  return resto as T;
}

export class RepositorioDynamo implements Repositorio {
  private doc: DynamoDBDocumentClient;

  constructor(
    private tabla: string,
    cliente = new DynamoDBClient({}),
  ) {
    this.doc = DynamoDBDocumentClient.from(cliente, { marshallOptions: { removeUndefinedValues: true } });
  }

  private async obtener<T>(PK: string, SK: string): Promise<T | null> {
    const { Item } = await this.doc.send(new GetCommand({ TableName: this.tabla, Key: { PK, SK } }));
    return sinLlaves<T>(Item);
  }

  private async consultar(PK: string, desde: string, hasta: string): Promise<Item[]> {
    const items: Item[] = [];
    let ExclusiveStartKey: Item | undefined;
    do {
      const r = await this.doc.send(
        new QueryCommand({
          TableName: this.tabla,
          KeyConditionExpression: "PK = :pk AND SK BETWEEN :desde AND :hasta",
          ExpressionAttributeValues: { ":pk": PK, ":desde": desde, ":hasta": hasta },
          ExclusiveStartKey,
        }),
      );
      items.push(...(r.Items ?? []));
      ExclusiveStartKey = r.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  async negocioPorSlug(slug: string) {
    const puntero = await this.obtener<{ negocioId: string }>(`SLUG#${slug}`, "SLUG");
    return puntero ? this.negocioPorId(puntero.negocioId) : null;
  }

  async negocioPorId(id: string) {
    return this.obtener<Negocio>(neg(id), "PERFIL");
  }

  async negocioDeDueno(dueno: string) {
    const puntero = await this.obtener<{ negocioId: string }>(`DUENO#${dueno}`, "NEGOCIO");
    return puntero ? this.negocioPorId(puntero.negocioId) : null;
  }

  async guardarNegocio(negocio: Negocio, dueno: string) {
    try {
      await this.doc.send(
        new TransactWriteCommand({
          TransactItems: [
            { Put: { TableName: this.tabla, Item: { PK: neg(negocio.id), SK: "PERFIL", entidad: "negocio", ...negocio } } },
            {
              Put: {
                TableName: this.tabla,
                Item: { PK: `SLUG#${negocio.slug}`, SK: "SLUG", negocioId: negocio.id },
                ConditionExpression: "attribute_not_exists(PK) OR negocioId = :id",
                ExpressionAttributeValues: { ":id": negocio.id },
              },
            },
            { Put: { TableName: this.tabla, Item: { PK: `DUENO#${dueno}`, SK: "NEGOCIO", negocioId: negocio.id } } },
          ],
        }),
      );
    } catch (e) {
      if (e instanceof TransactionCanceledException) throw new ErrorCupo("ocupado", "Ya existe un negocio con esa dirección.");
      throw e;
    }
  }

  async servicios(negocioId: string) {
    const items = await this.consultar(neg(negocioId), "SERV#", "SERV#~");
    return items.map((i) => sinLlaves<Servicio>(i)!);
  }

  async guardarServicio(servicio: Servicio) {
    await this.doc.send(
      new PutCommand({ TableName: this.tabla, Item: { PK: neg(servicio.negocioId), SK: `SERV#${servicio.id}`, entidad: "servicio", ...servicio } }),
    );
  }

  async borrarServicio(negocioId: string, id: string) {
    await this.doc.send(new DeleteCommand({ TableName: this.tabla, Key: { PK: neg(negocioId), SK: `SERV#${id}` } }));
  }

  async horario(negocioId: string) {
    return this.obtener<Horario>(neg(negocioId), "HORARIO");
  }

  async guardarHorario(negocioId: string, horario: Horario) {
    await this.doc.send(new PutCommand({ TableName: this.tabla, Item: { PK: neg(negocioId), SK: "HORARIO", entidad: "horario", ...horario } }));
  }

  async reservasEntre(negocioId: string, desde: string, hasta: string) {
    const items = await this.consultar(neg(negocioId), `RES#${desde}`, `RES#${hasta}#~`);
    return items.map((i) => sinLlaves<Reserva>(i)!);
  }

  async reserva(id: string) {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: this.tabla,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `RES#${id}` },
      }),
    );
    return sinLlaves<Reserva>(r.Items?.[0]);
  }

  /** Reservas confirmadas de un día en todos los negocios, para los recordatorios. */
  async reservasDelDia(fecha: string) {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: this.tabla,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: { ":pk": `FECHA#${fecha}` },
      }),
    );
    return (r.Items ?? []).map((i) => sinLlaves<Reserva>(i)!);
  }

  private itemReserva(r: Reserva): Item {
    return {
      PK: neg(r.negocioId),
      SK: skReserva(r),
      GSI1PK: `RES#${r.id}`,
      GSI1SK: "RES",
      GSI2PK: `FECHA#${r.fecha}`,
      GSI2SK: `${r.negocioId}#${r.inicio}`,
      entidad: "reserva",
      ...r,
    };
  }

  private tomar(r: Reserva, bloque: string): NonNullable<TransactWriteCommandInput["TransactItems"]>[number] {
    return {
      Put: {
        TableName: this.tabla,
        Item: { PK: neg(r.negocioId), SK: skBloque(r.fecha, bloque), entidad: "bloque", reservaId: r.id },
        ConditionExpression: "attribute_not_exists(PK)",
      },
    };
  }

  /**
   * La reserva y todos sus bloques van en una sola transacción. Si otra persona tomó cualquiera
   * de esos bloques un instante antes, DynamoDB cancela todo y no queda nada a medias.
   */
  async crearReserva(reserva: Reserva, bloques: string[]) {
    try {
      await this.doc.send(
        new TransactWriteCommand({
          TransactItems: [
            { Put: { TableName: this.tabla, Item: this.itemReserva(reserva), ConditionExpression: "attribute_not_exists(PK)" } },
            ...bloques.map((b) => this.tomar(reserva, b)),
          ],
        }),
      );
    } catch (e) {
      if (e instanceof TransactionCanceledException) throw new ErrorCupo("ocupado", "Esa hora ya no está disponible. Elige otra.");
      throw e;
    }
  }

  async cambiarEstado(reserva: Reserva, estado: EstadoReserva, bloques: string[]) {
    const estabaActiva = ACTIVAS.has(reserva.estado);
    const quedaActiva = ACTIVAS.has(estado);
    const extra: NonNullable<TransactWriteCommandInput["TransactItems"]> = [];
    if (estabaActiva && !quedaActiva) {
      for (const b of bloques) extra.push({ Delete: { TableName: this.tabla, Key: { PK: neg(reserva.negocioId), SK: skBloque(reserva.fecha, b) } } });
    }
    if (!estabaActiva && quedaActiva) extra.push(...bloques.map((b) => this.tomar(reserva, b)));

    try {
      await this.doc.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.tabla,
                Key: { PK: neg(reserva.negocioId), SK: skReserva(reserva) },
                UpdateExpression: "SET estado = :nuevo",
                // Si alguien la cambió mientras tanto, no se pisa.
                ConditionExpression: "estado = :antes",
                ExpressionAttributeValues: { ":nuevo": estado, ":antes": reserva.estado },
              },
            },
            ...extra,
          ],
        }),
      );
    } catch (e) {
      if (e instanceof TransactionCanceledException) throw new ErrorCupo("ocupado", "La reserva cambió mientras tanto. Recarga la agenda.");
      throw e;
    }
    return { ...reserva, estado };
  }
}
