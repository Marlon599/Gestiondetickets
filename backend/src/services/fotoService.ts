import { poolPromise, sql } from "../config/database";

export async function registrarFoto(
  ticketId: number,
  nombreArchivo: string,
  rutaArchivo: string,
  tipoEvidencia: "ANTES" | "DESPUES"
) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("TicketId", sql.Int, ticketId)
    .input("NombreArchivo", sql.NVarChar(255), nombreArchivo)
    .input("RutaArchivo", sql.NVarChar(500), rutaArchivo)
    .input("TipoEvidencia", sql.VarChar(20), tipoEvidencia)
    .query(`
      INSERT INTO dbo.MNT_TicketFoto
      (
        TicketId,
        NombreArchivo,
        RutaArchivo,
        TipoEvidencia,
        FechaCreacion
      )
      VALUES
      (
        @TicketId,
        @NombreArchivo,
        @RutaArchivo,
        @TipoEvidencia,
        GETDATE()
      );

      SELECT SCOPE_IDENTITY() AS FotoId;
    `);

  return result.recordset[0];
}


export async function obtenerFotosTicket(ticketId: number) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("TicketId", sql.Int, ticketId)
    .query(`
      SELECT
        FotoId,
        TicketId,
        NombreArchivo,
        RutaArchivo,
        TipoFoto,
        Observacion,
        FechaCreacion,
        TipoEvidencia
      FROM dbo.MNT_TicketFoto
      WHERE TicketId = @TicketId
      ORDER BY FechaCreacion ASC;
    `);

  return result.recordset;
}

// =====================================================
// OBTENER UNA FOTOGRAFÍA
// =====================================================

export async function obtenerFotoPorId(
    fotoId: number,
    ticketId: number
) {

    const pool =
        await poolPromise;


    const result =
        await pool.request()

            .input(
                "FotoId",
                sql.Int,
                fotoId
            )

            .input(
                "TicketId",
                sql.Int,
                ticketId
            )

            .query(`
                SELECT
                    FotoId,
                    TicketId,
                    NombreArchivo,
                    RutaArchivo,
                    TipoFoto,
                    Observacion,
                    FechaCreacion,
                    TipoEvidencia
                FROM dbo.MNT_TicketFoto
                WHERE FotoId = @FotoId
                  AND TicketId = @TicketId;
            `);


    return result.recordset[0] || null;
}