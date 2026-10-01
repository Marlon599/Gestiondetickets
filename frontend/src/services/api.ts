const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3010/api/v1/mnt";


// =====================================================
// RESPUESTA API
// =====================================================

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}


// =====================================================
// SESIÓN
// =====================================================

export interface UsuarioSesion {
    tipo: "ADMIN" | "MECANICO";
    usuarioId: number | null;
    mecanicoId: number | null;
    usuario: string;
    nombre?: string;
    rol: "ADMIN" | "SUPERADMIN" | "MECANICO";
    accesoGlobal?: boolean;
    accesos?: {
        empresaId: number;
        plantaId: number;
        empresa?: string;
        nombreEmpresa?: string;
        planta?: string;
        nombrePlanta?: string;
    }[];
    empresaId?: number | null;
    plantaId?: number | null;
    empresa?: string | null;
    nombreEmpresa?: string | null;
    planta?: string | null;
    nombrePlanta?: string | null;
    token: string;
}


// =====================================================
// TICKET
// =====================================================

export interface Ticket {

    TicketId: number;

    NumeroTicket: string;


    // -----------------------------------------------
    // MECÁNICO
    // -----------------------------------------------

MecanicoId: number;
Mecanico: string;


    // -----------------------------------------------
    // MÁQUINA
    // -----------------------------------------------

    MaquinaId: number;

    Maquina?: string | null;

    CodigoMaquina?: string | null;

    MaquinaNombre?: string | null;


    // -----------------------------------------------
    // TIPO MANTENIMIENTO
    // -----------------------------------------------

    TipoMantenimientoId: number;

    TipoMantenimiento?: string | null;

    TipoMantenimientoNombre?: string | null;


    // -----------------------------------------------
    // TIPO TRABAJO
    // -----------------------------------------------

    TipoTrabajoId?: number | null;

    TipoTrabajo?: string | null;

    TipoTrabajoNombre?: string | null;

    TipoTrabajoPersonalizado?: string | null;


    // -----------------------------------------------
    // PRIORIDAD
    // -----------------------------------------------

    PrioridadId: number;

    Prioridad: string;

    PrioridadNombre?: string;


    // -----------------------------------------------
    // ESTADO
    // -----------------------------------------------

    EstadoId: number;

    Estado: string;

    EstadoNombre?: string;


    // -----------------------------------------------
    // FECHAS
    // -----------------------------------------------

    FechaReporte: string;

    FechaInicio?: string | null;

    FechaFin?: string | null;


    // -----------------------------------------------
    // HORAS
    // -----------------------------------------------

    HoraInicio: string | null;

    HoraFin?: string | null;


    // -----------------------------------------------
    // INFORMACIÓN DEL TICKET
    // -----------------------------------------------

    Problema?: string | null;

    Incidencia?: string | null;

    TrabajoRealizado?: string | null;

    Observaciones?: string | null;


    // -----------------------------------------------
    // AUDITORÍA
    // -----------------------------------------------

    FechaCreacion?: string;

    FechaActualizacion?: string;
}


// =====================================================
// MECÁNICO
// =====================================================

export interface Mecanico {

    MecanicoId: number;

    Codigo: string;

    Nombre: string;

    Apellido: string;

    Telefono?: string | null;

    Especialidad?: string | null;

    Usuario?: string | null;

    Activo?: boolean;
}


// =====================================================
// EMPRESA / PLANTA
// =====================================================

export interface EmpresaCatalogo {
    EmpresaId: number;
    Codigo: string;
    Nombre: string;
    Activo: boolean;
}

export interface PlantaCatalogo {
    PlantaId: number;
    EmpresaId: number;
    Codigo: string;
    Nombre: string;
    Activo: boolean;
}


// =====================================================
// MECÁNICO ADMIN
// =====================================================

export interface MecanicoAdmin {
    MecanicoId: number;
    Codigo: string;
    Nombre: string;
    Apellido?: string | null;
    Telefono?: string | null;
    Correo?: string | null;
    Usuario: string;
    Activo: boolean;
    FechaCreacion: string;

    EmpresaId?: number | null;
    PlantaId?: number | null;

    EmpresaIds?: number[];
    PlantaIds?: number[];
}


// =====================================================
// MÁQUINA
// =====================================================

export interface Maquina {

    MaquinaId: number;

    Codigo: string;

    Nombre: string;

    Descripcion?: string | null;

    Ubicacion?: string | null;

    Activo?: boolean;
}


// =====================================================
// MÁQUINA ADMIN
// =====================================================

export interface MaquinaAdmin {
    MaquinaId: number;
    Codigo: string;
    Nombre: string;
    Marca?: string | null;
    Modelo?: string | null;
    Serie?: string | null;
    Ubicacion?: string | null;
    Descripcion?: string | null;
    Activo: boolean;
    FechaCreacion: string;

    EmpresaId?: number | null;
    PlantaId?: number | null;

    EmpresaIds?: number[];
    PlantaIds?: number[];
}

export interface AdministradorAdmin {
    UsuarioId: number;
    Usuario: string;
    Rol: string;
    Activo: boolean;
    EmpresaId?: number | null;
    PlantaId?: number | null;
    EmpresaIds: number[];
    PlantaIds: number[];
    FechaCreacion?: string;
}


// =====================================================
// TIPO MANTENIMIENTO
// =====================================================

export interface TipoMantenimiento {

    TipoMantenimientoId: number;

    Nombre: string;

    Descripcion?: string | null;

    Activo?: boolean;
}


// =====================================================
// TIPO TRABAJO
// =====================================================

export interface TipoTrabajo {

    TipoTrabajoId: number;

    Nombre: string;

    Descripcion?: string | null;

    Activo?: boolean;
}


// =====================================================
// PRIORIDAD
// =====================================================

export interface Prioridad {

    PrioridadId: number;

    Nombre: string;

    Descripcion?: string | null;

    Nivel?: number;

    Activo?: boolean;
}


// =====================================================
// ESTADO
// =====================================================

export interface EstadoTicket {

    EstadoId: number;

    Nombre: string;

    Descripcion?: string | null;

    Activo?: boolean;
}


// =====================================================
// FOTOGRAFÍA
// =====================================================

export interface FotoTicket {

    FotoId: number;

    TicketId: number;

    NombreArchivo: string;

    RutaArchivo: string;

    TipoFoto?: string | null;

    Observacion?: string | null;

    FechaCreacion: string;

    TipoEvidencia: "ANTES" | "DESPUES";
}


// =====================================================
// CREAR TICKET
// =====================================================

export interface CrearTicketData {

    mecanicoId?: number;

    maquinaId: number;

    tipoMantenimientoId: number;

    tipoTrabajoId?: number;

    tipoTrabajoPersonalizado?: string;

    prioridadId: number;

    problema?: string;

    observaciones?: string;
}


// =====================================================
// SESIÓN LOCAL
// =====================================================

function obtenerSesion(): UsuarioSesion | null {

    const sesionGuardada =
        localStorage.getItem("mnt_sesion");


    if (!sesionGuardada) {
        return null;
    }


    try {

        return JSON.parse(
            sesionGuardada
        ) as UsuarioSesion;

    } catch {

        return null;

    }
}


// =====================================================
// TOKEN
// =====================================================

function obtenerToken(): string | null {

    const sesion =
        obtenerSesion();


    return sesion?.token || null;
}


// =====================================================
// HEADERS
// =====================================================

function obtenerHeaders(
    incluirJson: boolean = true
): HeadersInit {

    const headers: Record<string, string> = {};


    if (incluirJson) {

        headers["Content-Type"] =
            "application/json";

    }


    const token =
        obtenerToken();


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    return headers;
}


// =====================================================
// PROCESAR RESPUESTA
// =====================================================

async function procesarRespuesta<T>(
    response: Response
): Promise<ApiResponse<T>> {

    let result: ApiResponse<T>;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            `El servidor respondió con código ${response.status}.`
        );

    }


    // -----------------------------------------------
    // NO AUTORIZADO
    // -----------------------------------------------

    if (response.status === 401) {

        localStorage.removeItem(
            "mnt_sesion"
        );


        throw new Error(
            "La sesión expiró o no es válida. Inicia sesión nuevamente."
        );

    }


    // -----------------------------------------------
    // PROHIBIDO
    // -----------------------------------------------

    if (response.status === 403) {

        throw new Error(
            result.message ||
            "No tienes permisos para realizar esta operación."
        );

    }


    // -----------------------------------------------
    // OTROS ERRORES
    // -----------------------------------------------

    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "No fue posible completar la operación."
        );

    }


    return result;
}


// =====================================================
// LOGIN
// =====================================================

export async function iniciarSesion(
    usuario: string,
    password: string
): Promise<UsuarioSesion> {

    const response =
        await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    usuario,
                    password
                })
            }
        );


    const result =
        await procesarRespuesta<UsuarioSesion>(
            response
        );


    return result.data;
}


// =====================================================
// TICKETS
// =====================================================

export async function obtenerTickets(): Promise<Ticket[]> {

    const response =
        await fetch(
            `${API_URL}/tickets`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Ticket[]>(
            response
        );


    return result.data;
}


export async function obtenerTicket(
    id: number
): Promise<Ticket> {

    const response =
        await fetch(
            `${API_URL}/tickets/${id}`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Ticket>(
            response
        );


    return result.data;
}


export async function crearTicket(
    data: CrearTicketData
): Promise<Ticket> {

    const response =
        await fetch(
            `${API_URL}/tickets`,
            {
                method: "POST",

                headers:
                    obtenerHeaders(true),

                body:
                    JSON.stringify(data)
            }
        );


    const result =
        await procesarRespuesta<Ticket>(
            response
        );


    return result.data;
}


export async function actualizarTicket(
    id: number,
    data: {
        trabajoRealizado: string;
    }
): Promise<Ticket> {

    const response =
        await fetch(
            `${API_URL}/tickets/${id}`,
            {
                method: "PUT",

                headers:
                    obtenerHeaders(true),

                body:
                    JSON.stringify(data)
            }
        );


    const result =
        await procesarRespuesta<Ticket>(
            response
        );


    return result.data;
}


export async function finalizarTicket(
    id: number
): Promise<Ticket> {

    const response =
        await fetch(
            `${API_URL}/tickets/${id}/finalizar`,
            {
                method: "PUT",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Ticket>(
            response
        );


    return result.data;
}


// =====================================================
// MECÁNICOS - CATÁLOGO
// =====================================================

export async function obtenerMecanicos(): Promise<Mecanico[]> {

    const response =
        await fetch(
            `${API_URL}/mecanicos`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Mecanico[]>(
            response
        );


    return result.data;
}


// =====================================================
// MÁQUINAS - CATÁLOGO
// =====================================================

export async function obtenerMaquinas(): Promise<Maquina[]> {

    const response =
        await fetch(
            `${API_URL}/maquinas`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Maquina[]>(
            response
        );


    return result.data;
}


// =====================================================
// TIPOS DE MANTENIMIENTO
// =====================================================

export async function obtenerTiposMantenimiento(): Promise<TipoMantenimiento[]> {

    const response =
        await fetch(
            `${API_URL}/tipos-mantenimiento`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<TipoMantenimiento[]>(
            response
        );


    return result.data;
}


// =====================================================
// TIPOS DE TRABAJO
// =====================================================

export async function obtenerTiposTrabajo(): Promise<TipoTrabajo[]> {

    const response =
        await fetch(
            `${API_URL}/tipos-trabajo`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<TipoTrabajo[]>(
            response
        );


    return result.data;
}


// =====================================================
// PRIORIDADES
// =====================================================

export async function obtenerPrioridades(): Promise<Prioridad[]> {

    const response =
        await fetch(
            `${API_URL}/prioridades`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<Prioridad[]>(
            response
        );


    return result.data;
}


// =====================================================
// ESTADOS
// =====================================================

export async function obtenerEstados(): Promise<EstadoTicket[]> {

    const response =
        await fetch(
            `${API_URL}/estados`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<EstadoTicket[]>(
            response
        );


    return result.data;
}


// =====================================================
// FOTOS DEL TICKET
// =====================================================

export async function obtenerFotosTicket(
    ticketId: number
): Promise<FotoTicket[]> {

    const response =
        await fetch(
            `${API_URL}/tickets/${ticketId}/fotos`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<FotoTicket[]>(
            response
        );


    return result.data;
}


// =====================================================
// SUBIR FOTOS
// =====================================================

export async function subirFotosTicket(
    ticketId: number,
    archivos: File[],
    tipoEvidencia:
        | "ANTES"
        | "DESPUES"
): Promise<FotoTicket[]> {

    const formData =
        new FormData();


    formData.append(
        "tipoEvidencia",
        tipoEvidencia
    );


    for (
        const archivo
        of archivos
    ) {

        formData.append(
            "fotos",
            archivo
        );

    }


    const token =
        obtenerToken();


    const headers:
        Record<string, string> = {};


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${API_URL}/tickets/${ticketId}/fotos`,
            {
                method: "POST",

                headers,

                body: formData
            }
        );


    const result =
        await procesarRespuesta<FotoTicket[]>(
            response
        );


    return result.data;
}


// =====================================================
// FOTO PROTEGIDA
// =====================================================

export async function obtenerArchivoFotoTicket(
    ticketId: number,
    fotoId: number
): Promise<string> {

    const token =
        obtenerToken();


    if (!token) {

        throw new Error(
            "No hay una sesión válida para visualizar la fotografía."
        );

    }


    const response =
        await fetch(
            `${API_URL}/tickets/${ticketId}/fotos/${fotoId}/archivo`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


    if (
        response.status === 401
    ) {

        localStorage.removeItem(
            "mnt_sesion"
        );


        throw new Error(
            "La sesión expiró o no es válida. Inicia sesión nuevamente."
        );

    }


    if (
        response.status === 403
    ) {

        throw new Error(
            "No tienes permiso para visualizar esta fotografía."
        );

    }


    if (!response.ok) {

        throw new Error(
            `No fue posible cargar la fotografía. Código HTTP: ${response.status}`
        );

    }


    const blob =
        await response.blob();


    return URL.createObjectURL(
        blob
    );
}


// =====================================================
// LIBERAR URL TEMPORAL DE FOTO
// =====================================================

export function liberarArchivoFoto(
    url: string
): void {

    URL.revokeObjectURL(
        url
    );
}


// =====================================================
// ADMIN - EMPRESAS / PLANTAS
// =====================================================

export async function obtenerEmpresasAdmin(): Promise<EmpresaCatalogo[]> {
    const response = await fetch(
        `${API_URL}/admin/empresas`,
        {
            method: "GET",
            headers: obtenerHeaders(false)
        }
    );

    const result = await procesarRespuesta<EmpresaCatalogo[]>(response);
    return result.data;
}

export async function obtenerPlantasAdmin(
    empresaId?: number
): Promise<PlantaCatalogo[]> {
    const query = empresaId != null
        ? `?empresaId=${empresaId}`
        : "";

    const response = await fetch(
        `${API_URL}/admin/plantas${query}`,
        {
            method: "GET",
            headers: obtenerHeaders(false)
        }
    );

    const result = await procesarRespuesta<PlantaCatalogo[]>(response);
    return result.data;
}


// =====================================================
// ADMIN - MECÁNICOS
// =====================================================

export async function obtenerMecanicosAdmin(): Promise<MecanicoAdmin[]> {

    const response =
        await fetch(
            `${API_URL}/admin/mecanicos`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<MecanicoAdmin[]>(
            response
        );


    return result.data;
}


export async function crearMecanicoAdmin(
    data: {
        Codigo: string;
        Nombre: string;
        Apellido?: string;
        Telefono?: string;
        Correo?: string;
        Usuario: string;
        Password: string;
        Activo?: boolean;

        EmpresaIds?: number[];
        PlantaIds?: number[];
    }
): Promise<MecanicoAdmin> {

    const response = await fetch(
        `${API_URL}/admin/mecanicos`,
        {
            method: "POST",
            headers: obtenerHeaders(true),
            body: JSON.stringify(data)
        }
    );

    const result =
        await procesarRespuesta<MecanicoAdmin>(response);

    return result.data;
}


export async function actualizarMecanicoAdmin(
    mecanicoId: number,
    data: {
        Codigo: string;
        Nombre: string;
        Apellido?: string;
        Telefono?: string;
        Correo?: string;
        Usuario: string;
        Password?: string;
        Activo?: boolean;

        EmpresaIds?: number[];
        PlantaIds?: number[];
    }
): Promise<MecanicoAdmin> {

    const response = await fetch(
        `${API_URL}/admin/mecanicos/${mecanicoId}`,
        {
            method: "PUT",
            headers: obtenerHeaders(true),
            body: JSON.stringify(data)
        }
    );

    const result =
        await procesarRespuesta<MecanicoAdmin>(response);

    return result.data;
}


export async function cambiarEstadoMecanicoAdmin(
    mecanicoId: number,
    activo: boolean
) {

    const response =
        await fetch(
            `${API_URL}/admin/mecanicos/${mecanicoId}/estado`,
            {
                method: "PATCH",

                headers:
                    obtenerHeaders(true),

                body:
                    JSON.stringify({
                        Activo: activo
                    })
            }
        );


    const result =
        await procesarRespuesta<{
            MecanicoId: number;
            Activo: boolean;
        }>(
            response
        );


    return result.data;
}


// =====================================================
// ADMIN - MÁQUINAS
// =====================================================

export async function obtenerMaquinasAdmin(): Promise<MaquinaAdmin[]> {

    const response =
        await fetch(
            `${API_URL}/admin/maquinas`,
            {
                method: "GET",

                headers:
                    obtenerHeaders(false)
            }
        );


    const result =
        await procesarRespuesta<MaquinaAdmin[]>(
            response
        );


    return result.data;
}


export async function crearMaquinaAdmin(
    data: {
        Codigo: string;
        Nombre: string;
        Marca?: string;
        Modelo?: string;
        Serie?: string;
        Ubicacion?: string;
        Descripcion?: string;
        Activo?: boolean;

        EmpresaIds?: number[];
        PlantaIds?: number[];
    }
): Promise<MaquinaAdmin> {

    const response = await fetch(
        `${API_URL}/admin/maquinas`,
        {
            method: "POST",
            headers: obtenerHeaders(true),
            body: JSON.stringify(data)
        }
    );

    const result =
        await procesarRespuesta<MaquinaAdmin>(response);

    return result.data;
}


export async function actualizarMaquinaAdmin(
    maquinaId: number,
    data: {
        Codigo: string;
        Nombre: string;
        Marca?: string;
        Modelo?: string;
        Serie?: string;
        Ubicacion?: string;
        Descripcion?: string;
        Activo?: boolean;

        EmpresaIds?: number[];
        PlantaIds?: number[];
    }
): Promise<MaquinaAdmin> {

    const response = await fetch(
        `${API_URL}/admin/maquinas/${maquinaId}`,
        {
            method: "PUT",
            headers: obtenerHeaders(true),
            body: JSON.stringify(data)
        }
    );

    const result =
        await procesarRespuesta<MaquinaAdmin>(response);

    return result.data;
}


export async function cambiarEstadoMaquinaAdmin(
    maquinaId: number,
    activo: boolean
) {

    const response =
        await fetch(
            `${API_URL}/admin/maquinas/${maquinaId}/estado`,
            {
                method: "PATCH",

                headers:
                    obtenerHeaders(true),

                body:
                    JSON.stringify({
                        Activo: activo
                    })
            }
        );


    const result =
        await procesarRespuesta<{
            MaquinaId: number;
            Activo: boolean;
        }>(
            response
        );


    return result.data;
}

// =====================================================
// ADMIN - ADMINISTRADORES
// =====================================================

export async function obtenerAdministradoresAdmin(): Promise<AdministradorAdmin[]> {

    const response =
        await fetch(
            `${API_URL}/admin/administradores`,
            {
                method: "GET",
                headers: obtenerHeaders(false)
            }
        );

    const result =
        await procesarRespuesta<AdministradorAdmin[]>(
            response
        );

    return result.data;
}


export async function crearAdministradorAdmin(
    data: {
        Usuario: string;
        Password: string;
        Activo?: boolean;
        EmpresaIds: number[];
        PlantaIds: number[];
    }
): Promise<AdministradorAdmin> {

    const response =
        await fetch(
            `${API_URL}/admin/administradores`,
            {
                method: "POST",
                headers: obtenerHeaders(true),
                body: JSON.stringify(data)
            }
        );

    const result =
        await procesarRespuesta<AdministradorAdmin>(
            response
        );

    return result.data;
}


export async function actualizarAdministradorAdmin(
    usuarioId: number,
    data: {
        Usuario: string;
        Password?: string;
        Activo?: boolean;
        EmpresaIds: number[];
        PlantaIds: number[];
    }
): Promise<AdministradorAdmin> {

    const response =
        await fetch(
            `${API_URL}/admin/administradores/${usuarioId}`,
            {
                method: "PUT",
                headers: obtenerHeaders(true),
                body: JSON.stringify(data)
            }
        );

    const result =
        await procesarRespuesta<AdministradorAdmin>(
            response
        );

    return result.data;
}


export async function cambiarEstadoAdministradorAdmin(
    usuarioId: number,
    activo: boolean
) {

    const response =
        await fetch(
            `${API_URL}/admin/administradores/${usuarioId}/estado`,
            {
                method: "PATCH",
                headers: obtenerHeaders(true),
                body: JSON.stringify({
                    Activo: activo
                })
            }
        );

    const result =
        await procesarRespuesta<{
            UsuarioId: number;
            Activo: boolean;
        }>(
            response
        );

    return result.data;
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

export function cerrarSesionLocal(): void {

    localStorage.removeItem(
        "mnt_sesion"
    );
}


// =====================================================
// OBTENER USUARIO ACTUAL
// =====================================================

export function obtenerUsuarioActual():
    UsuarioSesion | null {

    return obtenerSesion();
}


// =====================================================
// OBTENER URL BASE DE LA API
// =====================================================

export function obtenerApiBaseUrl(): string {

    return API_URL;
}


// =====================================================
// OBTENER URL BASE DEL SERVIDOR
// =====================================================

export function obtenerBaseUrl(): string {

    return API_URL.replace(
        "/api/v1/mnt",
        ""
    );
}

export interface HistorialMaquina {
    TicketId: number;
    NumeroTicket: string;

    MaquinaId: number;
    CodigoMaquina?: string | null;
    Maquina?: string | null;

    MecanicoId: number;
    Mecanico?: string | null;

    TipoMantenimientoId: number;
    TipoMantenimiento?: string | null;

    PrioridadId: number;
    Prioridad?: string | null;

    EstadoId: number;
    Estado?: string | null;

    FechaReporte: string;

    HoraInicio?: string | null;
    HoraFin?: string | null;

    TrabajoRealizado?: string | null;
    Observaciones?: string | null;

    FechaCreacion?: string;
    FechaActualizacion?: string | null;
}


export async function obtenerHistorialMaquina(
    maquinaId: number
): Promise<HistorialMaquina[]> {

    const respuesta = await fetch(
        `${API_URL}/maquinas/${maquinaId}/historial`,
        {
            method: "GET",
            headers: obtenerHeaders()
        }
    );

    const resultado =
        await procesarRespuesta<HistorialMaquina[]>(
            respuesta
        );

    return resultado.data;
}

