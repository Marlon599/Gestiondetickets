import { poolPromise, sql } from "../config/database";


/* =========================================================
   TIPOS
   ========================================================= */

export interface Alcance
{
    EmpresaId: number;
    PlantaId: number;
}


/* =========================================================
   ALCANCES DE ADMINISTRADOR
   ========================================================= */

export async function obtenerAlcancesUsuario(
    usuarioId: number
): Promise<Alcance[]>
{
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            "UsuarioId",
            sql.Int,
            usuarioId
        )
        .query(`
            SELECT
                EmpresaId,
                PlantaId
            FROM dbo.MNT_UsuarioAlcance
            WHERE UsuarioId = @UsuarioId
              AND Activo = 1
            ORDER BY
                EmpresaId,
                PlantaId
        `);

    return result.recordset;
}


/* =========================================================
   ALCANCES DE MECÁNICO
   ========================================================= */

export async function obtenerAlcancesMecanico(
    mecanicoId: number
): Promise<Alcance[]>
{
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            "MecanicoId",
            sql.Int,
            mecanicoId
        )
        .query(`
            SELECT
                EmpresaId,
                PlantaId
            FROM dbo.MNT_MecanicoAlcance
            WHERE MecanicoId = @MecanicoId
              AND Activo = 1
            ORDER BY
                EmpresaId,
                PlantaId
        `);

    return result.recordset;
}


/* =========================================================
   VALIDAR SI ADMIN TIENE ACCESO A UNA COMBINACIÓN
   ========================================================= */

export async function adminTieneAlcance(
    usuarioId: number,
    empresaId: number,
    plantaId: number
): Promise<boolean>
{
    const pool = await poolPromise;

    const result = await pool.request()
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
        .input(
            "PlantaId",
            sql.Int,
            plantaId
        )
        .query(`
            SELECT 1 AS TieneAcceso
            FROM dbo.MNT_UsuarioAlcance
            WHERE UsuarioId = @UsuarioId
              AND EmpresaId = @EmpresaId
              AND PlantaId = @PlantaId
              AND Activo = 1
        `);

    return result.recordset.length > 0;
}


/* =========================================================
   VALIDAR MÚLTIPLES ALCANCES DE ADMIN
   ========================================================= */

export async function validarAlcancesUsuario(
    usuarioId: number,
    alcances: Alcance[]
): Promise<boolean>
{
    if (!alcances.length)
    {
        return false;
    }

    for (const alcance of alcances)
    {
        const permitido =
            await adminTieneAlcance(
                usuarioId,
                alcance.EmpresaId,
                alcance.PlantaId
            );

        if (!permitido)
        {
            return false;
        }
    }

    return true;
}


/* =========================================================
   VALIDAR QUE EMPRESA/PLANTA EXISTAN
   ========================================================= */

export async function validarEmpresaPlanta(
    empresaId: number,
    plantaId: number
): Promise<boolean>
{
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
            SELECT 1 AS Existe
            FROM dbo.MNT_Planta P
            INNER JOIN dbo.MNT_Empresa E
                ON E.EmpresaId = P.EmpresaId
            WHERE P.PlantaId = @PlantaId
              AND E.EmpresaId = @EmpresaId
              AND P.Activo = 1
              AND E.Activo = 1
        `);

    return result.recordset.length > 0;
}