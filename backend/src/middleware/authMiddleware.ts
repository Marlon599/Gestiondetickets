import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "CLAVE_TEMPORAL_CAMBIAR_EN_PRODUCCION";

// =====================================================
// ACCESO EMPRESA / PLANTA
// =====================================================

export interface AccesoUsuario {

    EmpresaId: number;

    PlantaId: number;

    Empresa?: string;

    NombreEmpresa?: string;

    Planta?: string;

    NombrePlanta?: string;

}

// =====================================================
// TIPO DE USUARIO AUTENTICADO
// =====================================================

export interface UsuarioAutenticado {

    tipo:
        | "ADMIN"
        | "MECANICO";

    usuarioId:
        number | null;

    mecanicoId:
        number | null;

    usuario:
        string;

    nombre?:
        string;

    rol:
        | "ADMIN"
        | "SUPERADMIN"
        | "MECANICO";

    empresaId:
        number | null;

    plantaId:
        number | null;

    accesoGlobal?:
        boolean;

    accesos?:
        AccesoUsuario[];

}

// =====================================================
// EXTENDER REQUEST DE EXPRESS
// =====================================================

declare global {

    namespace Express {

        interface Request {

            usuario?:
                UsuarioAutenticado;

        }

    }

}

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

export function autenticar(
    req: Request,
    res: Response,
    next: NextFunction
) {

    try {

        const authorization =
            req.headers.authorization;

        // =================================================
        // SIN TOKEN
        // =================================================

        if (!authorization) {

            return res.status(401).json({

                success: false,

                message:
                    "No se proporcionó el token de autenticación."

            });

        }

        // =================================================
        // FORMATO INCORRECTO
        // =================================================

        if (
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Formato de token inválido."

            });

        }

        // =================================================
        // OBTENER TOKEN
        // =================================================

        const token =
            authorization.substring(7).trim();

        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "El token está vacío."

            });

        }

        // =================================================
        // VALIDAR JWT
        // =================================================

        const payload =
            jwt.verify(
                token,
                JWT_SECRET
            ) as UsuarioAutenticado;

        // =================================================
        // NORMALIZAR ACCESOS
        // =================================================

        const accesos: AccesoUsuario[] =
            Array.isArray(payload.accesos)
                ? payload.accesos
                    .filter(
                        (acceso: any) =>
                            acceso &&
                            Number.isInteger(
                                Number(acceso.EmpresaId)
                            ) &&
                            Number.isInteger(
                                Number(acceso.PlantaId)
                            )
                    )
                    .map(
                        (acceso: any) => ({

                            EmpresaId:
                                Number(
                                    acceso.EmpresaId
                                ),

                            PlantaId:
                                Number(
                                    acceso.PlantaId
                                ),

                            Empresa:
                                acceso.Empresa ??
                                undefined,

                            NombreEmpresa:
                                acceso.NombreEmpresa ??
                                undefined,

                            Planta:
                                acceso.Planta ??
                                undefined,

                            NombrePlanta:
                                acceso.NombrePlanta ??
                                undefined

                        })
                    )
                : [];

        // =================================================
        // DETERMINAR ACCESO GLOBAL
        // =================================================

        const accesoGlobal =
            payload.accesoGlobal === true ||
            payload.rol === "SUPERADMIN";

        // =================================================
        // CREAR USUARIO AUTENTICADO
        // =================================================

        req.usuario = {

            tipo:
                payload.tipo,

            usuarioId:
                payload.usuarioId ?? null,

            mecanicoId:
                payload.mecanicoId ?? null,

            usuario:
                payload.usuario,

            nombre:
                payload.nombre,

            rol:
                payload.rol,

            empresaId:
                payload.empresaId ?? null,

            plantaId:
                payload.plantaId ?? null,

            accesoGlobal,

            accesos

        };

        // =================================================
        // DEBUG
        // =================================================

        console.log(
            "========== USUARIO AUTENTICADO =========="
        );

        console.log(
            "Usuario:",
            req.usuario.usuario
        );

        console.log(
            "Tipo:",
            req.usuario.tipo
        );

        console.log(
            "Rol:",
            req.usuario.rol
        );

        console.log(
            "Acceso global:",
            req.usuario.accesoGlobal
        );

        console.log(
            "EmpresaId:",
            req.usuario.empresaId
        );

        console.log(
            "PlantaId:",
            req.usuario.plantaId
        );

        console.log(
            "Accesos:",
            JSON.stringify(
                req.usuario.accesos,
                null,
                2
            )
        );

        console.log(
            "========================================="
        );

        // =================================================
        // CONTINUAR
        // =================================================

        next();

    } catch (error) {

        console.error(
            "Error autenticando usuario:",
            error
        );

        return res.status(401).json({

            success: false,

            message:
                "Sesión inválida o expirada."

        });

    }

}