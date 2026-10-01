import {
    FormEvent,
    useEffect,
    useState
} from "react";

import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    ImagePlus,
    Trash2,
    Wrench
} from "lucide-react";

import {
    crearTicket,
    obtenerMaquinas,
    obtenerMecanicos,
    obtenerPrioridades,
    obtenerTiposMantenimiento,
    subirFotosTicket,
    obtenerUsuarioActual,
    Maquina,
    Mecanico,
    Prioridad,
    TipoMantenimiento
} from "../services/api";

interface ReportarProblemaQRProps {
    maquinaId: number;
    onVolver: () => void;
    onGuardado: () => void;
}

function ReportarProblemaQR({
    maquinaId,
    onVolver,
    onGuardado
}: ReportarProblemaQRProps) {

    const [maquina, setMaquina] =
        useState<Maquina | null>(null);

    const [mecanicos, setMecanicos] =
        useState<Mecanico[]>([]);

    const [prioridades, setPrioridades] =
        useState<Prioridad[]>([]);

    const [tiposMantenimiento, setTiposMantenimiento] =
        useState<TipoMantenimiento[]>([]);

    const [mecanicoId, setMecanicoId] =
        useState("");

    const [tipoMantenimientoId, setTipoMantenimientoId] =
        useState("");

    const [prioridadId, setPrioridadId] =
        useState("");

    const [problema, setProblema] =
        useState("");

    const [fotos, setFotos] =
        useState<File[]>([]);

    const [cargando, setCargando] =
        useState(true);

    const [guardando, setGuardando] =
        useState(false);

    const [error, setError] =
        useState("");

    const [exito, setExito] =
        useState("");

    const sesion =
        obtenerUsuarioActual();

    /*
     * =====================================================
     * CARGAR INFORMACIÓN
     * =====================================================
     */

    useEffect(() => {

        async function cargar() {

            try {

                setCargando(true);
                setError("");

                const [
                    maquinasData,
                    mecanicosData,
                    prioridadesData,
                    tiposData
                ] = await Promise.all([
                    obtenerMaquinas(),
                    obtenerMecanicos(),
                    obtenerPrioridades(),
                    obtenerTiposMantenimiento()
                ]);

                const maquinaEncontrada =
                    maquinasData.find(
                        m =>
                            m.MaquinaId ===
                            maquinaId
                    );

                if (!maquinaEncontrada) {

                    throw new Error(
                        "La máquina no existe o no está disponible."
                    );

                }

                setMaquina(
                    maquinaEncontrada
                );

                setMecanicos(
                    mecanicosData
                );

                setPrioridades(
                    prioridadesData
                );

                setTiposMantenimiento(
                    tiposData
                );

                /*
                 * Si es MECÁNICO,
                 * automáticamente utilizamos
                 * su MecanicoId.
                 */

                if (
                    sesion?.rol === "MECANICO" &&
                    sesion.mecanicoId
                ) {

                    setMecanicoId(
                        String(
                            sesion.mecanicoId
                        )
                    );

                }

            } catch (e) {

                console.error(e);

                setError(
                    e instanceof Error
                        ? e.message
                        : "No fue posible cargar la información."
                );

            } finally {

                setCargando(false);

            }

        }

        cargar();

    }, [maquinaId]);

    /*
     * =====================================================
     * FOTOS
     * =====================================================
     */

    function seleccionarFotos(
        event:
            React.ChangeEvent<HTMLInputElement>
    ) {

        const archivos =
            Array.from(
                event.target.files || []
            );

        if (
            archivos.length === 0
        ) {
            return;
        }

        const permitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        const validos =
            archivos.filter(
                archivo =>
                    permitidos.includes(
                        archivo.type
                    )
            );

        if (
            validos.length !==
            archivos.length
        ) {

            setError(
                "Solo se permiten imágenes JPG, PNG o WEBP."
            );

            return;
        }

        const combinadas = [
            ...fotos,
            ...validos
        ];

        if (
            combinadas.length > 10
        ) {

            setError(
                "Puedes agregar máximo 10 fotografías."
            );

            return;
        }

        setFotos(
            combinadas
        );

        setError("");

        event.target.value = "";

    }

    function eliminarFoto(
        indice: number
    ) {

        setFotos(
            actuales =>
                actuales.filter(
                    (_, i) =>
                        i !== indice
                )
        );

    }

    /*
     * =====================================================
     * CREAR TICKET
     * =====================================================
     */

    async function guardar(
        event: FormEvent
    ) {

        event.preventDefault();

        setError("");
        setExito("");

        if (!maquina) {
            setError(
                "No se pudo identificar la máquina."
            );
            return;
        }

        if (!mecanicoId) {

            setError(
                "No se pudo identificar el mecánico."
            );

            return;
        }

        if (!tipoMantenimientoId) {

            setError(
                "Selecciona el tipo de mantenimiento."
            );

            return;
        }

        if (!prioridadId) {

            setError(
                "Selecciona la prioridad."
            );

            return;
        }

        if (
            !problema.trim()
        ) {

            setError(
                "Describe el problema o incidencia."
            );

            return;
        }

        try {

            setGuardando(true);

            /*
             * =============================================
             * 1. CREAR TICKET
             * =============================================
             */

            const ticket =
                await crearTicket({

                    mecanicoId:
                        Number(
                            mecanicoId
                        ),

                    maquinaId:
                        maquina.MaquinaId,

                    tipoMantenimientoId:
                        Number(
                            tipoMantenimientoId
                        ),

                    prioridadId:
                        Number(
                            prioridadId
                        ),

                    observaciones:
                        problema.trim()

                });

            /*
             * =============================================
             * 2. FOTOS ANTES
             * =============================================
             */

            if (
                fotos.length > 0
            ) {

                await subirFotosTicket(
                    ticket.TicketId,
                    fotos,
                    "ANTES"
                );

            }

            /*
             * =============================================
             * 3. ÉXITO
             * =============================================
             */

            setExito(
                `Ticket ${ticket.NumeroTicket} creado correctamente.`
            );

            setTimeout(() => {

                onGuardado();

            }, 1500);

        } catch (e) {

            console.error(e);

            setError(
                e instanceof Error
                    ? e.message
                    : "No fue posible crear el ticket."
            );

        } finally {

            setGuardando(false);

        }

    }

    /*
     * =====================================================
     * CARGANDO
     * =====================================================
     */

    if (cargando) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc"
                }}
            >

                <div
                    style={{
                        textAlign: "center"
                    }}
                >

                    <Wrench size={35} />

                    <p>
                        Cargando información...
                    </p>

                </div>

            </div>

        );

    }

    /*
     * =====================================================
     * ERROR SIN MÁQUINA
     * =====================================================
     */

    if (!maquina) {

        return (

            <div
                style={{
                    padding: "40px",
                    textAlign: "center"
                }}
            >

                <h2>
                    No se encontró la máquina
                </h2>

                <p>
                    {error}
                </p>

                <button
                    onClick={onVolver}
                    style={{
                        padding:
                            "10px 18px"
                    }}
                >
                    Volver
                </button>

            </div>

        );

    }

    /*
     * =====================================================
     * PANTALLA
     * =====================================================
     */

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                paddingBottom: "40px"
            }}
        >

            {/* HEADER */}

            <header
                style={{
                    background: "#fff",
                    borderBottom:
                        "1px solid #e2e8f0",
                    padding:
                        "15px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px"
                }}
            >

                <button
                    type="button"
                    onClick={onVolver}
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        border:
                            "1px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer"
                    }}
                >

                    <ArrowLeft
                        size={19}
                    />

                </button>

                <div
                    style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "11px",
                        background: "#172033",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <Wrench size={22} />
                </div>

                <div>

                    <strong>
                        Reportar problema
                    </strong>

                    <span
                        style={{
                            display: "block",
                            fontSize: "13px",
                            color: "#64748b"
                        }}
                    >
                        Gestión de Mantenimiento
                    </span>

                </div>

            </header>

            <main
                style={{
                    width:
                        "min(850px, 94vw)",
                    margin:
                        "30px auto"
                }}
            >

                {/* MÁQUINA */}

                <section
                    style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "25px",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >

                    <div
                        style={{
                            fontSize: "13px",
                            color: "#64748b"
                        }}
                    >
                        MÁQUINA
                    </div>

                    <h1
                        style={{
                            margin:
                                "5px 0",
                            color: "#172033"
                        }}
                    >
                        {maquina.Nombre}
                    </h1>

                    <strong
                        style={{
                            color: "#2563eb"
                        }}
                    >
                        {maquina.Codigo}
                    </strong>

                    <div
                        style={{
                            marginTop: "10px",
                            color: "#64748b"
                        }}
                    >
                        {maquina.Ubicacion ||
                            "Sin ubicación registrada"}
                    </div>

                </section>

                {/* FORMULARIO */}

                <form
                    onSubmit={guardar}
                    style={{
                        marginTop: "20px",
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "25px",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >

                    {sesion?.rol ===
                        "ADMIN" && (

                        <div
                            style={{
                                marginBottom:
                                    "18px"
                            }}
                        >

                            <label>
                                Mecánico
                            </label>

                            <select
                                value={
                                    mecanicoId
                                }
                                onChange={e =>
                                    setMecanicoId(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    marginTop:
                                        "7px",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "9px",
                                    border:
                                        "1px solid #cbd5e1"
                                }}
                            >

                                <option value="">
                                    Selecciona un
                                    mecánico
                                </option>

                                {mecanicos.map(
                                    mecanico => (

                                        <option
                                            key={
                                                mecanico.MecanicoId
                                            }
                                            value={
                                                mecanico.MecanicoId
                                            }
                                        >
                                            {
                                                mecanico.Nombre
                                            }{" "}
                                            {
                                                mecanico.Apellido
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    )}

                    {sesion?.rol ===
                        "MECANICO" && (

                        <div
                            style={{
                                marginBottom:
                                    "18px",
                                padding:
                                    "13px 15px",
                                borderRadius:
                                    "10px",
                                background:
                                    "#f1f5f9"
                            }}
                        >

                            <strong>
                                Mecánico:
                            </strong>{" "}

                            {sesion.nombre ||
                                sesion.usuario}

                        </div>

                    )}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "18px"
                        }}
                    >

                        <div>

                            <label>
                                Tipo de mantenimiento
                            </label>

                            <select
                                value={
                                    tipoMantenimientoId
                                }
                                onChange={e =>
                                    setTipoMantenimientoId(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    marginTop:
                                        "7px",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "9px",
                                    border:
                                        "1px solid #cbd5e1"
                                }}
                            >

                                <option value="">
                                    Selecciona
                                </option>

                                {tiposMantenimiento.map(
                                    tipo => (

                                        <option
                                            key={
                                                tipo.TipoMantenimientoId
                                            }
                                            value={
                                                tipo.TipoMantenimientoId
                                            }
                                        >
                                            {
                                                tipo.Nombre
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                        <div>

                            <label>
                                Prioridad
                            </label>

                            <select
                                value={
                                    prioridadId
                                }
                                onChange={e =>
                                    setPrioridadId(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    marginTop:
                                        "7px",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "9px",
                                    border:
                                        "1px solid #cbd5e1"
                                }}
                            >

                                <option value="">
                                    Selecciona
                                </option>

                                {prioridades.map(
                                    prioridad => (

                                        <option
                                            key={
                                                prioridad.PrioridadId
                                            }
                                            value={
                                                prioridad.PrioridadId
                                            }
                                        >
                                            {
                                                prioridad.Nombre
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>

                    <div
                        style={{
                            marginTop:
                                "18px"
                        }}
                    >

                        <label>
                            Problema o incidencia
                        </label>

                        <textarea
                            value={
                                problema
                            }
                            onChange={e =>
                                setProblema(
                                    e.target.value
                                )
                            }
                            placeholder="Describe qué problema presenta la máquina..."
                            rows={6}
                            style={{
                                width: "100%",
                                marginTop:
                                    "7px",
                                padding:
                                    "12px",
                                borderRadius:
                                    "9px",
                                border:
                                    "1px solid #cbd5e1",
                                resize: "vertical",
                                boxSizing:
                                    "border-box"
                            }}
                        />

                    </div>

                    {/* FOTOS */}

                    <div
                        style={{
                            marginTop:
                                "20px"
                        }}
                    >

                        <label>
                            Fotografías ANTES
                        </label>

                        <div
                            style={{
                                marginTop:
                                    "8px",
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: "12px",
                                flexWrap:
                                    "wrap"
                            }}
                        >

                            <label
                                style={{
                                    display:
                                        "inline-flex",
                                    alignItems:
                                        "center",
                                    gap: "8px",
                                    padding:
                                        "11px 15px",
                                    borderRadius:
                                        "9px",
                                    background:
                                        "#eff6ff",
                                    color:
                                        "#1d4ed8",
                                    cursor:
                                        "pointer",
                                    fontWeight:
                                        600
                                }}
                            >

                                <ImagePlus
                                    size={18}
                                />

                                Agregar fotos

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    capture="environment"
                                    onChange={
                                        seleccionarFotos
                                    }
                                    style={{
                                        display:
                                            "none"
                                    }}
                                />

                            </label>

                            <span
                                style={{
                                    fontSize:
                                        "13px",
                                    color:
                                        "#64748b"
                                }}
                            >
                                Máximo 10
                                fotografías
                            </span>

                        </div>

                        {fotos.length >
                            0 && (

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(120px, 1fr))",
                                    gap:
                                        "12px",
                                    marginTop:
                                        "15px"
                                }}
                            >

                                {fotos.map(
                                    (
                                        foto,
                                        indice
                                    ) => (

                                        <div
                                            key={
                                                indice
                                            }
                                            style={{
                                                position:
                                                    "relative",
                                                borderRadius:
                                                    "10px",
                                                overflow:
                                                    "hidden",
                                                border:
                                                    "1px solid #e2e8f0"
                                            }}
                                        >

                                            <img
                                                src={
                                                    URL.createObjectURL(
                                                        foto
                                                    )
                                                }
                                                alt={
                                                    foto.name
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "110px",
                                                    objectFit:
                                                        "cover",
                                                    display:
                                                        "block"
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    eliminarFoto(
                                                        indice
                                                    )
                                                }
                                                style={{
                                                    position:
                                                        "absolute",
                                                    top:
                                                        "6px",
                                                    right:
                                                        "6px",
                                                    width:
                                                        "30px",
                                                    height:
                                                        "30px",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "50%",
                                                    background:
                                                        "#dc2626",
                                                    color:
                                                        "#fff",
                                                    cursor:
                                                        "pointer"
                                                }}
                                            >
                                                <Trash2
                                                    size={
                                                        15
                                                    }
                                                />
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                    {/* MENSAJES */}

                    {error && (

                        <div
                            style={{
                                marginTop:
                                    "20px",
                                padding:
                                    "13px 15px",
                                borderRadius:
                                    "9px",
                                background:
                                    "#fef2f2",
                                color:
                                    "#991b1b"
                            }}
                        >
                            {error}
                        </div>

                    )}

                    {exito && (

                        <div
                            style={{
                                marginTop:
                                    "20px",
                                padding:
                                    "15px",
                                borderRadius:
                                    "10px",
                                background:
                                    "#f0fdf4",
                                color:
                                    "#166534",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "10px"
                            }}
                        >

                            <CheckCircle2
                                size={20}
                            />

                            {exito}

                        </div>

                    )}

                    {/* BOTONES */}

                    <div
                        style={{
                            marginTop:
                                "25px",
                            display:
                                "flex",
                            justifyContent:
                                "flex-end",
                            gap: "10px"
                        }}
                    >

                        <button
                            type="button"
                            onClick={
                                onVolver
                            }
                            disabled={
                                guardando
                            }
                            style={{
                                padding:
                                    "12px 18px",
                                borderRadius:
                                    "9px",
                                border:
                                    "1px solid #cbd5e1",
                                background:
                                    "#fff",
                                cursor:
                                    "pointer"
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                guardando ||
                                !!exito
                            }
                            style={{
                                padding:
                                    "12px 20px",
                                borderRadius:
                                    "9px",
                                border:
                                    "none",
                                background:
                                    "#172033",
                                color:
                                    "#fff",
                                cursor:
                                    "pointer",
                                fontWeight:
                                    700
                            }}
                        >

                            <Camera
                                size={17}
                                style={{
                                    verticalAlign:
                                        "middle",
                                    marginRight:
                                        "7px"
                                }}
                            />

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

export default ReportarProblemaQR;