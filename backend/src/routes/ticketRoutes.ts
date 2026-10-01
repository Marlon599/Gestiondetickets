import { Router } from "express";

import {
    getTickets,
    getTicket,
    postTicket,
    putTicket,
    finishTicket
} from "../controllers/ticketController";

import {
    autenticar
} from "../middleware/authMiddleware";

const router = Router();

// =====================================================
// TICKETS
// =====================================================

router.get(
    "/tickets",
    autenticar,
    getTickets
);

router.get(
    "/tickets/:id",
    autenticar,
    getTicket
);

router.post(
    "/tickets",
    autenticar,
    postTicket
);

router.put(
    "/tickets/:id",
    autenticar,
    putTicket
);

router.put(
    "/tickets/:id/finalizar",
    autenticar,
    finishTicket
);

export default router;

