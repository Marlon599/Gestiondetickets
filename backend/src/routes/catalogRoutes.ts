import { Router } from "express";

import {
    getMecanicos,
    getMaquinas,
    getTiposMantenimiento,
    getTiposTrabajo,
    getPrioridades,
    getEstados,

    getMecanicosAdmin,
    postMecanico,
    putMecanico,
    patchEstadoMecanico,

    getMaquinasAdmin,
    postMaquina,
    putMaquina,
    patchEstadoMaquina,
    getHistorialMaquina,

    getEmpresasAdmin,
    getPlantasAdmin,

    getAdministradores,
    postAdministrador,
    putAdministrador,
    patchEstadoAdministrador
} from "../controllers/catalogController";

import { autenticar } from "../middleware/authMiddleware";

const router = Router();

/* =========================================================
   CATÁLOGOS UTILIZADOS POR LOS TICKETS
   ========================================================= */

router.get(
    "/mecanicos",
    autenticar,
    getMecanicos
);

router.get(
    "/maquinas",
    autenticar,
    getMaquinas
);

router.get(
    "/tipos-mantenimiento",
    autenticar,
    getTiposMantenimiento
);

router.get(
    "/tipos-trabajo",
    autenticar,
    getTiposTrabajo
);

router.get(
    "/prioridades",
    autenticar,
    getPrioridades
);

router.get(
    "/estados",
    autenticar,
    getEstados
);


/* =========================================================
   EMPRESAS Y PLANTAS
   ========================================================= */

router.get(
    "/admin/empresas",
    autenticar,
    soloAdmin,
    getEmpresasAdmin
);

router.get(
    "/admin/plantas",
    autenticar,
    soloAdmin,
    getPlantasAdmin
);


/* =========================================================
   ADMINISTRACIÓN DE MECÁNICOS
   ========================================================= */

router.get(
    "/admin/mecanicos",
    autenticar,
    soloAdmin,
    getMecanicosAdmin
);

router.post(
    "/admin/mecanicos",
    autenticar,
    soloAdmin,
    postMecanico
);

router.put(
    "/admin/mecanicos/:id",
    autenticar,
    soloAdmin,
    putMecanico
);

router.patch(
    "/admin/mecanicos/:id/estado",
    autenticar,
    soloAdmin,
    patchEstadoMecanico
);


/* =========================================================
   ADMINISTRACIÓN DE MÁQUINAS
   ========================================================= */

router.get(
    "/admin/maquinas",
    autenticar,
    soloAdmin,
    getMaquinasAdmin
);

router.post(
    "/admin/maquinas",
    autenticar,
    soloAdmin,
    postMaquina
);

router.put(
    "/admin/maquinas/:id",
    autenticar,
    soloAdmin,
    putMaquina
);

router.patch(
    "/admin/maquinas/:id/estado",
    autenticar,
    soloAdmin,
    patchEstadoMaquina
);


/* =========================================================
   ADMINISTRADORES
   SOLO ADMIN / SUPERADMIN
   ========================================================= */

router.get(
    "/admin/administradores",
    autenticar,
    soloAdmin,
    getAdministradores
);

router.post(
    "/admin/administradores",
    autenticar,
    soloAdmin,
    postAdministrador
);

router.put(
    "/admin/administradores/:id",
    autenticar,
    soloAdmin,
    putAdministrador
);

router.patch(
    "/admin/administradores/:id/estado",
    autenticar,
    soloAdmin,
    patchEstadoAdministrador
);


/* =========================================================
   HISTORIAL DE MÁQUINA
   ========================================================= */

router.get(
    "/maquinas/:id/historial",
    autenticar,
    getHistorialMaquina
);


export default router;


/* =========================================================
   MIDDLEWARE SOLO ADMIN / SUPERADMIN
   ========================================================= */

function soloAdmin(
    req: any,
    res: any,
    next: any
) {
    if (!req.usuario) {
        return res.status(401).json({
            success: false,
            message: "No autenticado."
        });
    }

    if (
        req.usuario.rol !== "ADMIN" &&
        req.usuario.rol !== "SUPERADMIN"
    ) {
        return res.status(403).json({
            success: false,
            message:
                "Acceso permitido únicamente a administradores."
        });
    }

    next();
}