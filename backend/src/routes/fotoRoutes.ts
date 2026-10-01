import { Router } from "express";

import {
    postFotos,
    getFotos,
    mostrarFoto
} from "../controllers/fotoController";

import {
    uploadFotos
} from "../middleware/uploadFotos";

import {
    autenticar
} from "../middleware/authMiddleware";


const router = Router();


// =====================================================
// SUBIR FOTOGRAFÍAS
// =====================================================

router.post(
    "/tickets/:id/fotos",
    autenticar,
    uploadFotos.array("fotos", 10),
    postFotos
);


// =====================================================
// LISTAR FOTOGRAFÍAS
// =====================================================

router.get(
    "/tickets/:id/fotos",
    autenticar,
    getFotos
);


// =====================================================
// MOSTRAR UNA FOTOGRAFÍA
// =====================================================

router.get(
    "/tickets/:id/fotos/:fotoId/archivo",
    autenticar,
    mostrarFoto
);


export default router;