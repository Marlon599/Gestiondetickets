import { poolPromise, sql } from "../config/database";

// =====================================================
// CONTEXTO DE SEGURIDAD
// =====================================================
// =====================================================
// CONTEXTO DEL USUARIO AUTENTICADO
// =====================================================

export interface ContextoUsuario {

    empresaId: number | null;

    plantaId: number | null;

    rol:
        | "ADMIN"
        | "SUPERADMIN"
        | "MECANICO";

    mecanicoId: number | null;

}

// =====================================================
// VALIDAR CONTEXTO
// =====================================================

// =====================================================
// VALIDAR CONTEXTO DEL USUARIO
// =====================================================

function validarContexto(
    contexto: ContextoUsuario
) {

    // =================================================
    // SUPERADMIN
    // =================================================
    // El SUPERADMIN tiene acceso global.
    // No necesita EmpresaId ni PlantaId únicos.
    // =================================================

    if (
        contexto.rol === "SUPERADMIN"
    ) {

        return;

    }


    // =================================================
    // ADMIN / MECANICO
    // =================================================
    // Estos usuarios sí necesitan tener un contexto
    // de Empresa + Planta para trabajar.
    // =================================================

    if (
        !contexto.empresaId ||
        !contexto.plantaId
    ) {

        throw new Error(
            "El usuario no tiene Empresa y Planta asignadas."
        );

    }

}

// =====================================================
// OBTENER TICKETS
// =====================================================

// =====================================================
// OBTENER TICKETS
// =====================================================

export async function obtenerTickets(
    mecanicoId: number | undefined,
    contexto: ContextoUsuario
) {

    validarContexto(contexto);

    const pool =
        await poolPromise;

    const request =
        pool.request();

    // =================================================
    // DETERMINAR SI TIENE ACCESO GLOBAL
    // =================================================

    const accesoGlobal =
        contexto.rol === "SUPERADMIN";

    // =================================================
    // FILTRO BASE
    // =================================================

    let filtro = `
        WHERE 1 = 1
    `;

    // =================================================
    // USUARIO NORMAL
    // =================================================

    if (!accesoGlobal) {

        request.input(
            "EmpresaId",
            sql.Int,
            contexto.empresaId
        );

        request.input(
            "PlantaId",
            sql.Int,
            contexto.plantaId
        );

        filtro += `
            AND M.EmpresaId = @EmpresaId
            AND M.PlantaId = @PlantaId

            AND MQ.EmpresaId = @EmpresaId
            AND MQ.PlantaId = @PlantaId
        `;
    }

    // =================================================
    // MECÁNICO
    // =================================================

    if (
        contexto.rol === "MECANICO"
    ) {

        if (
            contexto.mecanicoId === null
        ) {

            throw new Error(
                "El usuario no tiene un mecánico asociado."
            );

        }

        request.input(
            "MecanicoId",
            sql.Int,
            contexto.mecanicoId
        );

        filtro += `
            AND T.MecanicoId =
                @MecanicoId
        `;
    }

    // =================================================
    // ADMIN CON FILTRO DE MECÁNICO
    // =================================================

    else if (
        !accesoGlobal &&
        mecanicoId !== undefined
    ) {

        request.input(
            "MecanicoId",
            sql.Int,
            mecanicoId
        );

        filtro += `
            AND T.MecanicoId =
                @MecanicoId
        `;
    }

    // =================================================
    // CONSULTA
    // =================================================

    const result =
        await request.query(`

            SELECT

                T.TicketId,

                T.NumeroTicket,

                T.MecanicoId,

                CONCAT(
                    M.Nombre,
                    ' ',
                    M.Apellido
                ) AS Mecanico,

                T.MaquinaId,

                MQ.Codigo AS CodigoMaquina,

                MQ.Nombre AS Maquina,

                T.TipoMantenimientoId,

                TM.Nombre AS TipoMantenimiento,

                T.TipoTrabajoId,

                TT.Nombre AS TipoTrabajo,

                T.TipoTrabajoPersonalizado,

                T.PrioridadId,

                P.Nombre AS Prioridad,

                T.EstadoId,

                E.Nombre AS Estado,

                T.FechaReporte,

                T.HoraInicio,

                T.HoraFin,

                T.TrabajoRealizado,

                T.Observaciones,

                T.FechaCreacion,

                T.FechaActualizacion

            FROM dbo.MNT_Ticket T

            INNER JOIN dbo.MNT_Mecanico M
                ON M.MecanicoId =
                    T.MecanicoId

            INNER JOIN dbo.MNT_Maquina MQ
                ON MQ.MaquinaId =
                    T.MaquinaId

            INNER JOIN dbo.MNT_TipoMantenimiento TM
                ON TM.TipoMantenimientoId =
                    T.TipoMantenimientoId

            LEFT JOIN dbo.MNT_TipoTrabajo TT
                ON TT.TipoTrabajoId =
                    T.TipoTrabajoId

            INNER JOIN dbo.MNT_Prioridad P
                ON P.PrioridadId =
                    T.PrioridadId

            INNER JOIN dbo.MNT_EstadoTicket E
                ON E.EstadoId =
                    T.EstadoId

            ${filtro}

            ORDER BY
                T.TicketId DESC;

        `);

    return result.recordset;
}

// =====================================================
// OBTENER TICKET POR ID
// =====================================================

export async function obtenerTicketPorId(
    ticketId: number,
    contexto: ContextoUsuario
) {

    validarContexto(contexto);

    const pool =
        await poolPromise;

    const request =
        pool.request();

    request.input(
        "TicketId",
        sql.Int,
        ticketId
    );

    // =================================================
    // ACCESO GLOBAL
    // =================================================

    const accesoGlobal =
        contexto.rol === "SUPERADMIN" ;

    // =================================================
    // FILTRO
    // =================================================

    let filtro = "";

    if (!accesoGlobal) {

        request.input(
            "EmpresaId",
            sql.Int,
            contexto.empresaId
        );

        request.input(
            "PlantaId",
            sql.Int,
            contexto.plantaId
        );

        filtro = `

            AND M.EmpresaId =
                @EmpresaId

            AND M.PlantaId =
                @PlantaId

            AND MQ.EmpresaId =
                @EmpresaId

            AND MQ.PlantaId =
                @PlantaId

        `;
    }

    // =================================================
    // MECÁNICO
    // =================================================

    if (
        contexto.rol === "MECANICO"
    ) {

        if (
            contexto.mecanicoId === null
        ) {

            throw new Error(
                "El usuario no tiene un mecánico asociado."
            );

        }

        request.input(
            "MecanicoId",
            sql.Int,
            contexto.mecanicoId
        );

        filtro += `

            AND T.MecanicoId =
                @MecanicoId

        `;
    }

    // =================================================
    // CONSULTA
    // =================================================

    const result =
        await request.query(`

            SELECT

                T.TicketId,

                T.NumeroTicket,

                T.MecanicoId,

                CONCAT(
                    M.Nombre,
                    ' ',
                    M.Apellido
                ) AS Mecanico,

                T.MaquinaId,

                MQ.Codigo AS CodigoMaquina,

                MQ.Nombre AS Maquina,

                T.TipoMantenimientoId,

                TM.Nombre AS TipoMantenimiento,

                T.TipoTrabajoId,

                TT.Nombre AS TipoTrabajo,

                T.TipoTrabajoPersonalizado,

                T.PrioridadId,

                P.Nombre AS Prioridad,

                T.EstadoId,

                E.Nombre AS Estado,

                T.FechaReporte,

                T.HoraInicio,

                T.HoraFin,

                T.TrabajoRealizado,

                T.Observaciones,

                T.FechaCreacion,

                T.FechaActualizacion

            FROM dbo.MNT_Ticket T

            INNER JOIN dbo.MNT_Mecanico M
                ON M.MecanicoId =
                    T.MecanicoId

            INNER JOIN dbo.MNT_Maquina MQ
                ON MQ.MaquinaId =
                    T.MaquinaId

            INNER JOIN dbo.MNT_TipoMantenimiento TM
                ON TM.TipoMantenimientoId =
                    T.TipoMantenimientoId

            LEFT JOIN dbo.MNT_TipoTrabajo TT
                ON TT.TipoTrabajoId =
                    T.TipoTrabajoId

            INNER JOIN dbo.MNT_Prioridad P
                ON P.PrioridadId =
                    T.PrioridadId

            INNER JOIN dbo.MNT_EstadoTicket E
                ON E.EstadoId =
                    T.EstadoId

            WHERE

                T.TicketId =
                    @TicketId

                ${filtro};

        `);

    if (
        result.recordset.length === 0
    ) {

        throw new Error(
            "El ticket no existe o no tiene acceso."
        );

    }

    return result.recordset[0];
}
// =====================================================
// CREAR TICKET
// =====================================================

export interface CrearTicket {

    mecanicoId: number;

    maquinaId: number;

    tipoMantenimientoId: number;

    tipoTrabajoId?: number;

    tipoTrabajoPersonalizado?: string;

    prioridadId: number;

    observaciones?: string;

}

// =====================================================
// CREAR TICKET
// =====================================================

export async function crearTicket(
    data: CrearTicket,
    contexto: ContextoUsuario
) {

    validarContexto(contexto);

    const pool =
        await poolPromise;

    const request =
        pool.request();

    request.input(
        "MecanicoId",
        sql.Int,
        data.mecanicoId
    );

    request.input(
        "MaquinaId",
        sql.Int,
        data.maquinaId
    );

    request.input(
        "EmpresaId",
        sql.Int,
        contexto.empresaId
    );

    request.input(
        "PlantaId",
        sql.Int,
        contexto.plantaId
    );

    request.input(
        "TipoMantenimientoId",
        sql.Int,
        data.tipoMantenimientoId
    );

    request.input(
        "TipoTrabajoId",
        sql.Int,
        data.tipoTrabajoId || null
    );

    request.input(
        "TipoTrabajoPersonalizado",
        sql.NVarChar(200),
        data.tipoTrabajoPersonalizado || null
    );

    request.input(
        "PrioridadId",
        sql.Int,
        data.prioridadId
    );

    request.input(
        "Observaciones",
        sql.NVarChar(sql.MAX),
        data.observaciones || null
    );

    // =================================================
    // VALIDACIÓN DE EMPRESA + PLANTA
    // =================================================

    const validacion =
        await request.query(`

            SELECT

                M.MecanicoId,

                MQ.MaquinaId

            FROM dbo.MNT_Mecanico M

            CROSS JOIN dbo.MNT_Maquina MQ

            WHERE
                M.MecanicoId = @MecanicoId

                AND MQ.MaquinaId = @MaquinaId

                AND M.EmpresaId = @EmpresaId
                AND M.PlantaId = @PlantaId

                AND MQ.EmpresaId = @EmpresaId
                AND MQ.PlantaId = @PlantaId

                AND M.Activo = 1
                AND MQ.Activo = 1;

        `);

    if (
        validacion.recordset.length === 0
    ) {

        throw new Error(
            "El mecánico o la máquina no pertenecen a la Empresa y Planta del usuario."
        );

    }

    // =================================================
    // MECÁNICO NO PUEDE CREAR PARA OTRO MECÁNICO
    // =================================================

    if (
        contexto.rol === "MECANICO"
    ) {

        if (
            contexto.mecanicoId === null ||
            contexto.mecanicoId !==
                data.mecanicoId
        ) {

            throw new Error(
                "El mecánico solo puede crear tickets para sí mismo."
            );

        }

    }

    // =================================================
    // CREAR
    // =================================================

    const result =
        await request.query(`

            DECLARE @NumeroTicket VARCHAR(50);

            SET @NumeroTicket =
                'MNT-' +
                RIGHT(
                    '000000' +
                    CAST(
                        NEXT VALUE FOR dbo.MNT_SeqTicket
                        AS VARCHAR(10)
                    ),
                    6
                );

            INSERT INTO dbo.MNT_Ticket
            (
                NumeroTicket,

                MecanicoId,
                MaquinaId,

                TipoMantenimientoId,

                TipoTrabajoId,
                TipoTrabajoPersonalizado,

                PrioridadId,

                EstadoId,

                FechaReporte,
                HoraInicio,

                TrabajoRealizado,
                Observaciones,

                FechaCreacion
            )

            VALUES
            (
                @NumeroTicket,

                @MecanicoId,
                @MaquinaId,

                @TipoMantenimientoId,

                @TipoTrabajoId,
                @TipoTrabajoPersonalizado,

                @PrioridadId,

                (
                    SELECT EstadoId
                    FROM dbo.MNT_EstadoTicket
                    WHERE Nombre = 'En proceso'
                ),

                GETDATE(),
                GETDATE(),

                NULL,
                @Observaciones,

                GETDATE()
            );

            SELECT

                CAST(
                    SCOPE_IDENTITY()
                    AS INT
                ) AS TicketId,

                @NumeroTicket
                    AS NumeroTicket;

        `);

    return result.recordset[0];

}

// =====================================================
// ACTUALIZAR TRABAJO REALIZADO
// =====================================================

// =====================================================
// ACTUALIZAR TRABAJO REALIZADO
// =====================================================

export async function actualizarTicket(
    ticketId: number,
    trabajoRealizado: string,
    contexto: ContextoUsuario
) {

    validarContexto(contexto);

    const pool =
        await poolPromise;

    // =================================================
    // VERIFICAR ACCESO
    // =================================================

    const ticket =
        await obtenerTicketPorId(
            ticketId,
            contexto
        );

    if (!ticket) {

        throw new Error(
            "El ticket no existe o no pertenece a su Empresa y Planta."
        );

    }

    // =================================================
    // VALIDAR ESTADO
    // =================================================

    if (
        ticket.Estado ===
        "Finalizado"
    ) {

        throw new Error(
            "El ticket ya está finalizado y no puede modificarse."
        );

    }

    // =================================================
    // ASEGURAR QUE SEA STRING
    // =================================================

    const trabajo =
        typeof trabajoRealizado === "string"
            ? trabajoRealizado.trim()
            : String(
                trabajoRealizado ?? ""
            ).trim();

    // =================================================
    // ACTUALIZAR
    // =================================================

    await pool
        .request()

        .input(
            "TicketId",
            sql.Int,
            ticketId
        )

        .input(
            "TrabajoRealizado",
            sql.NVarChar(sql.MAX),
            trabajo
        )

        .input(
            "EmpresaId",
            sql.Int,
            contexto.empresaId
        )

        .input(
            "PlantaId",
            sql.Int,
            contexto.plantaId
        )

        .query(`

            UPDATE T

            SET

                T.TrabajoRealizado =
                    @TrabajoRealizado,

                T.FechaActualizacion =
                    GETDATE()

            FROM dbo.MNT_Ticket T

            INNER JOIN dbo.MNT_Mecanico M
                ON M.MecanicoId =
                    T.MecanicoId

            INNER JOIN dbo.MNT_Maquina MQ
                ON MQ.MaquinaId =
                    T.MaquinaId

            WHERE

                T.TicketId =
                    @TicketId

                AND M.EmpresaId =
                    @EmpresaId

                AND M.PlantaId =
                    @PlantaId

                AND MQ.EmpresaId =
                    @EmpresaId

                AND MQ.PlantaId =
                    @PlantaId

                AND T.EstadoId =
                (
                    SELECT EstadoId
                    FROM dbo.MNT_EstadoTicket
                    WHERE Nombre =
                        'En proceso'
                );

        `);

    return obtenerTicketPorId(
        ticketId,
        contexto
    );

}
// =====================================================
// FINALIZAR TICKET
// =====================================================

export async function finalizarTicket(
    ticketId: number,
    contexto: ContextoUsuario
) {

    validarContexto(contexto);

    const pool =
        await poolPromise;

    // =================================================
    // VERIFICAR ACCESO
    // =================================================

    const ticket =
        await obtenerTicketPorId(
            ticketId,
            contexto
        );

    if (!ticket) {

        throw new Error(
            "El ticket no existe o no pertenece a su Empresa y Planta."
        );

    }

    // =================================================
    // FINALIZAR
    // =================================================

    const result =
        await pool
            .request()

            .input(
                "TicketId",
                sql.Int,
                ticketId
            )

            .input(
                "EmpresaId",
                sql.Int,
                contexto.empresaId
            )

            .input(
                "PlantaId",
                sql.Int,
                contexto.plantaId
            )

            .query(`

                UPDATE T

                SET

                    T.HoraFin =
                        GETDATE(),

                    T.EstadoId =
                    (
                        SELECT EstadoId
                        FROM dbo.MNT_EstadoTicket
                        WHERE Nombre =
                            'Finalizado'
                    ),

                    T.FechaActualizacion =
                        GETDATE()

                FROM dbo.MNT_Ticket T

                INNER JOIN dbo.MNT_Mecanico M
                    ON M.MecanicoId =
                        T.MecanicoId

                INNER JOIN dbo.MNT_Maquina MQ
                    ON MQ.MaquinaId =
                        T.MaquinaId

                WHERE

                    T.TicketId =
                        @TicketId

                    AND M.EmpresaId =
                        @EmpresaId

                    AND M.PlantaId =
                        @PlantaId

                    AND MQ.EmpresaId =
                        @EmpresaId

                    AND MQ.PlantaId =
                        @PlantaId

                    AND T.EstadoId =
                    (
                        SELECT EstadoId
                        FROM dbo.MNT_EstadoTicket
                        WHERE Nombre =
                            'En proceso'
                    );

                SELECT
                    @@ROWCOUNT
                    AS FilasActualizadas;

            `);

    if (
        result.recordset[0]
            .FilasActualizadas === 0
    ) {

        throw new Error(
            "El ticket ya fue finalizado o no se encuentra en proceso."
        );

    }

    return obtenerTicketPorId(
        ticketId,
        contexto
    );

}