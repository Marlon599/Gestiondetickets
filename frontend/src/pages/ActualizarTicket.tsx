import {
    FormEvent,
    ChangeEvent,
    useEffect,
    useState
} from "react";

import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    FileText,
    Save,
    Wrench,
    Lock,
    Camera,
    X
} from "lucide-react";

import {
    actualizarTicket,
    finalizarTicket,
    obtenerTicket,
    obtenerFotosTicket,
    subirFotosTicket,
    Ticket,
    FotoTicket
} from "../services/api";


interface ActualizarTicketProps {

    ticketId: number;

    onVolver: () => void;

    onActualizado: () => void;

}


function ActualizarTicket({
    ticketId,
    onVolver,
    onActualizado
}: ActualizarTicketProps) {


    const [ticket, setTicket] =
        useState<Ticket | null>(null);


    // =====================================================
    // ÚNICO CAMPO EDITABLE
    // =====================================================

    const [trabajoRealizado, setTrabajoRealizado] =
        useState("");


    // =====================================================
    // FOTOGRAFÍAS
    // =====================================================

    const [fotosDespues, setFotosDespues] =
        useState<File[]>([]);

    const [fotosGuardadas, setFotosGuardadas] =
        useState<FotoTicket[]>([]);

    const [subiendoFotos, setSubiendoFotos] =
        useState(false);

        // =====================================================
         // VISOR DE FOTOGRAFÍAS
        // =====================================================

    const [fotoAmpliada, setFotoAmpliada] =
    useState<string | null>(null);


    // =====================================================
    // ESTADOS
    // =====================================================

    const [cargando, setCargando] =
        useState(true);

    const [guardando, setGuardando] =
        useState(false);

    const [finalizando, setFinalizando] =
        useState(false);

    const [error, setError] =
        useState("");

    const [mensaje, setMensaje] =
        useState("");


    // =====================================================
    // URL BASE DEL SERVIDOR
    // =====================================================

    function obtenerBaseUrl() {

        const apiUrl =
            import.meta.env.VITE_API_URL ||
            "http://localhost:3010/api/v1/mnt";

        return apiUrl.replace(
            "/api/v1/mnt",
            ""
        );

    }

    function normalizarTrabajoRealizado(valor: unknown): string {
    if (typeof valor === "string") {
        return valor;
    }

    if (valor == null) {
        return "";
    }

    if (typeof valor === "object") {
        const objeto = valor as Record<string, unknown>;

        if (typeof objeto.TrabajoRealizado === "string") {
            return objeto.TrabajoRealizado;
        }

        if (typeof objeto.trabajoRealizado === "string") {
            return objeto.trabajoRealizado;
        }

        if (typeof objeto.data === "string") {
            return objeto.data;
        }

        if (
            objeto.data &&
            typeof objeto.data === "object"
        ) {
            const data = objeto.data as Record<string, unknown>;

            if (
                typeof data.TrabajoRealizado === "string"
            ) {
                return data.TrabajoRealizado;
            }

            if (
                typeof data.trabajoRealizado === "string"
            ) {
                return data.trabajoRealizado;
            }
        }
    }

    return "";
}

    // =====================================================
    // CARGAR TICKET
    // =====================================================

    useEffect(() => {

        async function cargarTicket() {

            try {

                setCargando(true);

                setError("");

const data = await obtenerTicket(ticketId);

console.log("=================================");
console.log("TICKET RECIBIDO:", data);
console.log("TRABAJO REALIZADO:", data.TrabajoRealizado);
console.log(
    "TIPO TRABAJO REALIZADO:",
    typeof data.TrabajoRealizado
);
console.log("=================================");

setTicket(data);

setTrabajoRealizado(
    normalizarTrabajoRealizado(
        data.TrabajoRealizado
    )
);

                // =========================================
                // CARGAR FOTOGRAFÍAS
                // =========================================

                const fotos =
                    await obtenerFotosTicket(ticketId);

                setFotosGuardadas(fotos);


            } catch (error) {

                console.error(error);

                setError(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar el ticket."
                );

            } finally {

                setCargando(false);

            }

        }


        cargarTicket();

    }, [ticketId]);


    // =====================================================
    // FORMATO FECHA
    // =====================================================
function formatearFecha(
    fecha: string | null
) {


    if (!fecha) {
        return "—";
    }

    const valor = String(fecha).trim();


    const sinZona = valor
        .replace(/Z$/i, "")
        .replace(/([+-]\d{2}:\d{2})$/, "");

    const match = sinZona.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?)?$/
    );

    if (match) {

        const anio = Number(match[1]);
        const mes = Number(match[2]);
        const dia = Number(match[3]);
        const hora = Number(match[4] || 0);
        const minuto = Number(match[5] || 0);
        const segundo = Number(match[6] || 0);

        const resultado = new Date(
            anio,
            mes - 1,
            dia,
            hora,
            minuto,
            segundo
        );

        console.log("🔥 HORA FINAL:", resultado.toString());

        return resultado.toLocaleString(
            "es-GT",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );
    }

    return "—";
}
    // =====================================================
    // COLOR PRIORIDAD
    // =====================================================

    function prioridadClass(
        prioridad: string
    ) {

        switch (
            prioridad.toLowerCase()
        ) {

            case "crítica":

            case "critica":

                return "priority-critical";


            case "alta":

                return "priority-high";


            case "media":

                return "priority-medium";


            default:

                return "priority-low";

        }

    }


    // =====================================================
    // SELECCIONAR FOTOS DESPUÉS
    // =====================================================

    function seleccionarFotosDespues(
        event: ChangeEvent<HTMLInputElement>
    ) {

        const archivos =
            Array.from(
                event.target.files || []
            );


        if (archivos.length === 0) {

            return;

        }


        const tiposPermitidos = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        const archivosValidos =
            archivos.filter(
                archivo =>
                    tiposPermitidos.includes(
                        archivo.type
                    )
            );


        if (
            archivosValidos.length !==
            archivos.length
        ) {

            setError(
                "Solo se permiten imágenes JPG, PNG o WEBP."
            );

            return;

        }


        const combinadas = [

            ...fotosDespues,

            ...archivosValidos

        ];


        if (combinadas.length > 10) {

            setError(
                "Puedes seleccionar un máximo de 10 fotografías."
            );

            return;

        }


        setFotosDespues(
            combinadas
        );

        setError("");


        // Permite volver a seleccionar
        // el mismo archivo

        event.target.value = "";

    }


    // =====================================================
    // ELIMINAR FOTO SELECCIONADA
    // =====================================================

    function eliminarFotoDespues(
        index: number
    ) {

        setFotosDespues(
            actuales =>
                actuales.filter(
                    (_, i) =>
                        i !== index
                )
        );

    }


    // =====================================================
    // SUBIR FOTOS DESPUÉS
    // =====================================================

    async function subirFotosDespues() {

        if (
            fotosDespues.length === 0
        ) {

            return;

        }


        if (!ticket) {

            return;

        }


        if (
            ticket.Estado ===
            "Finalizado"
        ) {

            setError(
                "Este ticket ya fue finalizado y no puede modificarse."
            );

            return;

        }


        try {

            setSubiendoFotos(true);

            setError("");

            setMensaje("");


            // =========================================
            // SUBIR FOTOS
            // =========================================

            const nuevasFotos =
                await subirFotosTicket(
                    ticketId,
                    fotosDespues,
                    "DESPUES"
                );


            // =========================================
            // ACTUALIZAR GALERÍA
            // =========================================

            setFotosGuardadas(
                previous => [
                    ...previous,
                    ...nuevasFotos
                ]
            );


            // =========================================
            // LIMPIAR SELECCIÓN
            // =========================================

            setFotosDespues([]);


            setMensaje(
                "Fotografías del mantenimiento guardadas correctamente."
            );


        } catch (error) {

            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "No fue posible guardar las fotografías."
            );

        } finally {

            setSubiendoFotos(false);

        }

    }


    // =====================================================
    // GUARDAR TRABAJO
    // =====================================================

    async function guardarCambios(
        event: FormEvent
    ) {

        event.preventDefault();


        if (!ticket) {

            return;

        }


        if (
            ticket.Estado ===
            "Finalizado"
        ) {

            setError(
                "Este ticket ya fue finalizado y no puede modificarse."
            );

            return;

        }


        try {

            setGuardando(true);

            setError("");

            setMensaje("");


            const actualizado =
                await actualizarTicket(
                    ticketId,
                    {
                        trabajoRealizado:
                            trabajoRealizado.trim()
                    }
                );


            setTicket(
                previous =>
                    previous
                        ? {
                            ...previous,
                            ...actualizado
                        }
                        : previous
            );


            setMensaje(
                "Trabajo realizado guardado correctamente."
            );


        } catch (error) {

            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "No fue posible guardar los cambios."
            );

        } finally {

            setGuardando(false);

        }

    }


    // =====================================================
    // FINALIZAR
    // =====================================================

    async function finalizar() {

        if (!ticket) {

            return;

        }


        if (
            ticket.Estado ===
            "Finalizado"
        ) {

            return;

        }


        if (
            !trabajoRealizado.trim()
        ) {

            setError(
                "Antes de finalizar debes describir el trabajo realizado."
            );

            return;

        }


        const confirmar =
            window.confirm(
                "¿Estás seguro de finalizar este mantenimiento?\n\nDespués de finalizar, el ticket quedará bloqueado y ya no podrá modificarse."
            );


        if (!confirmar) {

            return;

        }


        try {

            setFinalizando(true);

            setError("");

            setMensaje("");


            // =================================================
            // 1. GUARDAR TRABAJO REALIZADO
            // =================================================

            await actualizarTicket(
                ticketId,
                {
                    trabajoRealizado:
                        trabajoRealizado.trim()
                }
            );


            // =================================================
            // 2. SUBIR FOTOS DESPUÉS PENDIENTES
            // =================================================

            if (
                fotosDespues.length > 0
            ) {

                const nuevasFotos =
                    await subirFotosTicket(
                        ticketId,
                        fotosDespues,
                        "DESPUES"
                    );


                setFotosGuardadas(
                    previous => [
                        ...previous,
                        ...nuevasFotos
                    ]
                );


                setFotosDespues([]);

            }


            // =================================================
            // 3. FINALIZAR TICKET
            // =================================================

            const finalizado =
                await finalizarTicket(
                    ticketId
                );


            setTicket(
                previous =>
                    previous
                        ? {
                            ...previous,
                            ...finalizado
                        }
                        : previous
            );


            setMensaje(
                "Mantenimiento finalizado correctamente."
            );


            // =================================================
            // 4. VOLVER AL PANEL
            // =================================================

            setTimeout(() => {

                onActualizado();

            }, 1500);


        } catch (error) {

            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "No fue posible finalizar el mantenimiento."
            );

        } finally {

            setFinalizando(false);

        }

    }


    // =====================================================
    // CARGANDO
    // =====================================================

    if (cargando) {

        return (

            <div className="loading-page">

                <Wrench size={32} />

                <p>
                    Cargando ticket...
                </p>

            </div>

        );

    }


    // =====================================================
    // NO ENCONTRADO
    // =====================================================

    if (!ticket) {

        return (

            <div className="loading-page">

                <p>
                    {error ||
                        "Ticket no encontrado."}
                </p>


                <button
                    className="secondary-button"
                    onClick={onVolver}
                >

                    Volver

                </button>

            </div>

        );

    }


    const finalizado =
        ticket.Estado === "Finalizado";


    // =====================================================
    // FOTOS ANTES
    // =====================================================

    const fotosAntes =
        fotosGuardadas.filter(
            foto =>
                foto.TipoEvidencia ===
                "ANTES"
        );


    // =====================================================
    // FOTOS DESPUÉS
    // =====================================================

    const fotosDespuesGuardadas =
        fotosGuardadas.filter(
            foto =>
                foto.TipoEvidencia ===
                "DESPUES"
        );


    // =====================================================
    // INTERFAZ
    // =====================================================

    return (

        <div className="app-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="topbar">

                <div className="brand">

                    <div className="brand-icon">

                        <Wrench size={26} />

                    </div>


                    <div>

                        <h1>
                            Gestión de Mantenimiento
                        </h1>

                        <span>
                            Sistema de control de mantenimiento
                        </span>

                    </div>

                </div>

            </header>


            {/* =================================================
                CONTENIDO
            ================================================= */}

            <main className="form-page">


                {/* =================================================
                    VOLVER
                ================================================= */}

                <button
                    type="button"
                    className="back-button"
                    onClick={onVolver}
                >

                    <ArrowLeft size={18} />

                    Volver al panel

                </button>


                {/* =================================================
                    CABECERA
                ================================================= */}

                <div className="ticket-detail-header">

                    <div>

                        <div className="ticket-number">

                            {ticket.NumeroTicket}

                        </div>


                        <h2>

                            {finalizado
                                ? "Mantenimiento finalizado"
                                : "Actualizar mantenimiento"
                            }

                        </h2>


                        <p>

                            {finalizado
                                ? "Consulta el resultado registrado del mantenimiento."
                                : "Completa la información del trabajo realizado."
                            }

                        </p>

                    </div>


                    <div className="ticket-status-area">

                        <span
                            className={
                                `priority-badge ${prioridadClass(
                                    ticket.Prioridad
                                )}`
                            }
                        >

                            {ticket.Prioridad}

                        </span>


                        <span
                            className={
                                `status-badge ${
                                    finalizado
                                        ? "status-finished"
                                        : "status-progress"
                                }`
                            }
                        >

                            {finalizado ? (

                                <CheckCircle2 size={15} />

                            ) : (

                                <Clock3 size={15} />

                            )}


                            {ticket.Estado}

                        </span>

                    </div>

                </div>


                {/* =================================================
                    MENSAJE FINALIZADO
                ================================================= */}

                {finalizado && (

                    <div className="finalized-banner">

                        <Lock size={22} />

                        <div>

                            <strong>
                                Ticket bloqueado
                            </strong>

                            <span>
                                Este mantenimiento ya fue finalizado. Los datos registrados no pueden modificarse.
                            </span>

                        </div>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="form-alert error">

                        <AlertTriangle size={18} />

                        {error}

                    </div>

                )}


                {/* =================================================
                    MENSAJE
                ================================================= */}

                {mensaje && (

                    <div className="form-alert success">

                        <CheckCircle2 size={18} />

                        {mensaje}

                    </div>

                )}


                <form
                    className="ticket-form"
                    onSubmit={guardarCambios}
                >


                    {/* =================================================
                        INFORMACIÓN DEL TICKET
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <FileText size={21} />

                            <div>

                                <h3>
                                    Información del ticket
                                </h3>

                                <span>
                                    Información registrada al crear la incidencia.
                                </span>

                            </div>

                        </div>


                        <div className="ticket-summary-grid">


                            {/* MECÁNICO */}

                            <div className="summary-item">

                                <span>
                                    Mecánico
                                </span>

                                <strong>
                                    {ticket.Mecanico}
                                </strong>

                            </div>


                            {/* MÁQUINA */}

                            <div className="summary-item">

                                <span>
                                    Máquina
                                </span>

                                <strong>

                                    {ticket.CodigoMaquina}

                                    {" - "}

                                    {ticket.Maquina}

                                </strong>

                            </div>


                            {/* TIPO MANTENIMIENTO */}

                            <div className="summary-item">

                                <span>
                                    Tipo de mantenimiento
                                </span>

                                <strong>
                                    {ticket.TipoMantenimiento}
                                </strong>

                            </div>


                            {/* TIPO TRABAJO */}

                            <div className="summary-item">

                                <span>
                                    Tipo de trabajo
                                </span>

                                <strong>

                                    {ticket.TipoTrabajo ||
                                        "No especificado"}

                                    {ticket.TipoTrabajoPersonalizado && (

                                        <small>

                                            {
                                                ticket.TipoTrabajoPersonalizado
                                            }

                                        </small>

                                    )}

                                </strong>

                            </div>


                            {/* PRIORIDAD */}

                            <div className="summary-item">

                                <span>
                                    Prioridad
                                </span>

                                <strong>

                                    <span
                                        className={
                                            `priority-badge ${prioridadClass(
                                                ticket.Prioridad
                                            )}`
                                        }
                                    >

                                        {ticket.Prioridad}

                                    </span>

                                </strong>

                            </div>


                            {/* HORA INICIO */}

                            <div className="summary-item">

                                <span>
                                    Hora de inicio
                                </span>

                                <strong>

                                    {formatearFecha(
                                        ticket.HoraInicio
                                    )}

                                </strong>

                            </div>


                        </div>

                    </section>


                    {/* =================================================
                        PROBLEMA ORIGINAL
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <div className="problem-header-icon">

                                <AlertTriangle size={21} />

                            </div>

                            <div>

                                <h3>
                                    Problema reportado
                                </h3>

                                <span>
                                    Incidencia registrada al crear el ticket.
                                </span>

                            </div>

                        </div>


                        <div className="reported-problem">

                            <div className="reported-problem-label">

                                <AlertTriangle size={17} />

                                Incidencia original

                                <Lock size={14} />

                            </div>


                            <p>

                                {ticket.Observaciones ||
                                    "No se registró una descripción del problema."}

                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        EVIDENCIA FOTOGRÁFICA
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <div className="photo-header-icon">

                                <Camera size={21} />

                            </div>

                            <div>

                                <h3>
                                    Evidencia fotográfica
                                </h3>

                                <span>
                                    Registra el estado de la máquina antes y después del mantenimiento.
                                </span>

                            </div>

                        </div>


                        {/* =================================================
                            ANTES
                        ================================================= */}

                        <div className="evidence-section">

                            <div className="evidence-section-title">

                                <div>

                                    <strong>
                                        Evidencia antes del mantenimiento
                                    </strong>

                                    <span>
                                        Fotografías tomadas al reportar la incidencia.
                                    </span>

                                </div>


                                <span className="evidence-badge before">

                                    ANTES

                                </span>

                            </div>


                            {fotosAntes.length > 0 ? (

                                <div className="photo-gallery">

                                    {fotosAntes.map(
                                        foto => (

<div
    className="saved-photo"
    key={foto.FotoId}
    onClick={() =>
        setFotoAmpliada(
            `${obtenerBaseUrl()}${foto.RutaArchivo}`
        )
    }
    style={{ cursor: "pointer" }}
>
    <img
        src={
            `${obtenerBaseUrl()}${foto.RutaArchivo}`
        }
        alt="Evidencia antes del mantenimiento"
    />
</div>

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="no-photos">

                                    No hay fotografías de evidencia inicial.

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            DESPUÉS
                        ================================================= */}

                        {!finalizado && (

                            <div className="evidence-section">

                                <div className="evidence-section-title">

                                    <div>

                                        <strong>
                                            Evidencia después del mantenimiento
                                        </strong>

                                        <span>
                                            Agrega fotografías que demuestren el resultado del trabajo realizado.
                                        </span>

                                    </div>


                                    <span className="evidence-badge after">

                                        DESPUÉS

                                    </span>

                                </div>


                                <div className="photo-upload-area">

                                    <label
                                        htmlFor="fotosDespues"
                                        className="photo-upload-button"
                                    >

                                        <Camera size={20} />

                                        Seleccionar fotografías

                                    </label>


                                    <input
                                        id="fotosDespues"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        onChange={
                                            seleccionarFotosDespues
                                        }
                                        disabled={
                                            subiendoFotos ||
                                            finalizando
                                        }
                                        style={{
                                            display: "none"
                                        }}
                                    />


                                    <p className="photo-upload-help">

                                        Puedes agregar hasta 10 fotografías.
                                        Formatos permitidos: JPG, PNG y WEBP.

                                    </p>

                                </div>


                                {/* PREVISUALIZACIÓN */}

                                {fotosDespues.length > 0 && (

                                    <div className="photo-preview-container">

                                        <div className="photo-preview-title">

                                            <strong>
                                                Fotografías seleccionadas
                                            </strong>

                                            <span>
                                                {fotosDespues.length}/10
                                            </span>

                                        </div>


                                        <div className="photo-preview-grid">

                                            {fotosDespues.map(
                                                (foto, index) => (

                                                    <div
                                                        className="photo-preview-item"
                                                        key={`${foto.name}-${index}`}
                                                    >

                                                        <img
                                                            src={
                                                                URL.createObjectURL(
                                                                    foto
                                                                )
                                                            }
                                                            alt={
                                                                `Evidencia después ${
                                                                    index + 1
                                                                }`
                                                            }
                                                        />


                                                        <button
                                                            type="button"
                                                            className="photo-remove-button"
                                                            onClick={() =>
                                                                eliminarFotoDespues(
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                subiendoFotos
                                                            }
                                                            title="Eliminar fotografía"
                                                        >

                                                            <X size={16} />

                                                        </button>


                                                        <div className="photo-preview-name">

                                                            {foto.name}

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>


                                        <div className="photo-upload-actions">

                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={
                                                    subirFotosDespues
                                                }
                                                disabled={
                                                    subiendoFotos ||
                                                    finalizando
                                                }
                                            >

                                                <Camera size={18} />

                                                {subiendoFotos

                                                    ? "Subiendo fotografías..."

                                                    : "Guardar fotografías"

                                                }

                                            </button>

                                        </div>

                                    </div>

                                )}


                                {/* FOTOS DESPUÉS YA GUARDADAS */}

                                {fotosDespuesGuardadas.length > 0 && (

                                    <div className="saved-after-section">

                                        <div className="photo-preview-title">

                                            <strong>
                                                Fotografías guardadas
                                            </strong>

                                            <span>
                                                {fotosDespuesGuardadas.length}
                                            </span>

                                        </div>


                                        <div className="photo-gallery">

                                            {fotosDespuesGuardadas.map(
                                                foto => (
<div
    className="saved-photo"
    key={foto.FotoId}
    onClick={() =>
        setFotoAmpliada(
            `${obtenerBaseUrl()}${foto.RutaArchivo}`
        )
    }
    style={{ cursor: "pointer" }}
>

                                                        <img
                                                            src={
                                                                `${obtenerBaseUrl()}${foto.RutaArchivo}`
                                                            }
                                                            alt="Resultado del mantenimiento"
                                                        />

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                )}

                            </div>

                        )}


                        {/* =================================================
                            DESPUÉS - TICKET FINALIZADO
                        ================================================= */}

                        {finalizado && (

                            <div className="evidence-section">

                                <div className="evidence-section-title">

                                    <div>

                                        <strong>
                                            Resultado del mantenimiento
                                        </strong>

                                        <span>
                                            Fotografías registradas durante la finalización.
                                        </span>

                                    </div>


                                    <span className="evidence-badge after">

                                        DESPUÉS

                                    </span>

                                </div>


                                {fotosDespuesGuardadas.length > 0 ? (

                                    <div className="photo-gallery">

                                        {fotosDespuesGuardadas.map(
                                            foto => (

<div
    className="saved-photo"
    key={foto.FotoId}
    onClick={() =>
        setFotoAmpliada(
            `${obtenerBaseUrl()}${foto.RutaArchivo}`
        )
    }
    style={{ cursor: "pointer" }}
>
    <img
        src={
            `${obtenerBaseUrl()}${foto.RutaArchivo}`
        }
        alt="Resultado del mantenimiento"
    />
</div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <div className="no-photos">

                                        No se registraron fotografías después del mantenimiento.

                                    </div>

                                )}

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        TRABAJO REALIZADO
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <Wrench size={21} />

                            <div>

                                <h3>
                                    Trabajo realizado
                                </h3>

                                <span>

                                    {finalizado

                                        ? "Resultado registrado por el mecánico."

                                        : "Describe las actividades realizadas para solucionar la incidencia."

                                    }

                                </span>

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Trabajo realizado
                            </label>


                            <textarea

                                rows={8}

                                value={
                                    trabajoRealizado
                                }

                                onChange={event =>
                                    setTrabajoRealizado(
                                        event.target.value
                                    )
                                }

                                disabled={
                                    finalizado ||
                                    guardando ||
                                    finalizando
                                }

                                placeholder="Describe detalladamente el trabajo realizado..."

                            />

                        </div>

                    </section>


                    {/* =================================================
                        CONTROL DE TIEMPO
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <Clock3 size={21} />

                            <div>

                                <h3>
                                    Control de tiempo
                                </h3>

                                <span>
                                    Horarios registrados automáticamente por el sistema.
                                </span>

                            </div>

                        </div>


                        <div className="time-summary">

                            <div>

                                <span>
                                    Inicio
                                </span>

                                <strong>

                                    {formatearFecha(
                                        ticket.HoraInicio
                                    )}

                                </strong>

                            </div>


                            <div className="time-arrow">

                                →

                            </div>


                            <div>

                                <span>
                                    Finalización
                                </span>

                                <strong>

                                    {ticket.HoraFin

                                        ? formatearFecha(
                                            ticket.HoraFin
                                        )

                                        : "Pendiente"

                                    }

                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        BOTONES
                    ================================================= */}

                    {!finalizado && (

                        <div className="form-actions">


                            <button
                                type="button"
                                className="secondary-button"
                                onClick={onVolver}
                                disabled={
                                    guardando ||
                                    finalizando ||
                                    subiendoFotos
                                }
                            >

                                Cancelar

                            </button>


                            <button
                                type="submit"
                                className="secondary-button"
                                disabled={
                                    guardando ||
                                    finalizando ||
                                    subiendoFotos
                                }
                            >

                                <Save size={18} />

                                {guardando

                                    ? "Guardando..."

                                    : "Guardar cambios"

                                }

                            </button>


                            <button
                                type="button"
                                className="finish-button"
                                onClick={finalizar}
                                disabled={
                                    guardando ||
                                    finalizando ||
                                    subiendoFotos
                                }
                            >

                                <CheckCircle2 size={18} />

                                {finalizando

                                    ? "Finalizando..."

                                    : "Finalizar mantenimiento"

                                }

                            </button>

                        </div>

                    )}


                    {/* =================================================
                        BOTÓN VOLVER SI FINALIZADO
                    ================================================= */}

                    {finalizado && (

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={onVolver}
                            >

                                <ArrowLeft size={18} />

                                Volver al panel

                            </button>

                        </div>

                    )}


                </form>
                {/* =====================================================
    VISOR DE FOTOGRAFÍA
===================================================== */}

{fotoAmpliada && (
    <div
        className="photo-lightbox"
        onClick={() => setFotoAmpliada(null)}
    >
        <button
            type="button"
            className="photo-lightbox-close"
            onClick={() => setFotoAmpliada(null)}
            aria-label="Cerrar fotografía"
        >
            <X size={28} />
        </button>

        <img
            src={fotoAmpliada}
            alt="Fotografía ampliada"
            className="photo-lightbox-image"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
)}

            </main>

        </div>

    );

}


export default ActualizarTicket;