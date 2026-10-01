import {
    FormEvent,
    useEffect,
    useState
} from "react";

import {
    ArrowLeft,
    ClipboardList,
    Save,
    Wrench,
    AlertTriangle,
    Camera,
    X
} from "lucide-react";

import {
    crearTicket,
    obtenerMecanicos,
    obtenerMaquinas,
    obtenerPrioridades,
    obtenerTiposMantenimiento,
    subirFotosTicket,
    obtenerUsuarioActual,
    Mecanico,
    Maquina,
    Prioridad,
    TipoMantenimiento,
    UsuarioSesion
} from "../services/api";


interface NuevoTicketProps {
    onVolver: () => void;
    onGuardado: () => void;
}


function NuevoTicket({
    onVolver,
    onGuardado
}: NuevoTicketProps) {

    // =====================================================
    // SESIÓN
    // =====================================================

    const [usuario, setUsuario] =
        useState<UsuarioSesion | null>(null);


    // =====================================================
    // CATÁLOGOS
    // =====================================================

    const [mecanicos, setMecanicos] =
        useState<Mecanico[]>([]);

    const [maquinas, setMaquinas] =
        useState<Maquina[]>([]);

    const [tiposMantenimiento, setTiposMantenimiento] =
        useState<TipoMantenimiento[]>([]);

    const [prioridades, setPrioridades] =
        useState<Prioridad[]>([]);


    // =====================================================
    // FORMULARIO
    // =====================================================

    const [mecanicoId, setMecanicoId] =
        useState("");

    const [maquinaId, setMaquinaId] =
        useState("");

    const [tipoMantenimientoId, setTipoMantenimientoId] =
        useState("");

    const [prioridadId, setPrioridadId] =
        useState("");

    const [observaciones, setObservaciones] =
        useState("");


    // =====================================================
    // FOTOGRAFÍAS
    // =====================================================

    const [fotos, setFotos] =
        useState<File[]>([]);


    // =====================================================
    // ESTADOS
    // =====================================================

    const [cargando, setCargando] =
        useState(true);

    const [guardando, setGuardando] =
        useState(false);

    const [error, setError] =
        useState("");

    const [exito, setExito] =
        useState("");


    // =====================================================
    // CARGAR SESIÓN Y CATÁLOGOS
    // =====================================================

    useEffect(() => {

        async function cargar() {

            try {

                setCargando(true);
                setError("");


                // -----------------------------------------
                // OBTENER USUARIO ACTUAL
                // -----------------------------------------

                const sesion =
                    obtenerUsuarioActual();

                if (!sesion) {

                    setError(
                        "No existe una sesión activa."
                    );

                    return;
                }

                setUsuario(sesion);


                // -----------------------------------------
                // CARGAR CATÁLOGOS
                // -----------------------------------------

                const [
                    mecanicosData,
                    maquinasData,
                    mantenimientoData,
                    prioridadesData
                ] = await Promise.all([

                    obtenerMecanicos(),

                    obtenerMaquinas(),

                    obtenerTiposMantenimiento(),

                    obtenerPrioridades()

                ]);


                setMecanicos(
                    mecanicosData
                );

                setMaquinas(
                    maquinasData
                );

                setTiposMantenimiento(
                    mantenimientoData
                );

                setPrioridades(
                    prioridadesData
                );


                // -----------------------------------------
                // SI ES MECÁNICO
                // -----------------------------------------

                if (
                    sesion.rol === "MECANICO" &&
                    sesion.mecanicoId !== null
                ) {

                    setMecanicoId(
                        String(
                            sesion.mecanicoId
                        )
                    );
                }

            } catch (error) {

                console.error(error);

                setError(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar la información."
                );

            } finally {

                setCargando(false);

            }

        }


        cargar();

    }, []);


    // =====================================================
    // OBTENER NOMBRE DEL MECÁNICO ACTUAL
    // =====================================================

    function obtenerNombreMecanicoActual(): string {

        if (
            !usuario ||
            usuario.mecanicoId === null
        ) {
            return "";
        }


        const mecanico =
            mecanicos.find(
                (item) =>
                    item.MecanicoId ===
                    usuario.mecanicoId
            );


        if (!mecanico) {

            return (
                usuario.nombre ||
                usuario.usuario
            );
        }


        return `${mecanico.Nombre} ${mecanico.Apellido}`;
    }


    // =====================================================
    // SELECCIONAR FOTOS
    // =====================================================

    function seleccionarFotos(
        event: React.ChangeEvent<HTMLInputElement>
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
                (archivo) =>
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
            ...fotos,
            ...archivosValidos
        ];


        if (combinadas.length > 10) {

            setError(
                "Puedes agregar un máximo de 10 fotografías."
            );

            return;
        }


        setFotos(combinadas);

        setError("");


        // Permitir volver a seleccionar
        // el mismo archivo

        event.target.value = "";

    }


    // =====================================================
    // ELIMINAR FOTO
    // =====================================================

    function eliminarFoto(
        index: number
    ) {

        setFotos(
            (actuales) =>
                actuales.filter(
                    (_, i) =>
                        i !== index
                )
        );

    }


    // =====================================================
    // CREAR TICKET
    // =====================================================

    async function guardarTicket(
        event: FormEvent
    ) {

        event.preventDefault();

        setError("");
        setExito("");


        // =================================================
        // VALIDACIÓN MECÁNICO
        // =================================================

        if (
            usuario?.rol === "MECANICO"
        ) {

            if (
                usuario.mecanicoId === null
            ) {

                setError(
                    "La sesión del mecánico no tiene un ID de mecánico válido."
                );

                return;
            }

        } else {

            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            if (!mecanicoId) {

                setError(
                    "Selecciona un mecánico."
                );

                return;
            }

        }


        // =================================================
        // VALIDAR MÁQUINA
        // =================================================

        if (!maquinaId) {

            setError(
                "Selecciona una máquina."
            );

            return;
        }


        // =================================================
        // VALIDAR TIPO MANTENIMIENTO
        // =================================================

        if (!tipoMantenimientoId) {

            setError(
                "Selecciona el tipo de mantenimiento."
            );

            return;
        }


        // =================================================
        // VALIDAR PRIORIDAD
        // =================================================

        if (!prioridadId) {

            setError(
                "Selecciona una prioridad."
            );

            return;
        }


        // =================================================
        // VALIDAR PROBLEMA
        // =================================================

        if (!observaciones.trim()) {

            setError(
                "Describe el problema o incidencia reportada."
            );

            return;
        }


        try {

            setGuardando(true);


            // =================================================
            // 1. CREAR TICKET
            // =================================================
            //
            // ADMIN:
            // manda el mecánico seleccionado.
            //
            // MECÁNICO:
            // manda su ID de sesión.
            //
            // EL BACKEND:
            // igualmente valida el JWT y utiliza
            // el mecánico autenticado.
            // =================================================

            const mecanicoParaCrear =
                usuario?.rol === "MECANICO"
                    ? usuario.mecanicoId!
                    : Number(mecanicoId);


            const ticket =
                await crearTicket({

                    mecanicoId:
                        mecanicoParaCrear,

                    maquinaId:
                        Number(maquinaId),

                    tipoMantenimientoId:
                        Number(
                            tipoMantenimientoId
                        ),

                    prioridadId:
                        Number(
                            prioridadId
                        ),

                    observaciones:
                        observaciones.trim()

                });


            // =================================================
            // 2. SUBIR FOTOGRAFÍAS ANTES
            // =================================================

            if (
                fotos.length > 0
            ) {

                await subirFotosTicket(
                    ticket.TicketId,
                    fotos,
                    "ANTES"
                );

            }


            // =================================================
            // 3. MENSAJE DE ÉXITO
            // =================================================

            setExito(

                fotos.length > 0

                    ? `Ticket ${ticket.NumeroTicket} creado correctamente con ${fotos.length} fotografía(s).`

                    : `Ticket ${ticket.NumeroTicket} creado correctamente.`

            );


            // =================================================
            // 4. VOLVER AL DASHBOARD
            // =================================================

            setTimeout(() => {

                onGuardado();

            }, 1200);


        } catch (error) {

            console.error(error);

            setError(

                error instanceof Error

                    ? error.message

                    : "No fue posible crear el ticket."

            );

        } finally {

            setGuardando(false);

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
                    Cargando información...
                </p>

            </div>

        );

    }


    // =====================================================
    // PANTALLA
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
                    TÍTULO
                ================================================= */}

                <div className="form-title">

                    <div>

                        <h2>
                            Nuevo ticket de mantenimiento
                        </h2>

                        <p>
                            Registra una nueva actividad o incidencia
                            de mantenimiento.
                        </p>

                    </div>


                    <div className="phase-indicator">

                        <span className="phase-active">
                            1
                        </span>

                        <span>
                            Registrar incidencia
                        </span>

                    </div>

                </div>


                {/* =================================================
                    ALERTAS
                ================================================= */}

                {error && (

                    <div className="form-alert error">

                        <AlertTriangle size={18} />

                        {error}

                    </div>

                )}


                {exito && (

                    <div className="form-alert success">

                        {exito}

                    </div>

                )}


                <form
                    className="ticket-form"
                    onSubmit={guardarTicket}
                >


                    {/* =================================================
                        INFORMACIÓN DEL MANTENIMIENTO
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <ClipboardList size={21} />

                            <div>

                                <h3>
                                    Información del mantenimiento
                                </h3>

                                <span>
                                    Datos principales del trabajo.
                                </span>

                            </div>

                        </div>


                        <div className="form-grid">


                            {/* =================================================
    MECÁNICO
================================================= */}

<div className="form-field">

    <label>
        Mecánico <span>*</span>
    </label>

    {usuario?.rol === "ADMIN" ||
     usuario?.rol === "SUPERADMIN" ? (

        <select
            value={mecanicoId}
            onChange={(event) =>
                setMecanicoId(
                    event.target.value
                )
            }
            disabled={guardando}
        >

            <option value="">
                Selecciona un mecánico
            </option>

            {mecanicos.map(
                (mecanico) => (

                    <option
                        key={
                            mecanico.MecanicoId
                        }
                        value={
                            mecanico.MecanicoId
                        }
                    >

                        {mecanico.Nombre}{" "}
                        {mecanico.Apellido}

                    </option>

                )
            )}

        </select>

    ) : (

        <div className="readonly-field">

            <Wrench size={17} />

            <span>
                {obtenerNombreMecanicoActual()}
            </span>

        </div>

    )}

</div>


                            {/* =================================================
                                MÁQUINA
                            ================================================= */}

                            <div className="form-field">

                                <label>
                                    Máquina <span>*</span>
                                </label>


                                <select
                                    value={maquinaId}
                                    onChange={(event) =>
                                        setMaquinaId(
                                            event.target.value
                                        )
                                    }
                                    disabled={guardando}
                                >

                                    <option value="">
                                        Selecciona una máquina
                                    </option>


                                    {maquinas.map(
                                        (maquina) => (

                                            <option
                                                key={
                                                    maquina.MaquinaId
                                                }
                                                value={
                                                    maquina.MaquinaId
                                                }
                                            >

                                                {maquina.Codigo} -{" "}
                                                {maquina.Nombre}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* =================================================
                                TIPO MANTENIMIENTO
                            ================================================= */}

                            <div className="form-field">

                                <label>
                                    Tipo de mantenimiento{" "}
                                    <span>*</span>
                                </label>


                                <select
                                    value={
                                        tipoMantenimientoId
                                    }
                                    onChange={(event) =>
                                        setTipoMantenimientoId(
                                            event.target.value
                                        )
                                    }
                                    disabled={guardando}
                                >

                                    <option value="">
                                        Selecciona un tipo
                                    </option>


                                    {tiposMantenimiento.map(
                                        (tipo) => (

                                            <option
                                                key={
                                                    tipo.TipoMantenimientoId
                                                }
                                                value={
                                                    tipo.TipoMantenimientoId
                                                }
                                            >

                                                {tipo.Nombre}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* =================================================
                                PRIORIDAD
                            ================================================= */}

                            <div className="form-field">

                                <label>
                                    Prioridad <span>*</span>
                                </label>


                                <select
                                    value={prioridadId}
                                    onChange={(event) =>
                                        setPrioridadId(
                                            event.target.value
                                        )
                                    }
                                    disabled={guardando}
                                >

                                    <option value="">
                                        Selecciona una prioridad
                                    </option>


                                    {prioridades.map(
                                        (prioridad) => (

                                            <option
                                                key={
                                                    prioridad.PrioridadId
                                                }
                                                value={
                                                    prioridad.PrioridadId
                                                }
                                            >

                                                {prioridad.Nombre}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                        </div>

                    </section>


                    {/* =================================================
                        PROBLEMA / INCIDENCIA
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <div className="problem-header-icon">

                                <AlertTriangle size={21} />

                            </div>


                            <div>

                                <h3>
                                    Problema o incidencia reportada
                                </h3>

                                <span>
                                    Describe el motivo por el cual
                                    se solicita el mantenimiento.
                                </span>

                            </div>

                        </div>


                        <div className="form-field">

                            <label>
                                Problema reportado{" "}
                                <span>*</span>
                            </label>


                            <textarea
                                rows={6}
                                value={observaciones}
                                onChange={(event) =>
                                    setObservaciones(
                                        event.target.value
                                    )
                                }
                                placeholder="Ejemplo: La máquina no enciende, presenta ruido extraño, fuga de aceite, vibración, etc."
                                disabled={guardando}
                            />

                        </div>


                        <div className="problem-note">

                            <AlertTriangle size={16} />

                            <span>

                                Esta información quedará registrada
                                como parte del ticket y no podrá
                                modificarse después de finalizar
                                el mantenimiento.

                            </span>

                        </div>

                    </section>


                    {/* =================================================
                        EVIDENCIA INICIAL
                    ================================================= */}

                    <section className="form-card">

                        <div className="form-card-header">

                            <div className="photo-header-icon">

                                <Camera size={21} />

                            </div>


                            <div>

                                <h3>
                                    Evidencia del problema
                                </h3>

                                <span>
                                    Agrega fotografías del estado de la máquina
                                    antes de iniciar el mantenimiento.
                                </span>

                            </div>

                        </div>


                        <div className="photo-upload-area">

                            <label
                                htmlFor="fotosAntes"
                                className="photo-upload-button"
                            >

                                <Camera size={20} />

                                Seleccionar fotografías

                            </label>


                            <input
                                id="fotosAntes"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={seleccionarFotos}
                                disabled={guardando}
                                style={{
                                    display: "none"
                                }}
                            />


                            <p className="photo-upload-help">

                                Puedes agregar hasta 10 fotografías.
                                Formatos permitidos: JPG, PNG y WEBP.

                            </p>

                        </div>


                        {/* =================================================
                            PREVISUALIZACIÓN
                        ================================================= */}

                        {fotos.length > 0 && (

                            <div className="photo-preview-container">

                                <div className="photo-preview-title">

                                    <strong>
                                        Fotografías seleccionadas
                                    </strong>

                                    <span>
                                        {fotos.length}/10
                                    </span>

                                </div>


                                <div className="photo-preview-grid">

                                    {fotos.map(
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
                                                    alt={`Evidencia ${
                                                        index + 1
                                                    }`}
                                                />


                                                <button
                                                    type="button"
                                                    className="photo-remove-button"
                                                    onClick={() =>
                                                        eliminarFoto(
                                                            index
                                                        )
                                                    }
                                                    disabled={
                                                        guardando
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

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        INFORMACIÓN DEL INICIO
                    ================================================= */}

                    <section className="info-box">

                        <div className="info-box-icon">

                            <Wrench size={20} />

                        </div>


                        <div>

                            <strong>
                                El mantenimiento comenzará al crear
                                el ticket
                            </strong>


                            <p>

                                El sistema registrará automáticamente
                                la hora de inicio y colocará el ticket
                                en estado <strong>En proceso</strong>.

                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        BOTONES
                    ================================================= */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onVolver}
                            disabled={guardando}
                        >

                            Cancelar

                        </button>


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={guardando}
                        >

                            <Save size={18} />


                            {guardando
                                ? "Creando ticket..."
                                : "Crear ticket"}

                        </button>

                    </div>


                </form>

            </main>

        </div>

    );
}


export default NuevoTicket;