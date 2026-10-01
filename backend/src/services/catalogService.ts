import bcrypt from "bcryptjs";

import {
    poolPromise,
    sql
} from "../config/database";


/* =========================================================
   RELACIONES MÚLTIPLES EMPRESA / PLANTA
   ========================================================= */

function normalizarIds(
    ids?: number[] | null,
    idLegacy?: number | null
): number[] {
    const valores = Array.isArray(ids) && ids.length > 0
        ? ids
        : idLegacy != null
            ? [idLegacy]
            : [];

    const unicos = [...new Set(
        valores
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0)
    )];

    return unicos;
}

async function sincronizarRelacionesMecanico(
    mecanicoId: number,
    empresaIds: number[],
    plantaIds: number[]
) {
    const pool = await poolPromise;

    await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .query(`
            DELETE FROM dbo.MNT_MecanicoEmpresa
            WHERE MecanicoId = @MecanicoId;

            DELETE FROM dbo.MNT_MecanicoPlanta
            WHERE MecanicoId = @MecanicoId;
        `);

    for (const empresaId of empresaIds) {
        await pool.request()
            .input("MecanicoId", sql.Int, mecanicoId)
            .input("EmpresaId", sql.Int, empresaId)
            .query(`
                INSERT INTO dbo.MNT_MecanicoEmpresa
                    (MecanicoId, EmpresaId)
                VALUES
                    (@MecanicoId, @EmpresaId);
            `);
    }

    for (const plantaId of plantaIds) {
        await pool.request()
            .input("MecanicoId", sql.Int, mecanicoId)
            .input("PlantaId", sql.Int, plantaId)
            .query(`
                INSERT INTO dbo.MNT_MecanicoPlanta
                    (MecanicoId, PlantaId)
                VALUES
                    (@MecanicoId, @PlantaId);
            `);
    }
}

async function sincronizarRelacionesMaquina(
    maquinaId: number,
    empresaIds: number[],
    plantaIds: number[]
) {
    const pool = await poolPromise;

    await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .query(`
            DELETE FROM dbo.MNT_MaquinaEmpresa
            WHERE MaquinaId = @MaquinaId;

            DELETE FROM dbo.MNT_MaquinaPlanta
            WHERE MaquinaId = @MaquinaId;
        `);

    for (const empresaId of empresaIds) {
        await pool.request()
            .input("MaquinaId", sql.Int, maquinaId)
            .input("EmpresaId", sql.Int, empresaId)
            .query(`
                INSERT INTO dbo.MNT_MaquinaEmpresa
                    (MaquinaId, EmpresaId)
                VALUES
                    (@MaquinaId, @EmpresaId);
            `);
    }

    for (const plantaId of plantaIds) {
        await pool.request()
            .input("MaquinaId", sql.Int, maquinaId)
            .input("PlantaId", sql.Int, plantaId)
            .query(`
                INSERT INTO dbo.MNT_MaquinaPlanta
                    (MaquinaId, PlantaId)
                VALUES
                    (@MaquinaId, @PlantaId);
            `);
    }
}

async function obtenerRelacionesMecanicos(mecanicos: any[]) {
    if (mecanicos.length === 0) return mecanicos;

    const pool = await poolPromise;
    const ids = mecanicos.map(m => m.MecanicoId);

    const parametros = ids.map((_, index) => `@MecanicoId${index}`);

    const empresasRequest = pool.request();
    const plantasRequest = pool.request();

    ids.forEach((id, index) => {
        const nombre = `MecanicoId${index}`;
        empresasRequest.input(nombre, sql.Int, id);
        plantasRequest.input(nombre, sql.Int, id);
    });

    const empresas = await empresasRequest.query(`
        SELECT MecanicoId, EmpresaId
        FROM dbo.MNT_MecanicoEmpresa
        WHERE MecanicoId IN (${parametros.join(", ")})
        ORDER BY MecanicoId, EmpresaId;
    `);

    const plantas = await plantasRequest.query(`
        SELECT MecanicoId, PlantaId
        FROM dbo.MNT_MecanicoPlanta
        WHERE MecanicoId IN (${parametros.join(", ")})
        ORDER BY MecanicoId, PlantaId;
    `);

    return mecanicos.map(mecanico => {
        const empresasRelacionadas = empresas.recordset
            .filter(r => r.MecanicoId === mecanico.MecanicoId)
            .map(r => r.EmpresaId);

        const plantasRelacionadas = plantas.recordset
            .filter(r => r.MecanicoId === mecanico.MecanicoId)
            .map(r => r.PlantaId);

        return {
            ...mecanico,
            EmpresaIds: empresasRelacionadas.length > 0
                ? empresasRelacionadas
                : normalizarIds(undefined, mecanico.EmpresaId),
            PlantaIds: plantasRelacionadas.length > 0
                ? plantasRelacionadas
                : normalizarIds(undefined, mecanico.PlantaId)
        };
    });
}

async function obtenerRelacionesMaquinas(maquinas: any[]) {
    if (maquinas.length === 0) return maquinas;

    const pool = await poolPromise;
    const ids = maquinas.map(m => m.MaquinaId);

    const parametros = ids.map((_, index) => `@MaquinaId${index}`);

    const empresasRequest = pool.request();
    const plantasRequest = pool.request();

    ids.forEach((id, index) => {
        const nombre = `MaquinaId${index}`;
        empresasRequest.input(nombre, sql.Int, id);
        plantasRequest.input(nombre, sql.Int, id);
    });

    const empresas = await empresasRequest.query(`
        SELECT MaquinaId, EmpresaId
        FROM dbo.MNT_MaquinaEmpresa
        WHERE MaquinaId IN (${parametros.join(", ")})
        ORDER BY MaquinaId, EmpresaId;
    `);

    const plantas = await plantasRequest.query(`
        SELECT MaquinaId, PlantaId
        FROM dbo.MNT_MaquinaPlanta
        WHERE MaquinaId IN (${parametros.join(", ")})
        ORDER BY MaquinaId, PlantaId;
    `);

    return maquinas.map(maquina => {
        const empresasRelacionadas = empresas.recordset
            .filter(r => r.MaquinaId === maquina.MaquinaId)
            .map(r => r.EmpresaId);

        const plantasRelacionadas = plantas.recordset
            .filter(r => r.MaquinaId === maquina.MaquinaId)
            .map(r => r.PlantaId);

        return {
            ...maquina,
            EmpresaIds: empresasRelacionadas.length > 0
                ? empresasRelacionadas
                : normalizarIds(undefined, maquina.EmpresaId),
            PlantaIds: plantasRelacionadas.length > 0
                ? plantasRelacionadas
                : normalizarIds(undefined, maquina.PlantaId)
        };
    });
}


/* =========================================================
   EMPRESAS Y PLANTAS
   ========================================================= */

/**
 * Obtiene las empresas que puede administrar un usuario.
 *
 * SUPERADMIN:
 *   usuarioId = null
 *   → obtiene todas las empresas activas.
 *
 * ADMIN:
 *   usuarioId = ID del usuario
 *   → obtiene únicamente las empresas registradas
 *     en MNT_UsuarioEmpresa.
 */
export async function obtenerEmpresasAdmin(
    usuarioId?: number | null
) {
    const pool = await poolPromise;
    const request = pool.request();

    if (usuarioId == null) {
        const result = await request.query(`
            SELECT
                EmpresaId,
                Codigo,
                Nombre,
                Activo
            FROM dbo.MNT_Empresa
            WHERE Activo = 1
            ORDER BY Codigo, Nombre
        `);

        return result.recordset;
    }

    request.input(
        "UsuarioId",
        sql.Int,
        usuarioId
    );

    const result = await request.query(`
        SELECT
            E.EmpresaId,
            E.Codigo,
            E.Nombre,
            E.Activo
        FROM dbo.MNT_Empresa E
        INNER JOIN dbo.MNT_UsuarioEmpresa UE
            ON UE.EmpresaId = E.EmpresaId
        WHERE E.Activo = 1
          AND UE.UsuarioId = @UsuarioId
        ORDER BY E.Codigo, E.Nombre
    `);

    return result.recordset;
}


/**
 * Obtiene las plantas que puede administrar un usuario.
 *
 * SUPERADMIN:
 *   usuarioId = null
 *   → obtiene todas las plantas activas.
 *
 * ADMIN:
 *   usuarioId = ID del usuario
 *   → obtiene únicamente las plantas registradas
 *     en MNT_UsuarioPlanta.
 */
export async function obtenerPlantasAdmin(
    usuarioId?: number | null
) {
    const pool = await poolPromise;
    const request = pool.request();

    if (usuarioId == null) {
        const result = await request.query(`
            SELECT
                P.PlantaId,
                P.Codigo,
                P.Nombre,
                P.Activo
            FROM dbo.MNT_Planta P
            WHERE P.Activo = 1
            ORDER BY P.Codigo, P.Nombre
        `);

        return result.recordset;
    }

    request.input(
        "UsuarioId",
        sql.Int,
        usuarioId
    );

    const result = await request.query(`
        SELECT
            P.PlantaId,
            P.Codigo,
            P.Nombre,
            P.Activo
        FROM dbo.MNT_Planta P
        INNER JOIN dbo.MNT_UsuarioPlanta UP
            ON UP.PlantaId = P.PlantaId
        WHERE P.Activo = 1
          AND UP.UsuarioId = @UsuarioId
        ORDER BY P.Codigo, P.Nombre
    `);

    return result.recordset;
}


/**
 * Valida que una combinación Empresa + Planta exista
 * y que ambas estén activas.
 *
 * NOTA:
 * Esta función valida la existencia de la relación
 * dentro del catálogo. La validación del alcance del
 * usuario se realiza por separado.
 */
export async function validarEmpresaPlanta(
    empresaId: number,
    plantaId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            "EmpresaId",
            sql.Int,
            empresaId
        )
        .input(
            "PlantaId",
            sql.Int,
            plantaId
        )
        .query(`
            SELECT TOP 1
                P.PlantaId
            FROM dbo.MNT_Planta P
            INNER JOIN dbo.MNT_Empresa E
                ON E.EmpresaId = @EmpresaId
            WHERE P.PlantaId = @PlantaId
              AND P.Activo = 1
              AND E.Activo = 1
        `);

    return result.recordset.length > 0;
}
/* =========================================================
   CATÁLOGOS UTILIZADOS POR LOS TICKETS
   ========================================================= */

export async function obtenerMecanicos(
    empresaId: number,
    plantaId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            SELECT DISTINCT
                M.MecanicoId,
                M.Codigo,
                M.Nombre,
                M.Apellido,
                M.Telefono,
                M.Correo,
                M.Activo,
                M.EmpresaId,
                M.PlantaId
            FROM dbo.MNT_Mecanico M
            WHERE M.Activo = 1
              AND (
                    M.EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoEmpresa ME
                        WHERE ME.MecanicoId = M.MecanicoId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    M.PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoPlanta MP
                        WHERE MP.MecanicoId = M.MecanicoId
                          AND MP.PlantaId = @PlantaId
                    )
              )
            ORDER BY M.Nombre, M.Apellido
        `);

    return result.recordset;
}

export async function obtenerMaquinas(
    empresaId: number,
    plantaId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            SELECT DISTINCT
                M.MaquinaId,
                M.Codigo,
                M.Nombre,
                M.Marca,
                M.Modelo,
                M.Serie,
                M.Ubicacion,
                M.Descripcion,
                M.Activo,
                M.EmpresaId,
                M.PlantaId
            FROM dbo.MNT_Maquina M
            WHERE M.Activo = 1
              AND (
                    M.EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaEmpresa ME
                        WHERE ME.MaquinaId = M.MaquinaId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    M.PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaPlanta MP
                        WHERE MP.MaquinaId = M.MaquinaId
                          AND MP.PlantaId = @PlantaId
                    )
              )
            ORDER BY M.Nombre
        `);

    return result.recordset;
}

export async function obtenerMaquinasPorMecanico(
    mecanicoId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            "MecanicoId",
            sql.Int,
            mecanicoId
        )
        .query(`
            SELECT DISTINCT
                M.MaquinaId,
                M.Codigo,
                M.Nombre,
                M.Marca,
                M.Modelo,
                M.Serie,
                M.Ubicacion,
                M.Descripcion,
                M.Activo,
                M.EmpresaId,
                M.PlantaId
            FROM dbo.MNT_Maquina M
            WHERE M.Activo = 1

              AND EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MecanicoEmpresa ME
                    WHERE ME.MecanicoId = @MecanicoId
                      AND (
                            ME.EmpresaId = M.EmpresaId
                            OR EXISTS (
                                SELECT 1
                                FROM dbo.MNT_MaquinaEmpresa MXE
                                WHERE MXE.MaquinaId = M.MaquinaId
                                  AND MXE.EmpresaId = ME.EmpresaId
                            )
                      )
              )

              AND EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MecanicoPlanta MP
                    WHERE MP.MecanicoId = @MecanicoId
                      AND (
                            MP.PlantaId = M.PlantaId
                            OR EXISTS (
                                SELECT 1
                                FROM dbo.MNT_MaquinaPlanta MXP
                                WHERE MXP.MaquinaId = M.MaquinaId
                                  AND MXP.PlantaId = MP.PlantaId
                            )
                      )
              )

            ORDER BY M.Nombre
        `);

    return result.recordset;
}

/* =========================================================
   OTROS CATÁLOGOS
   ========================================================= */

export async function obtenerTiposMantenimiento() {

    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            TipoMantenimientoId,
            Nombre,
            Descripcion,
            Activo
        FROM dbo.MNT_TipoMantenimiento
        WHERE Activo = 1
        ORDER BY Nombre
    `);

    return result.recordset;
}


export async function obtenerTiposTrabajo() {

    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            TipoTrabajoId,
            Nombre,
            Descripcion,
            Activo
        FROM dbo.MNT_TipoTrabajo
        WHERE Activo = 1
        ORDER BY Nombre
    `);

    return result.recordset;
}


export async function obtenerPrioridades() {

    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            PrioridadId,
            Nombre,
            Nivel,
            Activo
        FROM dbo.MNT_Prioridad
        WHERE Activo = 1
        ORDER BY Nivel
    `);

    return result.recordset;
}


export async function obtenerEstados() {

    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            EstadoId,
            Nombre,
            Descripcion,
            Activo
        FROM dbo.MNT_EstadoTicket
        WHERE Activo = 1
        ORDER BY EstadoId
    `);

    return result.recordset;
}


/* =========================================================
   ADMINISTRACIÓN DE MECÁNICOS
   ========================================================= */

export async function obtenerMecanicosAdmin(
    empresaId?: number | null,
    plantaId?: number | null
) {
    const pool = await poolPromise;
    const request = pool.request();

    let where = "WHERE 1 = 1";

    if (empresaId != null) {
        request.input("EmpresaId", sql.Int, empresaId);
        where += `
            AND (
                M.EmpresaId = @EmpresaId
                OR EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MecanicoEmpresa ME
                    WHERE ME.MecanicoId = M.MecanicoId
                      AND ME.EmpresaId = @EmpresaId
                )
            )
        `;
    }

    if (plantaId != null) {
        request.input("PlantaId", sql.Int, plantaId);
        where += `
            AND (
                M.PlantaId = @PlantaId
                OR EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MecanicoPlanta MP
                    WHERE MP.MecanicoId = M.MecanicoId
                      AND MP.PlantaId = @PlantaId
                )
            )
        `;
    }

    const result = await request.query(`
        SELECT
            M.MecanicoId,
            M.Codigo,
            M.Nombre,
            M.Apellido,
            M.Telefono,
            M.Correo,
            M.Usuario,
            M.Activo,
            M.EmpresaId,
            M.PlantaId,
            M.FechaCreacion
        FROM dbo.MNT_Mecanico M
        ${where}
        ORDER BY M.Nombre, M.Apellido
    `);

    return obtenerRelacionesMecanicos(result.recordset);
}

export async function crearMecanico(data: {
    Nombre: string;
    Apellido?: string | null;
    Usuario: string;
    Password: string;
    Activo?: boolean;
    EmpresaId?: number;
    PlantaId?: number;
    EmpresaIds?: number[];
    PlantaIds?: number[];
}) {
    const empresaIds = normalizarIds(data.EmpresaIds, data.EmpresaId);
    const plantaIds = normalizarIds(data.PlantaIds, data.PlantaId);

    if (empresaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una empresa.");
    }

    if (plantaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una planta.");
    }

    const pool = await poolPromise;

    const usuarioExistente = await pool.request()
        .input("Usuario", sql.NVarChar(100), data.Usuario)
        .query(`
            SELECT MecanicoId
            FROM dbo.MNT_Mecanico
            WHERE Usuario = @Usuario
        `);

    if (usuarioExistente.recordset.length > 0) {
        throw new Error("El nombre de usuario ya está registrado.");
    }

    const passwordHash = await bcrypt.hash(data.Password, 10);
    const codigoTemporal = `MEC-TMP-${Date.now()}`.slice(0, 20);

    const result = await pool.request()
        .input("Codigo", sql.NVarChar(50), codigoTemporal)
        .input("Nombre", sql.NVarChar(100), data.Nombre)
        .input("Apellido", sql.NVarChar(100), data.Apellido || null)
        .input("Usuario", sql.NVarChar(100), data.Usuario)
        .input("PasswordHash", sql.NVarChar(255), passwordHash)
        .input("Activo", sql.Bit, data.Activo ?? true)
        .input("EmpresaId", sql.Int, empresaIds[0])
        .input("PlantaId", sql.Int, plantaIds[0])
        .query(`
            INSERT INTO dbo.MNT_Mecanico
            (
                Codigo,
                Nombre,
                Apellido,
                Telefono,
                Correo,
                Activo,
                FechaCreacion,
                Usuario,
                PasswordHash,
                EmpresaId,
                PlantaId
            )
            VALUES
            (
                @Codigo,
                @Nombre,
                @Apellido,
                NULL,
                NULL,
                @Activo,
                GETDATE(),
                @Usuario,
                @PasswordHash,
                @EmpresaId,
                @PlantaId
            );

            SELECT SCOPE_IDENTITY() AS MecanicoId;
        `);

    const mecanicoId = Number(result.recordset[0].MecanicoId);
    const codigoAdministrativo = `MEC-${String(mecanicoId).padStart(3, "0")}`;

    await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .input("Codigo", sql.NVarChar(50), codigoAdministrativo)
        .query(`
            UPDATE dbo.MNT_Mecanico
            SET Codigo = @Codigo
            WHERE MecanicoId = @MecanicoId
        `);

    await sincronizarRelacionesMecanico(
        mecanicoId,
        empresaIds,
        plantaIds
    );

    const creado = await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .query(`
            SELECT
                MecanicoId,
                Codigo,
                Nombre,
                Apellido,
                Telefono,
                Correo,
                Usuario,
                Activo,
                EmpresaId,
                PlantaId,
                FechaCreacion
            FROM dbo.MNT_Mecanico
            WHERE MecanicoId = @MecanicoId
        `);

    const [conRelaciones] = await obtenerRelacionesMecanicos(creado.recordset);
    return conRelaciones;
}

/* =========================================================
   ACTUALIZAR MECÁNICO
   ========================================================= */

export async function actualizarMecanico(
    mecanicoId: number,
    data: {
        Nombre: string;
        Apellido?: string | null;
        Usuario: string;
        Password?: string | null;
        Activo?: boolean;
        EmpresaId?: number;
        PlantaId?: number;
        EmpresaIds?: number[];
        PlantaIds?: number[];
    },
    empresaId: number,
    plantaId: number
) {
    const empresaIds = normalizarIds(data.EmpresaIds, data.EmpresaId ?? empresaId);
    const plantaIds = normalizarIds(data.PlantaIds, data.PlantaId ?? plantaId);

    if (empresaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una empresa.");
    }

    if (plantaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una planta.");
    }

    const pool = await poolPromise;

    const perteneceAlAlcance = await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            SELECT MecanicoId
            FROM dbo.MNT_Mecanico M
            WHERE M.MecanicoId = @MecanicoId
              AND (
                    M.EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoEmpresa ME
                        WHERE ME.MecanicoId = M.MecanicoId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    M.PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoPlanta MP
                        WHERE MP.MecanicoId = M.MecanicoId
                          AND MP.PlantaId = @PlantaId
                    )
              )
        `);

    if (perteneceAlAlcance.recordset.length === 0) {
        throw new Error("El mecánico no pertenece a la empresa y planta del administrador.");
    }

    const usuarioExistente = await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .input("Usuario", sql.NVarChar(100), data.Usuario)
        .query(`
            SELECT MecanicoId
            FROM dbo.MNT_Mecanico
            WHERE Usuario = @Usuario
              AND MecanicoId <> @MecanicoId
        `);

    if (usuarioExistente.recordset.length > 0) {
        throw new Error("El nombre de usuario ya está registrado por otro mecánico.");
    }

    const passwordHash = data.Password && data.Password.trim() !== ""
        ? await bcrypt.hash(data.Password, 10)
        : null;

    const request = pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .input("Nombre", sql.NVarChar(100), data.Nombre)
        .input("Apellido", sql.NVarChar(100), data.Apellido || null)
        .input("Usuario", sql.NVarChar(100), data.Usuario)
        .input("Activo", sql.Bit, data.Activo ?? true)
        .input("EmpresaId", sql.Int, empresaIds[0])
        .input("PlantaId", sql.Int, plantaIds[0]);

    if (passwordHash) {
        request.input("PasswordHash", sql.NVarChar(255), passwordHash);

        await request.query(`
            UPDATE dbo.MNT_Mecanico
            SET
                Nombre = @Nombre,
                Apellido = @Apellido,
                Usuario = @Usuario,
                PasswordHash = @PasswordHash,
                Activo = @Activo,
                EmpresaId = @EmpresaId,
                PlantaId = @PlantaId
            WHERE MecanicoId = @MecanicoId
        `);
    } else {
        await request.query(`
            UPDATE dbo.MNT_Mecanico
            SET
                Nombre = @Nombre,
                Apellido = @Apellido,
                Usuario = @Usuario,
                Activo = @Activo,
                EmpresaId = @EmpresaId,
                PlantaId = @PlantaId
            WHERE MecanicoId = @MecanicoId
        `);
    }

    await sincronizarRelacionesMecanico(
        mecanicoId,
        empresaIds,
        plantaIds
    );

    const resultado = await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .query(`
            SELECT
                MecanicoId,
                Codigo,
                Nombre,
                Apellido,
                Telefono,
                Correo,
                Usuario,
                Activo,
                EmpresaId,
                PlantaId,
                FechaCreacion
            FROM dbo.MNT_Mecanico
            WHERE MecanicoId = @MecanicoId
        `);

    if (resultado.recordset.length === 0) {
        throw new Error("El mecánico no existe.");
    }

    const [actualizado] = await obtenerRelacionesMecanicos(resultado.recordset);
    return actualizado;
}

/* =========================================================
   CAMBIAR ESTADO MECÁNICO
   ========================================================= */

export async function cambiarEstadoMecanico(
    mecanicoId: number,
    activo: boolean,
    empresaId: number,
    plantaId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("MecanicoId", sql.Int, mecanicoId)
        .input("Activo", sql.Bit, activo)
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            UPDATE dbo.MNT_Mecanico
            SET Activo = @Activo
            WHERE MecanicoId = @MecanicoId
              AND (
                    EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoEmpresa ME
                        WHERE ME.MecanicoId = MNT_Mecanico.MecanicoId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MecanicoPlanta MP
                        WHERE MP.MecanicoId = MNT_Mecanico.MecanicoId
                          AND MP.PlantaId = @PlantaId
                    )
              )
        `);

    if (result.rowsAffected[0] === 0) {
        throw new Error("El mecánico no pertenece a la empresa y planta del administrador.");
    }

    return {
        MecanicoId: mecanicoId,
        Activo: activo
    };
}

/* =========================================================
   ADMINISTRACIÓN DE MÁQUINAS
   ========================================================= */

export async function obtenerMaquinasAdmin(
    empresaId?: number | null,
    plantaId?: number | null
) {
    const pool = await poolPromise;
    const request = pool.request();

    let where = "WHERE 1 = 1";

    if (empresaId != null) {
        request.input("EmpresaId", sql.Int, empresaId);
        where += `
            AND (
                M.EmpresaId = @EmpresaId
                OR EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MaquinaEmpresa ME
                    WHERE ME.MaquinaId = M.MaquinaId
                      AND ME.EmpresaId = @EmpresaId
                )
            )
        `;
    }

    if (plantaId != null) {
        request.input("PlantaId", sql.Int, plantaId);
        where += `
            AND (
                M.PlantaId = @PlantaId
                OR EXISTS (
                    SELECT 1
                    FROM dbo.MNT_MaquinaPlanta MP
                    WHERE MP.MaquinaId = M.MaquinaId
                      AND MP.PlantaId = @PlantaId
                )
            )
        `;
    }

    const result = await request.query(`
        SELECT
            M.MaquinaId,
            M.Codigo,
            M.Nombre,
            M.Marca,
            M.Modelo,
            M.Serie,
            M.Ubicacion,
            M.Descripcion,
            M.Activo,
            M.EmpresaId,
            M.PlantaId,
            M.FechaCreacion
        FROM dbo.MNT_Maquina M
        ${where}
        ORDER BY M.Nombre
    `);

    return obtenerRelacionesMaquinas(result.recordset);
}

/* =========================================================
   CREAR MÁQUINA
   ========================================================= */

export async function crearMaquina(data: {
    Codigo: string;
    Nombre: string;
    Ubicacion?: string | null;
    Descripcion?: string | null;
    Activo?: boolean;
    EmpresaId?: number;
    PlantaId?: number;
    EmpresaIds?: number[];
    PlantaIds?: number[];
}) {
    const empresaIds = normalizarIds(data.EmpresaIds, data.EmpresaId);
    const plantaIds = normalizarIds(data.PlantaIds, data.PlantaId);

    if (empresaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una empresa.");
    }

    if (plantaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una planta.");
    }

    const pool = await poolPromise;

    const codigoExistente = await pool.request()
        .input("Codigo", sql.NVarChar(50), data.Codigo)
        .query(`
            SELECT MaquinaId
            FROM dbo.MNT_Maquina
            WHERE Codigo = @Codigo
        `);

    if (codigoExistente.recordset.length > 0) {
        throw new Error("El código de máquina ya está registrado.");
    }

    const result = await pool.request()
        .input("Codigo", sql.NVarChar(50), data.Codigo)
        .input("Nombre", sql.NVarChar(150), data.Nombre)
        .input("Ubicacion", sql.NVarChar(200), data.Ubicacion || null)
        .input("Descripcion", sql.NVarChar(500), data.Descripcion || null)
        .input("Activo", sql.Bit, data.Activo ?? true)
        .input("EmpresaId", sql.Int, empresaIds[0])
        .input("PlantaId", sql.Int, plantaIds[0])
        .query(`
            INSERT INTO dbo.MNT_Maquina
            (
                Codigo,
                Nombre,
                Marca,
                Modelo,
                Serie,
                Ubicacion,
                Descripcion,
                Activo,
                FechaCreacion,
                EmpresaId,
                PlantaId
            )
            VALUES
            (
                @Codigo,
                @Nombre,
                NULL,
                NULL,
                NULL,
                @Ubicacion,
                @Descripcion,
                @Activo,
                GETDATE(),
                @EmpresaId,
                @PlantaId
            );

            SELECT
                MaquinaId,
                Codigo,
                Nombre,
                Marca,
                Modelo,
                Serie,
                Ubicacion,
                Descripcion,
                Activo,
                EmpresaId,
                PlantaId,
                FechaCreacion
            FROM dbo.MNT_Maquina
            WHERE MaquinaId = SCOPE_IDENTITY();
        `);

    const maquina = result.recordset[0];

    await sincronizarRelacionesMaquina(
        maquina.MaquinaId,
        empresaIds,
        plantaIds
    );

    const actualizado = await pool.request()
        .input("MaquinaId", sql.Int, maquina.MaquinaId)
        .query(`
            SELECT
                MaquinaId,
                Codigo,
                Nombre,
                Marca,
                Modelo,
                Serie,
                Ubicacion,
                Descripcion,
                Activo,
                EmpresaId,
                PlantaId,
                FechaCreacion
            FROM dbo.MNT_Maquina
            WHERE MaquinaId = @MaquinaId
        `);

    const [conRelaciones] = await obtenerRelacionesMaquinas(actualizado.recordset);
    return conRelaciones;
}

/* =========================================================
   ACTUALIZAR MÁQUINA
   ========================================================= */

export async function actualizarMaquina(
    maquinaId: number,
    data: {
        Codigo: string;
        Nombre: string;
        Ubicacion?: string | null;
        Descripcion?: string | null;
        Activo?: boolean;
        EmpresaId?: number;
        PlantaId?: number;
        EmpresaIds?: number[];
        PlantaIds?: number[];
    },
    empresaId: number,
    plantaId: number
) {
    const empresaIds = normalizarIds(data.EmpresaIds, data.EmpresaId ?? empresaId);
    const plantaIds = normalizarIds(data.PlantaIds, data.PlantaId ?? plantaId);

    if (empresaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una empresa.");
    }

    if (plantaIds.length === 0) {
        throw new Error("Debe seleccionar al menos una planta.");
    }

    const pool = await poolPromise;

    const perteneceAlAlcance = await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            SELECT MaquinaId
            FROM dbo.MNT_Maquina M
            WHERE M.MaquinaId = @MaquinaId
              AND (
                    M.EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaEmpresa ME
                        WHERE ME.MaquinaId = M.MaquinaId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    M.PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaPlanta MP
                        WHERE MP.MaquinaId = M.MaquinaId
                          AND MP.PlantaId = @PlantaId
                    )
              )
        `);

    if (perteneceAlAlcance.recordset.length === 0) {
        throw new Error("La máquina no pertenece a la empresa y planta del administrador.");
    }

    const codigoExistente = await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .input("Codigo", sql.NVarChar(50), data.Codigo)
        .query(`
            SELECT MaquinaId
            FROM dbo.MNT_Maquina
            WHERE Codigo = @Codigo
              AND MaquinaId <> @MaquinaId
        `);

    if (codigoExistente.recordset.length > 0) {
        throw new Error("El código de máquina ya está registrado por otra máquina.");
    }

    const result = await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .input("Codigo", sql.NVarChar(50), data.Codigo)
        .input("Nombre", sql.NVarChar(150), data.Nombre)
        .input("Ubicacion", sql.NVarChar(200), data.Ubicacion || null)
        .input("Descripcion", sql.NVarChar(500), data.Descripcion || null)
        .input("Activo", sql.Bit, data.Activo ?? true)
        .input("EmpresaId", sql.Int, empresaIds[0])
        .input("PlantaId", sql.Int, plantaIds[0])
        .query(`
            UPDATE dbo.MNT_Maquina
            SET
                Codigo = @Codigo,
                Nombre = @Nombre,
                Ubicacion = @Ubicacion,
                Descripcion = @Descripcion,
                Activo = @Activo,
                EmpresaId = @EmpresaId,
                PlantaId = @PlantaId
            WHERE MaquinaId = @MaquinaId
        `);

    if (result.rowsAffected[0] === 0) {
        throw new Error("La máquina no existe.");
    }

    await sincronizarRelacionesMaquina(
        maquinaId,
        empresaIds,
        plantaIds
    );

    const resultado = await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .query(`
            SELECT
                MaquinaId,
                Codigo,
                Nombre,
                Marca,
                Modelo,
                Serie,
                Ubicacion,
                Descripcion,
                Activo,
                EmpresaId,
                PlantaId,
                FechaCreacion
            FROM dbo.MNT_Maquina
            WHERE MaquinaId = @MaquinaId
        `);

    const [actualizada] = await obtenerRelacionesMaquinas(resultado.recordset);
    return actualizada;
}

/* =========================================================
   CAMBIAR ESTADO MÁQUINA
   ========================================================= */

export async function cambiarEstadoMaquina(
    maquinaId: number,
    activo: boolean,
    empresaId: number,
    plantaId: number
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("MaquinaId", sql.Int, maquinaId)
        .input("Activo", sql.Bit, activo)
        .input("EmpresaId", sql.Int, empresaId)
        .input("PlantaId", sql.Int, plantaId)
        .query(`
            UPDATE dbo.MNT_Maquina
            SET Activo = @Activo
            WHERE MaquinaId = @MaquinaId
              AND (
                    EmpresaId = @EmpresaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaEmpresa ME
                        WHERE ME.MaquinaId = MNT_Maquina.MaquinaId
                          AND ME.EmpresaId = @EmpresaId
                    )
              )
              AND (
                    PlantaId = @PlantaId
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.MNT_MaquinaPlanta MP
                        WHERE MP.MaquinaId = MNT_Maquina.MaquinaId
                          AND MP.PlantaId = @PlantaId
                    )
              )
        `);

    if (result.rowsAffected[0] === 0) {
        throw new Error("La máquina no pertenece a la empresa y planta del administrador.");
    }

    return {
        MaquinaId: maquinaId,
        Activo: activo
    };
}

/* =========================================================
   HISTORIAL DE MANTENIMIENTO
   ========================================================= */

export async function obtenerHistorialMaquina(

    maquinaId: number,
    empresaId: number,
    plantaId: number

) {

    const pool = await poolPromise;


    const result =
        await pool.request()

            .input(
                "MaquinaId",
                sql.Int,
                maquinaId
            )

            .input(
                "EmpresaId",
                sql.Int,
                empresaId
            )

            .input(
                "PlantaId",
                sql.Int,
                plantaId
            )

            .query(`
                SELECT
                    T.TicketId,
                    T.NumeroTicket,

                    T.MaquinaId,

                    M.Codigo AS CodigoMaquina,
                    M.Nombre AS Maquina,

                    MC.MecanicoId,

                    CONCAT(
                        MC.Nombre,
                        CASE
                            WHEN MC.Apellido IS NULL
                                 OR MC.Apellido = ''
                            THEN ''
                            ELSE ' ' + MC.Apellido
                        END
                    ) AS Mecanico,

                    TM.TipoMantenimientoId,
                    TM.Nombre AS TipoMantenimiento,

                    P.PrioridadId,
                    P.Nombre AS Prioridad,

                    E.EstadoId,
                    E.Nombre AS Estado,

                    T.FechaReporte,
                    T.HoraInicio,
                    T.HoraFin,

                    T.TrabajoRealizado,
                    T.Observaciones,

                    T.FechaCreacion,
                    T.FechaActualizacion

                FROM dbo.MNT_Ticket T

                INNER JOIN dbo.MNT_Maquina M
                    ON M.MaquinaId = T.MaquinaId

                INNER JOIN dbo.MNT_Mecanico MC
                    ON MC.MecanicoId = T.MecanicoId

                INNER JOIN dbo.MNT_TipoMantenimiento TM
                    ON TM.TipoMantenimientoId =
                       T.TipoMantenimientoId

                INNER JOIN dbo.MNT_Prioridad P
                    ON P.PrioridadId = T.PrioridadId

                INNER JOIN dbo.MNT_EstadoTicket E
                    ON E.EstadoId = T.EstadoId

                WHERE
                    T.MaquinaId = @MaquinaId

                    AND (
                        M.EmpresaId = @EmpresaId
                        OR EXISTS (
                            SELECT 1
                            FROM dbo.MNT_MaquinaEmpresa ME
                            WHERE ME.MaquinaId = M.MaquinaId
                              AND ME.EmpresaId = @EmpresaId
                        )
                    )

                    AND (
                        M.PlantaId = @PlantaId
                        OR EXISTS (
                            SELECT 1
                            FROM dbo.MNT_MaquinaPlanta MP
                            WHERE MP.MaquinaId = M.MaquinaId
                              AND MP.PlantaId = @PlantaId
                        )
                    )

                ORDER BY
                    T.FechaReporte DESC,
                    T.TicketId DESC
            `);


    return result.recordset;
}

/* =========================================================
   ADMINISTRACIÓN DE USUARIOS ADMINISTRADORES
   ========================================================= */

/**
 * Obtener administradores.
 *
 * IMPORTANTE:
 * - No devuelve SUPERADMIN.
 * - Devuelve las empresas y plantas asignadas mediante
 *   MNT_UsuarioEmpresa y MNT_UsuarioPlanta.
 */
export async function obtenerAdministradores() {

    const pool = await poolPromise;

    const usuariosResult =
        await pool.request().query(`
            SELECT
                U.UsuarioId,
                U.Usuario,
                U.Rol,
                U.Activo,
                U.EmpresaId,
                U.PlantaId,
                U.FechaCreacion
            FROM dbo.MNT_Usuario U
            WHERE U.Rol = 'ADMIN'
            ORDER BY
                U.Usuario
        `);

    const usuarios = usuariosResult.recordset;

    if (usuarios.length === 0) {
        return [];
    }

    const usuarioIds =
        usuarios
            .map((u: any) => Number(u.UsuarioId))
            .join(",");

    const empresasResult =
        await pool.request().query(`
            SELECT
                UE.UsuarioId,
                UE.EmpresaId
            FROM dbo.MNT_UsuarioEmpresa UE
            WHERE UE.UsuarioId IN (${usuarioIds})
            ORDER BY
                UE.UsuarioId,
                UE.EmpresaId
        `);

    const plantasResult =
        await pool.request().query(`
            SELECT
                UP.UsuarioId,
                UP.PlantaId
            FROM dbo.MNT_UsuarioPlanta UP
            WHERE UP.UsuarioId IN (${usuarioIds})
            ORDER BY
                UP.UsuarioId,
                UP.PlantaId
        `);

    return usuarios.map((usuario: any) => {

        const empresas =
            empresasResult.recordset
                .filter(
                    (x: any) =>
                        Number(x.UsuarioId) ===
                        Number(usuario.UsuarioId)
                )
                .map(
                    (x: any) =>
                        Number(x.EmpresaId)
                );

        const plantas =
            plantasResult.recordset
                .filter(
                    (x: any) =>
                        Number(x.UsuarioId) ===
                        Number(usuario.UsuarioId)
                )
                .map(
                    (x: any) =>
                        Number(x.PlantaId)
                );

        return {
            UsuarioId: usuario.UsuarioId,
            Usuario: usuario.Usuario,
            Rol: usuario.Rol,
            Activo: usuario.Activo,
            EmpresaId: usuario.EmpresaId,
            PlantaId: usuario.PlantaId,
            EmpresaIds: empresas,
            PlantaIds: plantas,
            FechaCreacion: usuario.FechaCreacion
        };
    });
}


/**
 * Crear un nuevo usuario ADMIN.
 *
 * El SUPERADMIN será quien invoque esta función.
 *
 * EmpresaId y PlantaId en MNT_Usuario representan
 * la empresa/planta principal.
 *
 * Las selecciones completas se guardan en:
 * - MNT_UsuarioEmpresa
 * - MNT_UsuarioPlanta
 */
export async function crearAdministrador(data: {
    Usuario: string;
    Password: string;
    Activo?: boolean;
    EmpresaIds: number[];
    PlantaIds: number[];
}) {

    const pool = await poolPromise;

    const usuario =
        data.Usuario.trim();

    const password =
        data.Password.trim();

    const empresaIds =
        Array.from(
            new Set(
                (data.EmpresaIds || [])
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        );

    const plantaIds =
        Array.from(
            new Set(
                (data.PlantaIds || [])
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        );


    if (!usuario) {
        throw new Error(
            "El nombre de usuario es obligatorio."
        );
    }

    if (!password) {
        throw new Error(
            "La contraseña es obligatoria."
        );
    }

    if (empresaIds.length === 0) {
        throw new Error(
            "Debes seleccionar al menos una empresa."
        );
    }

    if (plantaIds.length === 0) {
        throw new Error(
            "Debes seleccionar al menos una planta."
        );
    }


    /*
     * Verificar que el usuario no exista.
     */
    const usuarioExistente =
        await pool.request()
            .input(
                "Usuario",
                sql.NVarChar(100),
                usuario
            )
            .query(`
                SELECT TOP 1
                    UsuarioId
                FROM dbo.MNT_Usuario
                WHERE Usuario = @Usuario
            `);


    if (
        usuarioExistente.recordset.length > 0
    ) {
        throw new Error(
            "El nombre de usuario ya está registrado."
        );
    }


    /*
     * Verificar que las empresas existan
     * y estén activas.
     */
    const empresasValidas =
        await pool.request().query(`
            SELECT
                EmpresaId
            FROM dbo.MNT_Empresa
            WHERE Activo = 1
              AND EmpresaId IN (${empresaIds.join(",")})
        `);


    const empresasValidasIds =
        empresasValidas.recordset.map(
            (x: any) =>
                Number(x.EmpresaId)
        );


    if (
        empresasValidasIds.length !==
        empresaIds.length
    ) {
        throw new Error(
            "Una o más empresas seleccionadas no son válidas."
        );
    }


    /*
     * Verificar que las plantas existan
     * y estén activas.
     */
    const plantasValidas =
        await pool.request().query(`
            SELECT
                PlantaId
            FROM dbo.MNT_Planta
            WHERE Activo = 1
              AND PlantaId IN (${plantaIds.join(",")})
        `);


    const plantasValidasIds =
        plantasValidas.recordset.map(
            (x: any) =>
                Number(x.PlantaId)
        );


    if (
        plantasValidasIds.length !==
        plantaIds.length
    ) {
        throw new Error(
            "Una o más plantas seleccionadas no son válidas."
        );
    }


    const passwordHash =
        await bcrypt.hash(
            password,
            10
        );


    /*
     * La primera selección será la
     * empresa/planta principal.
     */
    const empresaPrincipal =
        empresaIds[0];

    const plantaPrincipal =
        plantaIds[0];


    /*
     * Transacción:
     *
     * 1. Crear usuario.
     * 2. Crear relaciones de empresas.
     * 3. Crear relaciones de plantas.
     *
     * Si algo falla, se revierte todo.
     */
    const transaction =
        pool.transaction();

    await transaction.begin();

    try {

        const request =
            transaction.request()
                .input(
                    "Usuario",
                    sql.NVarChar(100),
                    usuario
                )
                .input(
                    "PasswordHash",
                    sql.NVarChar(255),
                    passwordHash
                )
                .input(
                    "Rol",
                    sql.NVarChar(30),
                    "ADMIN"
                )
                .input(
                    "Activo",
                    sql.Bit,
                    data.Activo ?? true
                )
                .input(
                    "EmpresaId",
                    sql.Int,
                    empresaPrincipal
                )
                .input(
                    "PlantaId",
                    sql.Int,
                    plantaPrincipal
                );


        const usuarioResult =
            await request.query(`
                INSERT INTO dbo.MNT_Usuario
                (
                    Usuario,
                    PasswordHash,
                    Rol,
                    Activo,
                    FechaCreacion,
                    EmpresaId,
                    PlantaId
                )
                VALUES
                (
                    @Usuario,
                    @PasswordHash,
                    @Rol,
                    @Activo,
                    GETDATE(),
                    @EmpresaId,
                    @PlantaId
                );

                SELECT
                    SCOPE_IDENTITY() AS UsuarioId;
            `);


        const usuarioId =
            Number(
                usuarioResult.recordset[0]
                    .UsuarioId
            );


        /*
         * Empresas asignadas.
         */
        for (
            const empresaId
            of empresaIds
        ) {

            await transaction
                .request()
                .input(
                    "UsuarioId",
                    sql.Int,
                    usuarioId
                )
                .input(
                    "EmpresaId",
                    sql.Int,
                    empresaId
                )
                .query(`
                    INSERT INTO dbo.MNT_UsuarioEmpresa
                    (
                        UsuarioId,
                        EmpresaId
                    )
                    VALUES
                    (
                        @UsuarioId,
                        @EmpresaId
                    )
                `);
        }


        /*
         * Plantas asignadas.
         */
        for (
            const plantaId
            of plantaIds
        ) {

            await transaction
                .request()
                .input(
                    "UsuarioId",
                    sql.Int,
                    usuarioId
                )
                .input(
                    "PlantaId",
                    sql.Int,
                    plantaId
                )
                .query(`
                    INSERT INTO dbo.MNT_UsuarioPlanta
                    (
                        UsuarioId,
                        PlantaId
                    )
                    VALUES
                    (
                        @UsuarioId,
                        @PlantaId
                    )
                `);
        }


        await transaction.commit();


        return {
            UsuarioId: usuarioId,
            Usuario: usuario,
            Rol: "ADMIN",
            Activo: data.Activo ?? true,
            EmpresaId: empresaPrincipal,
            PlantaId: plantaPrincipal,
            EmpresaIds: empresaIds,
            PlantaIds: plantaIds
        };

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
}


/**
 * Actualizar administrador.
 */
export async function actualizarAdministrador(
    usuarioId: number,
    data: {
        Usuario: string;
        Password?: string | null;
        Activo?: boolean;
        EmpresaIds: number[];
        PlantaIds: number[];
    }
) {

    const pool = await poolPromise;

    const usuario =
        data.Usuario.trim();

    const empresaIds =
        Array.from(
            new Set(
                (data.EmpresaIds || [])
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        );

    const plantaIds =
        Array.from(
            new Set(
                (data.PlantaIds || [])
                    .map(Number)
                    .filter(
                        (id) =>
                            Number.isInteger(id) &&
                            id > 0
                    )
            )
        );


    if (!usuario) {
        throw new Error(
            "El nombre de usuario es obligatorio."
        );
    }

    if (empresaIds.length === 0) {
        throw new Error(
            "Debes seleccionar al menos una empresa."
        );
    }

    if (plantaIds.length === 0) {
        throw new Error(
            "Debes seleccionar al menos una planta."
        );
    }


    /*
     * Verificar que el usuario exista
     * y sea ADMIN.
     */
    const existente =
        await pool.request()
            .input(
                "UsuarioId",
                sql.Int,
                usuarioId
            )
            .query(`
                SELECT
                    UsuarioId,
                    Rol
                FROM dbo.MNT_Usuario
                WHERE UsuarioId = @UsuarioId
            `);


    if (
        existente.recordset.length === 0
    ) {
        throw new Error(
            "El administrador no existe."
        );
    }


    if (
        existente.recordset[0].Rol !== "ADMIN"
    ) {
        throw new Error(
            "Este usuario no es un administrador."
        );
    }


    /*
     * Verificar nombre de usuario.
     */
    const usuarioDuplicado =
        await pool.request()
            .input(
                "Usuario",
                sql.NVarChar(100),
                usuario
            )
            .input(
                "UsuarioId",
                sql.Int,
                usuarioId
            )
            .query(`
                SELECT TOP 1
                    UsuarioId
                FROM dbo.MNT_Usuario
                WHERE Usuario = @Usuario
                  AND UsuarioId <> @UsuarioId
            `);


    if (
        usuarioDuplicado.recordset.length > 0
    ) {
        throw new Error(
            "El nombre de usuario ya está registrado."
        );
    }


    const empresaPrincipal =
        empresaIds[0];

    const plantaPrincipal =
        plantaIds[0];


    const transaction =
        pool.transaction();

    await transaction.begin();

    try {

        const request =
            transaction.request()
                .input(
                    "UsuarioId",
                    sql.Int,
                    usuarioId
                )
                .input(
                    "Usuario",
                    sql.NVarChar(100),
                    usuario
                )
                .input(
                    "Activo",
                    sql.Bit,
                    data.Activo ?? true
                )
                .input(
                    "EmpresaId",
                    sql.Int,
                    empresaPrincipal
                )
                .input(
                    "PlantaId",
                    sql.Int,
                    plantaPrincipal
                );


        /*
         * Si viene una nueva contraseña,
         * actualizar también el hash.
         */
        if (
            data.Password &&
            data.Password.trim() !== ""
        ) {

            const passwordHash =
                await bcrypt.hash(
                    data.Password.trim(),
                    10
                );

            request.input(
                "PasswordHash",
                sql.NVarChar(255),
                passwordHash
            );

            await request.query(`
                UPDATE dbo.MNT_Usuario
                SET
                    Usuario = @Usuario,
                    PasswordHash = @PasswordHash,
                    Activo = @Activo,
                    EmpresaId = @EmpresaId,
                    PlantaId = @PlantaId
                WHERE UsuarioId = @UsuarioId
            `);

        } else {

            await request.query(`
                UPDATE dbo.MNT_Usuario
                SET
                    Usuario = @Usuario,
                    Activo = @Activo,
                    EmpresaId = @EmpresaId,
                    PlantaId = @PlantaId
                WHERE UsuarioId = @UsuarioId
            `);
        }


        /*
         * Eliminar relaciones anteriores.
         */
        await transaction
            .request()
            .input(
                "UsuarioId",
                sql.Int,
                usuarioId
            )
            .query(`
                DELETE FROM dbo.MNT_UsuarioEmpresa
                WHERE UsuarioId = @UsuarioId;

                DELETE FROM dbo.MNT_UsuarioPlanta
                WHERE UsuarioId = @UsuarioId;
            `);


        /*
         * Insertar nuevas empresas.
         */
        for (
            const empresaId
            of empresaIds
        ) {

            await transaction
                .request()
                .input(
                    "UsuarioId",
                    sql.Int,
                    usuarioId
                )
                .input(
                    "EmpresaId",
                    sql.Int,
                    empresaId
                )
                .query(`
                    INSERT INTO dbo.MNT_UsuarioEmpresa
                    (
                        UsuarioId,
                        EmpresaId
                    )
                    VALUES
                    (
                        @UsuarioId,
                        @EmpresaId
                    )
                `);
        }


        /*
         * Insertar nuevas plantas.
         */
        for (
            const plantaId
            of plantaIds
        ) {

            await transaction
                .request()
                .input(
                    "UsuarioId",
                    sql.Int,
                    usuarioId
                )
                .input(
                    "PlantaId",
                    sql.Int,
                    plantaId
                )
                .query(`
                    INSERT INTO dbo.MNT_UsuarioPlanta
                    (
                        UsuarioId,
                        PlantaId
                    )
                    VALUES
                    (
                        @UsuarioId,
                        @PlantaId
                    )
                `);
        }


        await transaction.commit();


        return {
            UsuarioId: usuarioId,
            Usuario: usuario,
            Rol: "ADMIN",
            Activo: data.Activo ?? true,
            EmpresaId: empresaPrincipal,
            PlantaId: plantaPrincipal,
            EmpresaIds: empresaIds,
            PlantaIds: plantaIds
        };

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
}


/**
 * Activar / desactivar administrador.
 */
export async function cambiarEstadoAdministrador(
    usuarioId: number,
    activo: boolean
) {

    const pool = await poolPromise;

    const result =
        await pool.request()
            .input(
                "UsuarioId",
                sql.Int,
                usuarioId
            )
            .input(
                "Activo",
                sql.Bit,
                activo
            )
            .query(`
                UPDATE dbo.MNT_Usuario

                SET
                    Activo = @Activo

                WHERE UsuarioId = @UsuarioId
                  AND Rol = 'ADMIN'
            `);


    if (
        result.rowsAffected[0] === 0
    ) {
        throw new Error(
            "El administrador no existe."
        );
    }


    return {
        UsuarioId: usuarioId,
        Activo: activo
    };
}

