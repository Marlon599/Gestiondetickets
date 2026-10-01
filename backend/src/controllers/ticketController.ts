import { Request, Response } from "express";

import {
    obtenerTickets,
    obtenerTicketPorId,
    crearTicket,
    actualizarTicket,
    finalizarTicket
} from "../services/ticketService";

// =====================================================
// OBTENER TICKETS
// =====================================================

export async function getTickets(
    req: Request,
    res: Response
) {
    try {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }

const tickets = await obtenerTickets(
    req.usuario.mecanicoId ?? undefined,
    req.usuario
);

        return res.json({
            success: true,
            data: tickets
        });

    } catch (error: any) {

        console.error(
            "Error obteniendo tickets:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Error obteniendo tickets."
        });

    }
}

// =====================================================
// OBTENER TICKET
// =====================================================

export async function getTicket(
    req: Request,
    res: Response
) {
    try {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }

        const ticketId =
            Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de ticket inválido."
            });
        }

        const ticket =
            await obtenerTicketPorId(
                ticketId,
                req.usuario
            );

        return res.json({
            success: true,
            data: ticket
        });

    } catch (error: any) {

        console.error(
            "Error obteniendo ticket:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Error obteniendo ticket."
        });

    }
}

// =====================================================
// CREAR TICKET
// =====================================================

export async function postTicket(
    req: Request,
    res: Response
) {
    try {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }

        const ticket =
            await crearTicket(
                req.body,
                req.usuario
            );

        return res.status(201).json({
            success: true,
            data: ticket
        });

    } catch (error: any) {

        console.error(
            "Error creando ticket:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Error creando ticket."
        });

    }
}

// =====================================================
// ACTUALIZAR TICKET
// =====================================================

export async function putTicket(
    req: Request,
    res: Response
) {
    try {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }

        const ticketId =
            Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de ticket inválido."
            });
        }

        // =================================================
        // OBTENER ÚNICAMENTE EL TEXTO
        // =================================================

        const trabajoRealizado =
            typeof req.body?.trabajoRealizado === "string"
                ? req.body.trabajoRealizado
                : "";

        // =================================================
        // VALIDAR QUE EXISTA INFORMACIÓN
        // =================================================

        if (!trabajoRealizado.trim()) {
            return res.status(400).json({
                success: false,
                message: "El trabajo realizado es obligatorio."
            });
        }

        // =================================================
        // ACTUALIZAR
        // =================================================

        const ticket =
            await actualizarTicket(
                ticketId,
                trabajoRealizado,
                req.usuario
            );

        return res.json({
            success: true,
            data: ticket
        });

    } catch (error: any) {

        console.error(
            "Error actualizando ticket:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Error actualizando ticket."
        });

    }
}

// =====================================================
// FINALIZAR TICKET
// =====================================================

export async function finishTicket(
    req: Request,
    res: Response
) {
    try {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }

        const ticketId =
            Number(req.params.id);

        if (!Number.isInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de ticket inválido."
            });
        }

        const ticket =
            await finalizarTicket(
                ticketId,
                req.usuario
            );

        return res.json({
            success: true,
            data: ticket
        });

    } catch (error: any) {

        console.error(
            "Error finalizando ticket:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Error finalizando ticket."
        });

    }
}