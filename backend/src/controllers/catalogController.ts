import { Request, Response } from "express";

import {
obtenerMecanicos,
    obtenerMaquinas,
    obtenerMaquinasPorMecanico,
    obtenerTiposMantenimiento,
    obtenerTiposTrabajo,
    obtenerPrioridades,
    obtenerEstados,

    obtenerMecanicosAdmin,
    crearMecanico,
    actualizarMecanico,
    cambiarEstadoMecanico,

    obtenerMaquinasAdmin,
    crearMaquina,
    actualizarMaquina,
    cambiarEstadoMaquina,

    obtenerHistorialMaquina,
    obtenerEmpresasAdmin,
    obtenerPlantasAdmin,
    validarEmpresaPlanta,

    obtenerAdministradores,
    crearAdministrador,
    actualizarAdministrador,
    cambiarEstadoAdministrador
} from "../services/catalogService";


/* =========================================================
   VALIDAR CONTEXTO
   ========================================================= */

function validarContexto(
    req: Request,
    res: Response
) {

    if (!req.usuario) {

        res.status(401).json({
            success: false,
            message:
                "No autenticado."
        });

        return false;
    }

    /*
     * SUPERADMIN
     *
     * Tiene acceso global.
     * No necesita EmpresaId ni PlantaId.
     */

    if (
        req.usuario.rol === "SUPERADMIN" ||
        req.usuario.accesoGlobal === true
    ) {

        return true;

    }


    /*
     * ADMIN / MECANICO
     *
     * Sí necesitan Empresa + Planta.
     */

    if (
        req.usuario.empresaId === null ||
        req.usuario.plantaId === null
    ) {

        res.status(403).json({
            success: false,
            message:
                "El usuario no tiene una empresa y planta asignadas."
        });

        return false;

    }


    return true;
}


/* =========================================================
   RESOLVER EMPRESA / PLANTA PARA OPERACIONES ADMIN
   ========================================================= */

async function resolverEmpresaPlanta(
    req: Request,
    empresaIdBody?: unknown,
    plantaIdBody?: unknown
) {

    if (!req.usuario) {
        throw new Error("No autenticado.");
    }

    const esGlobal =
        req.usuario.rol === "SUPERADMIN" ||
        req.usuario.accesoGlobal === true;

    const empresaId = esGlobal
        ? Number(empresaIdBody)
        : Number(req.usuario.empresaId);

    const plantaId = esGlobal
        ? Number(plantaIdBody)
        : Number(req.usuario.plantaId);

    if (!Number.isInteger(empresaId) || !Number.isInteger(plantaId)) {
        throw new Error(
            "Debe seleccionar una empresa y una planta válidas."
        );
    }

    const existe = await validarEmpresaPlanta(
        empresaId,
        plantaId
    );

    if (!existe) {
        throw new Error(
            "La planta seleccionada no pertenece a la empresa seleccionada o está inactiva."
        );
    }

    return {
        empresaId,
        plantaId
    };
}


/* =========================================================
   CATÁLOGOS
   ========================================================= */

export async function getMecanicos(
    req: Request,
    res: Response
) {

    try {

        if (!validarContexto(req, res)) {
            return;
        }


        /*
         * SUPERADMIN
         *
         * Puede visualizar todos los mecánicos.
         */

        if (
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true
        ) {

            const data =
                await obtenerMecanicosAdmin(
                    null,
                    null
                );

            return res.json({

                success: true,

                data

            });

        }


        /*
         * ADMIN / MECANICO
         *
         * Solo su Empresa + Planta.
         */

        const data =
            await obtenerMecanicos(
                req.usuario!.empresaId!,
                req.usuario!.plantaId!
            );


        return res.json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "Error obteniendo mecánicos:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "No fue posible obtener los mecánicos."

        });

    }

}


export async function getMaquinas(
    req: Request,
    res: Response
) {

    try {

        if (!validarContexto(req, res)) {
            return;
        }


        /*
         * SUPERADMIN
         *
         * Puede visualizar todas las máquinas.
         */

        if (
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true
        ) {

            const data =
                await obtenerMaquinasAdmin(
                    null,
                    null
                );

            return res.json({

                success: true,

                data

            });

        }


        /*
         * ADMIN / MECANICO
         *
         * Solo su Empresa + Planta.
         */

const data =
    req.usuario!.tipo === "MECANICO" &&
    req.usuario!.mecanicoId != null
        ? await obtenerMaquinasPorMecanico(
            req.usuario!.mecanicoId
        )
        : await obtenerMaquinas(
            req.usuario!.empresaId!,
            req.usuario!.plantaId!
        );


        return res.json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "Error obteniendo máquinas:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "No fue posible obtener las máquinas."

        });

    }

}


/* =========================================================
   OTROS CATÁLOGOS
   ========================================================= */

export async function getTiposMantenimiento(
    req: Request,
    res: Response
) {

    try {

        const data =
            await obtenerTiposMantenimiento();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo tipos de mantenimiento:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener los tipos de mantenimiento."
        });
    }
}


export async function getTiposTrabajo(
    req: Request,
    res: Response
) {

    try {

        const data =
            await obtenerTiposTrabajo();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo tipos de trabajo:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener los tipos de trabajo."
        });
    }
}


export async function getPrioridades(
    req: Request,
    res: Response
) {

    try {

        const data =
            await obtenerPrioridades();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo prioridades:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener las prioridades."
        });
    }
}


export async function getEstados(
    req: Request,
    res: Response
) {

    try {

        const data =
            await obtenerEstados();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo estados:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener los estados."
        });
    }
}


/* =========================================================
   ADMIN - MECÁNICOS
   ========================================================= */

export async function getMecanicosAdmin(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const data = await obtenerMecanicosAdmin(
            global ? null : req.usuario!.empresaId!,
            global ? null : req.usuario!.plantaId!
        );

        return res.json({ success: true, data });
    } catch (error) {
        console.error("Error obteniendo mecánicos para administración:", error);
        return res.status(500).json({
            success: false,
            message: "No fue posible obtener los mecánicos."
        });
    }
}


export async function postMecanico(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const {
            Nombre,
            Apellido,
            Usuario,
            Password,
            Activo,
            EmpresaIds,
            PlantaIds,
            EmpresaId,
            PlantaId
        } = req.body;

        if (!Nombre || !Usuario || !Password) {
            return res.status(400).json({
                success: false,
                message: "Nombre, usuario y contraseña son obligatorios."
            });
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const empresasSolicitadas = Array.isArray(EmpresaIds)
            ? EmpresaIds
            : EmpresaId != null
                ? [EmpresaId]
                : [];

        const plantasSolicitadas = Array.isArray(PlantaIds)
            ? PlantaIds
            : PlantaId != null
                ? [PlantaId]
                : [];

        const empresaIds = global
            ? empresasSolicitadas.map(Number).filter(Number.isInteger)
            : [Number(req.usuario!.empresaId)];

        const plantaIds = global
            ? plantasSolicitadas.map(Number).filter(Number.isInteger)
            : [Number(req.usuario!.plantaId)];

        if (empresaIds.length === 0 || plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debe seleccionar al menos una empresa y una planta."
            });
        }

        const mecanico = await crearMecanico({
            Nombre: String(Nombre).trim(),
            Apellido: Apellido ? String(Apellido).trim() : null,
            Usuario: String(Usuario).trim(),
            Password: String(Password),
            Activo: Activo !== false,
            EmpresaIds: empresaIds,
            PlantaIds: plantaIds
        });

        return res.status(201).json({
            success: true,
            message: "Mecánico creado correctamente.",
            data: mecanico
        });
    } catch (error) {
        console.error("Error al crear mecánico:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "No fue posible crear el mecánico."
        });
    }
}

export async function putMecanico(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const mecanicoId = Number(req.params.id);

        if (!Number.isInteger(mecanicoId)) {
            return res.status(400).json({
                success: false,
                message: "ID de mecánico inválido."
            });
        }

        const {
            Nombre,
            Apellido,
            Usuario,
            Password,
            Activo,
            EmpresaIds,
            PlantaIds,
            EmpresaId,
            PlantaId
        } = req.body;

        if (!Nombre || !Usuario) {
            return res.status(400).json({
                success: false,
                message: "Nombre y usuario son obligatorios."
            });
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        let empresaId = req.usuario!.empresaId!;
        let plantaId = req.usuario!.plantaId!;

        if (global) {
            const todos = await obtenerMecanicosAdmin(null, null);
            const existente = todos.find(
                item => Number(item.MecanicoId) === mecanicoId
            );

            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: "Mecánico no encontrado."
                });
            }

            empresaId = Number(existente.EmpresaId);
            plantaId = Number(existente.PlantaId);
        }

        const empresasSolicitadas = Array.isArray(EmpresaIds)
            ? EmpresaIds
            : EmpresaId != null
                ? [EmpresaId]
                : [empresaId];

        const plantasSolicitadas = Array.isArray(PlantaIds)
            ? PlantaIds
            : PlantaId != null
                ? [PlantaId]
                : [plantaId];

        const empresaIds = global
            ? empresasSolicitadas.map(Number).filter(Number.isInteger)
            : [empresaId];

        const plantaIds = global
            ? plantasSolicitadas.map(Number).filter(Number.isInteger)
            : [plantaId];

        if (empresaIds.length === 0 || plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debe seleccionar al menos una empresa y una planta."
            });
        }

        const data = await actualizarMecanico(
            mecanicoId,
            {
                Nombre: String(Nombre).trim(),
                Apellido: Apellido ? String(Apellido).trim() : null,
                Usuario: String(Usuario).trim(),
                Password,
                Activo,
                EmpresaIds: empresaIds,
                PlantaIds: plantaIds
            },
            empresaId,
            plantaId
        );

        return res.json({
            success: true,
            message: "Mecánico actualizado correctamente.",
            data
        });
    } catch (error) {
        console.error("Error actualizando mecánico:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "No fue posible actualizar el mecánico."
        });
    }
}

export async function patchEstadoMecanico(
    req: Request,
    res: Response
) {

    try {

        if (!validarContexto(req, res)) {
            return;
        }

        const mecanicoId =
            Number(req.params.id);

        if (!Number.isInteger(mecanicoId)) {

            return res.status(400).json({
                success: false,
                message:
                    "ID de mecánico inválido."
            });
        }

        const activo =
            Boolean(req.body.Activo);

        let empresaId = req.usuario!.empresaId!;
        let plantaId = req.usuario!.plantaId!;

        if (
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true
        ) {
            const todos = await obtenerMecanicosAdmin(null, null);
            const existente = todos.find(
                item => Number(item.MecanicoId) === mecanicoId
            );

            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: "Mecánico no encontrado."
                });
            }

            empresaId = Number(existente.EmpresaId);
            plantaId = Number(existente.PlantaId);
        }

        const data =
            await cambiarEstadoMecanico(
                mecanicoId,
                activo,
                empresaId,
                plantaId
            );

        return res.json({
            success: true,
            message: activo
                ? "Mecánico activado correctamente."
                : "Mecánico desactivado correctamente.",
            data
        });

    } catch (error) {

        console.error(
            "Error cambiando estado del mecánico:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible cambiar el estado del mecánico."
        });
    }
}


/* =========================================================
   ADMIN - MÁQUINAS
   ========================================================= */

export async function getMaquinasAdmin(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const data = await obtenerMaquinasAdmin(
            global ? null : req.usuario!.empresaId!,
            global ? null : req.usuario!.plantaId!
        );

        return res.json({ success: true, data });
    } catch (error) {
        console.error("Error obteniendo máquinas para administración:", error);
        return res.status(500).json({
            success: false,
            message: "No fue posible obtener las máquinas."
        });
    }
}


export async function postMaquina(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const {
            Codigo,
            Nombre,
            Ubicacion,
            Descripcion,
            Activo,
            EmpresaIds,
            PlantaIds,
            EmpresaId,
            PlantaId
        } = req.body;

        if (!Codigo || !Nombre) {
            return res.status(400).json({
                success: false,
                message: "Código y nombre son obligatorios."
            });
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const empresasSolicitadas = Array.isArray(EmpresaIds)
            ? EmpresaIds
            : EmpresaId != null
                ? [EmpresaId]
                : [];

        const plantasSolicitadas = Array.isArray(PlantaIds)
            ? PlantaIds
            : PlantaId != null
                ? [PlantaId]
                : [];

        const empresaIds = global
            ? empresasSolicitadas.map(Number).filter(Number.isInteger)
            : [Number(req.usuario!.empresaId)];

        const plantaIds = global
            ? plantasSolicitadas.map(Number).filter(Number.isInteger)
            : [Number(req.usuario!.plantaId)];

        if (empresaIds.length === 0 || plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debe seleccionar al menos una empresa y una planta."
            });
        }

        const data = await crearMaquina({
            Codigo: String(Codigo).trim(),
            Nombre: String(Nombre).trim(),
            Ubicacion: Ubicacion ? String(Ubicacion).trim() : null,
            Descripcion: Descripcion ? String(Descripcion).trim() : null,
            Activo: Activo !== false,
            EmpresaIds: empresaIds,
            PlantaIds: plantaIds
        });

        return res.status(201).json({
            success: true,
            message: "Máquina creada correctamente.",
            data
        });
    } catch (error) {
        console.error("Error creando máquina:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "No fue posible crear la máquina."
        });
    }
}

export async function putMaquina(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) return;

        const maquinaId = Number(req.params.id);

        if (!Number.isInteger(maquinaId)) {
            return res.status(400).json({
                success: false,
                message: "ID de máquina inválido."
            });
        }

        const {
            Codigo,
            Nombre,
            Ubicacion,
            Descripcion,
            Activo,
            EmpresaIds,
            PlantaIds,
            EmpresaId,
            PlantaId
        } = req.body;

        if (!Codigo || !Nombre) {
            return res.status(400).json({
                success: false,
                message: "Código y nombre son obligatorios."
            });
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        let empresaId = req.usuario!.empresaId!;
        let plantaId = req.usuario!.plantaId!;

        if (global) {
            const todos = await obtenerMaquinasAdmin(null, null);
            const existente = todos.find(
                item => Number(item.MaquinaId) === maquinaId
            );

            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: "Máquina no encontrada."
                });
            }

            empresaId = Number(existente.EmpresaId);
            plantaId = Number(existente.PlantaId);
        }

        const empresasSolicitadas = Array.isArray(EmpresaIds)
            ? EmpresaIds
            : EmpresaId != null
                ? [EmpresaId]
                : [empresaId];

        const plantasSolicitadas = Array.isArray(PlantaIds)
            ? PlantaIds
            : PlantaId != null
                ? [PlantaId]
                : [plantaId];

        const empresaIds = global
            ? empresasSolicitadas.map(Number).filter(Number.isInteger)
            : [empresaId];

        const plantaIds = global
            ? plantasSolicitadas.map(Number).filter(Number.isInteger)
            : [plantaId];

        if (empresaIds.length === 0 || plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Debe seleccionar al menos una empresa y una planta."
            });
        }

        const data = await actualizarMaquina(
            maquinaId,
            {
                Codigo: String(Codigo).trim(),
                Nombre: String(Nombre).trim(),
                Ubicacion: Ubicacion ? String(Ubicacion).trim() : null,
                Descripcion: Descripcion ? String(Descripcion).trim() : null,
                Activo,
                EmpresaIds: empresaIds,
                PlantaIds: plantaIds
            },
            empresaId,
            plantaId
        );

        return res.json({
            success: true,
            message: "Máquina actualizada correctamente.",
            data
        });
    } catch (error) {
        console.error("Error actualizando máquina:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "No fue posible actualizar la máquina."
        });
    }
}

export async function patchEstadoMaquina(
    req: Request,
    res: Response
) {

    try {

        if (!validarContexto(req, res)) {
            return;
        }

        const maquinaId =
            Number(req.params.id);

        if (!Number.isInteger(maquinaId)) {

            return res.status(400).json({
                success: false,
                message:
                    "ID de máquina inválido."
            });
        }

        const activo =
            Boolean(req.body.Activo);

        let empresaId = req.usuario!.empresaId!;
        let plantaId = req.usuario!.plantaId!;

        if (
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true
        ) {
            const todos = await obtenerMaquinasAdmin(null, null);
            const existente = todos.find(
                item => Number(item.MaquinaId) === maquinaId
            );

            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: "Máquina no encontrada."
                });
            }

            empresaId = Number(existente.EmpresaId);
            plantaId = Number(existente.PlantaId);
        }

        const data =
            await cambiarEstadoMaquina(
                maquinaId,
                activo,
                empresaId,
                plantaId
            );

        return res.json({
            success: true,
            message: activo
                ? "Máquina activada correctamente."
                : "Máquina desactivada correctamente.",
            data
        });

    } catch (error) {

        console.error(
            "Error cambiando estado de máquina:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible cambiar el estado de la máquina."
        });
    }
}


/* =========================================================
   HISTORIAL DE MÁQUINA
   ========================================================= */

export async function getHistorialMaquina(
    req: Request,
    res: Response
) {

    try {

        if (!validarContexto(req, res)) {
            return;
        }

        const maquinaId =
            Number(req.params.id);

        if (!Number.isInteger(maquinaId)) {

            return res.status(400).json({
                success: false,
                message:
                    "ID de máquina inválido."
            });
        }

        let empresaId = req.usuario!.empresaId!;
        let plantaId = req.usuario!.plantaId!;

        if (
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true
        ) {
            const todos = await obtenerMaquinasAdmin(null, null);
            const existente = todos.find(
                item => Number(item.MaquinaId) === maquinaId
            );

            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: "Máquina no encontrada."
                });
            }

            empresaId = Number(existente.EmpresaId);
            plantaId = Number(existente.PlantaId);
        }

        const data =
            await obtenerHistorialMaquina(
                maquinaId,
                empresaId,
                plantaId
            );

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo historial de máquina:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener el historial de máquina."
        });
    }
}

/* =========================================================
   EMPRESAS Y PLANTAS PARA ADMINISTRACIÓN
   ========================================================= */

export async function getEmpresasAdmin(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) {
            return;
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const data = await obtenerEmpresasAdmin(
            global
                ? null
                : req.usuario!.usuarioId
        );

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo empresas:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener las empresas."
        });
    }
}

export async function getPlantasAdmin(
    req: Request,
    res: Response
) {
    try {
        if (!validarContexto(req, res)) {
            return;
        }

        const global =
            req.usuario!.rol === "SUPERADMIN" ||
            req.usuario!.accesoGlobal === true;

        const data = await obtenerPlantasAdmin(
            global
                ? null
                : req.usuario!.usuarioId
        );

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo plantas:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener las plantas."
        });
    }
}
/* =========================================================
   ADMINISTRADORES
   SOLO SUPERADMIN
   ========================================================= */

/**
 * Obtener todos los administradores.
 *
 * SOLO SUPERADMIN.
 */
export async function getAdministradores(
    req: Request,
    res: Response
) {
    try {

        if (!validarContexto(req, res)) {
            return;
        }

        /*
         * Esta sección es exclusivamente
         * para SUPERADMIN.
         */
        if (req.usuario!.rol !== "SUPERADMIN") {
            return res.status(403).json({
                success: false,
                message:
                    "Solo el SUPERADMIN puede administrar usuarios administradores."
            });
        }


        const data =
            await obtenerAdministradores();


        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo administradores:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "No fue posible obtener los administradores."
        });
    }
}


/**
 * Crear administrador.
 *
 * SOLO SUPERADMIN.
 */
export async function postAdministrador(
    req: Request,
    res: Response
) {
    try {

        if (!validarContexto(req, res)) {
            return;
        }


        /*
         * SOLO SUPERADMIN
         */
        if (req.usuario!.rol !== "SUPERADMIN") {
            return res.status(403).json({
                success: false,
                message:
                    "Solo el SUPERADMIN puede crear administradores."
            });
        }


        const {
            Usuario,
            Password,
            Activo,
            EmpresaIds,
            PlantaIds
        } = req.body;


        /*
         * Validaciones básicas.
         */
        if (
            !Usuario ||
            !Password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Usuario y contraseña son obligatorios."
            });
        }


        const empresaIds =
            Array.isArray(EmpresaIds)
                ? EmpresaIds
                : [];


        const plantaIds =
            Array.isArray(PlantaIds)
                ? PlantaIds
                : [];


        if (empresaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe seleccionar al menos una empresa."
            });
        }


        if (plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe seleccionar al menos una planta."
            });
        }


        const administrador =
            await crearAdministrador({
                Usuario:
                    String(Usuario).trim(),

                Password:
                    String(Password),

                Activo:
                    Activo !== false,

                EmpresaIds:
                    empresaIds
                        .map(Number)
                        .filter(Number.isInteger),

                PlantaIds:
                    plantaIds
                        .map(Number)
                        .filter(Number.isInteger)
            });


        return res.status(201).json({
            success: true,
            message:
                "Administrador creado correctamente.",
            data: administrador
        });

    } catch (error) {

        console.error(
            "Error creando administrador:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el administrador."
        });
    }
}


/**
 * Actualizar administrador.
 *
 * SOLO SUPERADMIN.
 */
export async function putAdministrador(
    req: Request,
    res: Response
) {
    try {

        if (!validarContexto(req, res)) {
            return;
        }


        /*
         * SOLO SUPERADMIN
         */
        if (req.usuario!.rol !== "SUPERADMIN") {
            return res.status(403).json({
                success: false,
                message:
                    "Solo el SUPERADMIN puede editar administradores."
            });
        }


        const usuarioId =
            Number(req.params.id);


        if (!Number.isInteger(usuarioId)) {
            return res.status(400).json({
                success: false,
                message:
                    "ID de administrador inválido."
            });
        }


        const {
            Usuario,
            Password,
            Activo,
            EmpresaIds,
            PlantaIds
        } = req.body;


        if (!Usuario) {
            return res.status(400).json({
                success: false,
                message:
                    "El usuario es obligatorio."
            });
        }


        const empresaIds =
            Array.isArray(EmpresaIds)
                ? EmpresaIds
                    .map(Number)
                    .filter(Number.isInteger)
                : [];


        const plantaIds =
            Array.isArray(PlantaIds)
                ? PlantaIds
                    .map(Number)
                    .filter(Number.isInteger)
                : [];


        if (empresaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe seleccionar al menos una empresa."
            });
        }


        if (plantaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Debe seleccionar al menos una planta."
            });
        }


        const administrador =
            await actualizarAdministrador(
                usuarioId,
                {
                    Usuario:
                        String(Usuario).trim(),

                    Password:
                        Password != null
                            ? String(Password)
                            : null,

                    Activo:
                        Activo !== false,

                    EmpresaIds:
                        empresaIds,

                    PlantaIds:
                        plantaIds
                }
            );


        return res.json({
            success: true,
            message:
                "Administrador actualizado correctamente.",
            data: administrador
        });

    } catch (error) {

        console.error(
            "Error actualizando administrador:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible actualizar el administrador."
        });
    }
}


/**
 * Activar / desactivar administrador.
 *
 * SOLO SUPERADMIN.
 */
export async function patchEstadoAdministrador(
    req: Request,
    res: Response
) {
    try {

        if (!validarContexto(req, res)) {
            return;
        }


        /*
         * SOLO SUPERADMIN
         */
        if (req.usuario!.rol !== "SUPERADMIN") {
            return res.status(403).json({
                success: false,
                message:
                    "Solo el SUPERADMIN puede cambiar el estado de administradores."
            });
        }


        const usuarioId =
            Number(req.params.id);


        if (!Number.isInteger(usuarioId)) {
            return res.status(400).json({
                success: false,
                message:
                    "ID de administrador inválido."
            });
        }


        const activo =
            Boolean(req.body.Activo);


        const data =
            await cambiarEstadoAdministrador(
                usuarioId,
                activo
            );


        return res.json({
            success: true,
            message:
                activo
                    ? "Administrador activado correctamente."
                    : "Administrador desactivado correctamente.",
            data
        });

    } catch (error) {

        console.error(
            "Error cambiando estado del administrador:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible cambiar el estado del administrador."
        });
    }
}