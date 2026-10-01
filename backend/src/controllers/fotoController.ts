import { Request, Response } from "express";

import fs from "fs/promises";
import path from "path";

import {
    obtenerTicketPorId
} from "../services/ticketService";

import {
    registrarFoto,
    obtenerFotosTicket,
    obtenerFotoPorId
} from "../services/fotoService";


// =====================================================
// VALIDAR ACCESO AL TICKET
// =====================================================

async function validarAccesoTicket(
    req: Request,
    ticketId: number
) {

    const usuario = req.usuario;

    if (!usuario) {

        return {
            permitido: false,
            status: 401,
            mensaje:
                "No existe una sesión autenticada."
        };

    }


    // =================================================
    // OBTENER TICKET CON EL CONTEXTO DEL USUARIO
    // =================================================

const ticket =
    await obtenerTicketPorId(
        ticketId,
        usuario
    );


    if (!ticket) {

        return {
            permitido: false,
            status: 404,
            mensaje:
                "El ticket no existe."
        };

    }


    // =================================================
    // ADMIN
    // =================================================

   if (
    usuario.rol === "ADMIN" ||
    usuario.rol === "SUPERADMIN"
) {
    return {
        permitido: true,
        ticket
    };
}


    // =================================================
    // MECÁNICO
    // =================================================

    if (
        usuario.rol === "MECANICO"
    ) {

        if (
            usuario.mecanicoId === null
        ) {

            return {
                permitido: false,
                status: 403,
                mensaje:
                    "La sesión del mecánico no tiene un ID válido."
            };

        }


        if (
            ticket.MecanicoId !==
            usuario.mecanicoId
        ) {

            return {
                permitido: false,
                status: 403,
                mensaje:
                    "No tienes permiso para acceder a las fotografías de este ticket."
            };

        }


        return {
            permitido: true,
            ticket
        };

    }


    return {
        permitido: false,
        status: 403,
        mensaje:
            "El usuario no tiene permisos para acceder a este ticket."
    };

}


// =====================================================
// SUBIR FOTOGRAFÍAS
// =====================================================

export async function postFotos(
    req: Request,
    res: Response
) {

    try {

        const ticketId =
            Number(req.params.id);


        // =================================================
        // VALIDAR ID
        // =================================================

        if (
            !Number.isInteger(ticketId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "El ID del ticket no es válido."

            });

        }


        // =================================================
        // VALIDAR ACCESO
        // =================================================

        const acceso =
            await validarAccesoTicket(
                req,
                ticketId
            );


        if (!acceso.permitido) {

            return res.status(
                acceso.status || 403
            ).json({

                success: false,

                message:
                    acceso.mensaje ||
                    "No tienes permiso para acceder a este ticket."

            });

        }


        const ticket =
            acceso.ticket;


        // =================================================
        // TIPO DE EVIDENCIA
        // =================================================

        const tipoEvidencia =
            String(
                req.body.tipoEvidencia || ""
            ).toUpperCase();


        if (
            tipoEvidencia !== "ANTES" &&
            tipoEvidencia !== "DESPUES"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "El tipo de evidencia debe ser ANTES o DESPUES."

            });

        }


        // =================================================
        // ARCHIVOS
        // =================================================

        const files =
            req.files as Express.Multer.File[];


        if (
            !files ||
            files.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No se recibió ninguna imagen."

            });

        }


        // =================================================
        // CARPETA DEL TICKET
        // =================================================

        const carpetaTicket =
            path.join(
                process.cwd(),
                "uploads",
                "mantenimiento",
                ticket.NumeroTicket
            );


        await fs.mkdir(
            carpetaTicket,
            {
                recursive: true
            }
        );


        // =================================================
        // GUARDAR FOTOS
        // =================================================

        const fotosGuardadas = [];


        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            const file =
                files[i];


            const extension =
                path
                    .extname(
                        file.originalname
                    )
                    .toLowerCase();


            const fecha =
                new Date()
                    .toISOString()
                    .replace(
                        /[-:.TZ]/g,
                        ""
                    );


            const nombreArchivo =
                `${tipoEvidencia.toLowerCase()}_${fecha}_${i + 1}${extension}`;


            const rutaFisica =
                path.join(
                    carpetaTicket,
                    nombreArchivo
                );


            // ---------------------------------------------
            // GUARDAR ARCHIVO FÍSICO
            // ---------------------------------------------

            await fs.writeFile(
                rutaFisica,
                file.buffer
            );


            const rutaArchivo =
                `/uploads/mantenimiento/${ticket.NumeroTicket}/${nombreArchivo}`;


            // ---------------------------------------------
            // REGISTRAR EN BD
            // ---------------------------------------------

            const registro =
                await registrarFoto(
                    ticketId,
                    nombreArchivo,
                    rutaArchivo,
                    tipoEvidencia as
                        "ANTES" |
                        "DESPUES"
                );


            fotosGuardadas.push({

                FotoId:
                    registro.FotoId,

                NombreArchivo:
                    nombreArchivo,

                RutaArchivo:
                    rutaArchivo,

                TipoEvidencia:
                    tipoEvidencia

            });

        }


        // =================================================
        // RESPUESTA
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Fotografías guardadas correctamente.",

            data:
                fotosGuardadas

        });


    } catch (error) {

        console.error(
            "Error guardando fotografías:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible guardar las fotografías."

        });

    }

}


// =====================================================
// OBTENER FOTOGRAFÍAS
// =====================================================

export async function getFotos(
    req: Request,
    res: Response
) {

    try {

        const ticketId =
            Number(req.params.id);


        // =================================================
        // VALIDAR ID
        // =================================================

        if (
            !Number.isInteger(ticketId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "El ID del ticket no es válido."

            });

        }


        // =================================================
        // VALIDAR ACCESO
        // =================================================

        const acceso =
            await validarAccesoTicket(
                req,
                ticketId
            );


        if (!acceso.permitido) {

            return res.status(
                acceso.status || 403
            ).json({

                success: false,

                message:
                    acceso.mensaje ||
                    "No tienes permiso para acceder a este ticket."

            });

        }


        // =================================================
        // OBTENER FOTOS
        // =================================================

        const fotos =
            await obtenerFotosTicket(
                ticketId
            );


        return res.json({

            success: true,

            data:
                fotos

        });


    } catch (error) {

        console.error(
            "Error obteniendo fotografías:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible obtener las fotografías."

        });

    }

}


// =====================================================
// MOSTRAR UNA FOTOGRAFÍA
// =====================================================

export async function mostrarFoto(
    req: Request,
    res: Response
) {

    try {

        const ticketId =
            Number(req.params.id);


        const fotoId =
            Number(req.params.fotoId);


        // =================================================
        // VALIDAR IDS
        // =================================================

        if (
            !Number.isInteger(ticketId) ||
            !Number.isInteger(fotoId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "El ID del ticket o de la fotografía no es válido."

            });

        }


        // =================================================
        // VALIDAR ACCESO AL TICKET
        // =================================================

        const acceso =
            await validarAccesoTicket(
                req,
                ticketId
            );


        if (!acceso.permitido) {

            return res.status(
                acceso.status || 403
            ).json({

                success: false,

                message:
                    acceso.mensaje ||
                    "No tienes permiso para acceder a este ticket."

            });

        }


        // =================================================
        // BUSCAR LA FOTOGRAFÍA
        // =================================================

        const foto =
            await obtenerFotoPorId(
                fotoId,
                ticketId
            );


        if (!foto) {

            return res.status(404).json({

                success: false,

                message:
                    "La fotografía no existe."

            });

        }


        // =================================================
        // RUTA FÍSICA
        // =================================================

        const rutaFisica =
            path.join(
                process.cwd(),
                foto.RutaArchivo.replace(
                    /^\/uploads\//,
                    "uploads/"
                )
            );


        // =================================================
        // VERIFICAR QUE EL ARCHIVO EXISTE
        // =================================================

        try {

            await fs.access(
                rutaFisica
            );

        } catch {

            return res.status(404).json({

                success: false,

                message:
                    "El archivo de la fotografía no existe en el servidor."

            });

        }


        // =================================================
        // ENVIAR IMAGEN
        // =================================================

        return res.sendFile(
            path.resolve(rutaFisica)
        );


    } catch (error) {

        console.error(
            "Error mostrando fotografía:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible mostrar la fotografía."

        });

    }

}

