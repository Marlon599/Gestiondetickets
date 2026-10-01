import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { poolPromise, sql } from "../config/database";

// =====================================================
// CONFIGURACIÓN JWT
// =====================================================

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "CLAVE_TEMPORAL_CAMBIAR_EN_PRODUCCION";

// =====================================================
// TIPOS
// =====================================================

interface AccesoUsuario {

    EmpresaId: number;

    PlantaId: number;

    Empresa?: string;

    NombreEmpresa?: string;

    Planta?: string;

    NombrePlanta?: string;

}

// =====================================================
// LOGIN
// =====================================================

export async function loginUsuario(
    usuario: string,
    password: string
) {

    const pool = await poolPromise;

    // =================================================
    // 1. BUSCAR ADMINISTRADOR
    // =================================================

    const adminResult =
        await pool.request()
            .input(
                "Usuario",
                sql.NVarChar(100),
                usuario
            )
            .query(`
                SELECT
                    U.UsuarioId,
                    U.Usuario,
                    U.PasswordHash,
                    U.Rol,
                    U.Activo,
                    U.EmpresaId,
                    U.PlantaId,

                    E.Codigo AS Empresa,
                    E.Nombre AS NombreEmpresa,

                    P.Codigo AS Planta,
                    P.Nombre AS NombrePlanta

                FROM dbo.MNT_Usuario U

                LEFT JOIN dbo.MNT_Empresa E
                    ON E.EmpresaId = U.EmpresaId

                LEFT JOIN dbo.MNT_Planta P
                    ON P.PlantaId = U.PlantaId

                WHERE U.Usuario = @Usuario
            `);

    if (adminResult.recordset.length > 0) {

        const admin =
            adminResult.recordset[0];

        console.log(
            "========== ADMIN LOGIN =========="
        );

        console.log(
            "Usuario:",
            admin.Usuario
        );

        console.log(
            "Rol:",
            admin.Rol
        );

        console.log(
            "EmpresaId:",
            admin.EmpresaId
        );

        console.log(
            "PlantaId:",
            admin.PlantaId
        );

        console.log(
            "Empresa:",
            admin.Empresa
        );

        console.log(
            "Planta:",
            admin.Planta
        );

        console.log(
            "================================="
        );

        // =============================================
        // USUARIO ACTIVO
        // =============================================

        if (!admin.Activo) {

            throw new Error(
                "El usuario está desactivado."
            );

        }

        // =============================================
        // VALIDAR PASSWORD
        // =============================================

        const passwordCorrecta =
            await bcrypt.compare(
                password,
                admin.PasswordHash
            );

        if (!passwordCorrecta) {

            throw new Error(
                "Usuario o contraseña incorrectos."
            );

        }

        // =============================================
        // NORMALIZAR ROL
        // =============================================

        const rol =
            admin.Rol === "SUPERADMIN"
                ? "SUPERADMIN"
                : "ADMIN";

        // =============================================
        // DETERMINAR ACCESO GLOBAL
        // =============================================

        const accesoGlobal =
            rol === "SUPERADMIN";

        // =============================================
        // CREAR ACCESOS
        // =============================================

        const accesos: AccesoUsuario[] = [];

        /*
         * Si el usuario tiene Empresa y Planta
         * asignadas directamente, las usamos como
         * acceso.
         */

        if (
            admin.EmpresaId != null &&
            admin.PlantaId != null
        ) {

            accesos.push({

                EmpresaId:
                    Number(admin.EmpresaId),

                PlantaId:
                    Number(admin.PlantaId),

                Empresa:
                    admin.Empresa ?? undefined,

                NombreEmpresa:
                    admin.NombreEmpresa ?? undefined,

                Planta:
                    admin.Planta ?? undefined,

                NombrePlanta:
                    admin.NombrePlanta ?? undefined

            });

        }

        console.log(
            "Acceso global:",
            accesoGlobal
        );

        console.log(
            "Accesos:",
            accesos
        );

        // =============================================
        // TOKEN
        // =============================================

        const token =
            jwt.sign(

                {

                    tipo: "ADMIN",

                    usuarioId:
                        admin.UsuarioId,

                    mecanicoId:
                        null,

                    usuario:
                        admin.Usuario,

                    rol,

                    empresaId:
                        admin.EmpresaId != null
                            ? Number(admin.EmpresaId)
                            : null,

                    plantaId:
                        admin.PlantaId != null
                            ? Number(admin.PlantaId)
                            : null,

                    accesoGlobal,

                    accesos

                },

                JWT_SECRET,

                {
                    expiresIn: "8h"
                }

            );

        // =============================================
        // RESPUESTA
        // =============================================

        return {

            tipo: "ADMIN",

            usuarioId:
                admin.UsuarioId,

            mecanicoId:
                null,

            usuario:
                admin.Usuario,

            rol,

            empresaId:
                admin.EmpresaId != null
                    ? Number(admin.EmpresaId)
                    : null,

            plantaId:
                admin.PlantaId != null
                    ? Number(admin.PlantaId)
                    : null,

            accesoGlobal,

            accesos,

            empresa:
                admin.Empresa ?? null,

            nombreEmpresa:
                admin.NombreEmpresa ?? null,

            planta:
                admin.Planta ?? null,

            nombrePlanta:
                admin.NombrePlanta ?? null,

            token

        };

    }

    // =================================================
    // 2. BUSCAR MECÁNICO
    // =================================================

    const mecanicoResult =
        await pool.request()
            .input(
                "Usuario",
                sql.NVarChar(100),
                usuario
            )
            .query(`
                SELECT

                    M.MecanicoId,
                    M.Codigo,
                    M.Nombre,
                    M.Apellido,
                    M.Usuario,
                    M.PasswordHash,
                    M.Activo,

                    M.EmpresaId,
                    M.PlantaId,

                    E.Codigo AS Empresa,
                    E.Nombre AS NombreEmpresa,

                    P.Codigo AS Planta,
                    P.Nombre AS NombrePlanta

                FROM dbo.MNT_Mecanico M

                LEFT JOIN dbo.MNT_Empresa E
                    ON E.EmpresaId = M.EmpresaId

                LEFT JOIN dbo.MNT_Planta P
                    ON P.PlantaId = M.PlantaId

                WHERE M.Usuario = @Usuario
            `);

    if (mecanicoResult.recordset.length > 0) {

        const mecanico =
            mecanicoResult.recordset[0];

        // =============================================
        // ACTIVO
        // =============================================

        if (!mecanico.Activo) {

            throw new Error(
                "El usuario está desactivado."
            );

        }

        // =============================================
        // PASSWORD
        // =============================================

        const passwordCorrecta =
            await bcrypt.compare(
                password,
                mecanico.PasswordHash
            );

        if (!passwordCorrecta) {

            throw new Error(
                "Usuario o contraseña incorrectos."
            );

        }

        // =============================================
        // NOMBRE
        // =============================================

        const nombreCompleto =
            `${mecanico.Nombre} ${mecanico.Apellido ?? ""}`
                .trim();

        // =============================================
        // ACCESOS
        // =============================================

        const accesos: AccesoUsuario[] = [];

        if (
            mecanico.EmpresaId != null &&
            mecanico.PlantaId != null
        ) {

            accesos.push({

                EmpresaId:
                    Number(mecanico.EmpresaId),

                PlantaId:
                    Number(mecanico.PlantaId),

                Empresa:
                    mecanico.Empresa ?? undefined,

                NombreEmpresa:
                    mecanico.NombreEmpresa ?? undefined,

                Planta:
                    mecanico.Planta ?? undefined,

                NombrePlanta:
                    mecanico.NombrePlanta ?? undefined

            });

        }

        // =============================================
        // TOKEN
        // =============================================

        const token =
            jwt.sign(

                {

                    tipo: "MECANICO",

                    usuarioId:
                        null,

                    mecanicoId:
                        mecanico.MecanicoId,

                    usuario:
                        mecanico.Usuario,

                    nombre:
                        nombreCompleto,

                    rol:
                        "MECANICO",

                    empresaId:
                        mecanico.EmpresaId != null
                            ? Number(mecanico.EmpresaId)
                            : null,

                    plantaId:
                        mecanico.PlantaId != null
                            ? Number(mecanico.PlantaId)
                            : null,

                    accesoGlobal:
                        false,

                    accesos

                },

                JWT_SECRET,

                {
                    expiresIn: "8h"
                }

            );

        return {

            tipo: "MECANICO",

            usuarioId:
                null,

            mecanicoId:
                mecanico.MecanicoId,

            usuario:
                mecanico.Usuario,

            nombre:
                nombreCompleto,

            rol:
                "MECANICO",

            empresaId:
                mecanico.EmpresaId != null
                    ? Number(mecanico.EmpresaId)
                    : null,

            plantaId:
                mecanico.PlantaId != null
                    ? Number(mecanico.PlantaId)
                    : null,

            accesoGlobal:
                false,

            accesos,

            empresa:
                mecanico.Empresa ?? null,

            nombreEmpresa:
                mecanico.NombreEmpresa ?? null,

            planta:
                mecanico.Planta ?? null,

            nombrePlanta:
                mecanico.NombrePlanta ?? null,

            token

        };

    }

    // =================================================
    // 3. USUARIO NO EXISTE
    // =================================================

    throw new Error(
        "Usuario o contraseña incorrectos."
    );

}