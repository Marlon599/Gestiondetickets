import {
    useEffect,
    useState
} from "react";

import {
    ArrowLeft,
    ClipboardList,
    MapPin,
    Wrench,
    AlertTriangle,
    RefreshCw
} from "lucide-react";

import {
    obtenerMaquinas,
    obtenerHistorialMaquina,
    Maquina,
    HistorialMaquina
} from "../services/api";

interface MaquinaQRProps {
    maquinaId: number;
    onVolver: () => void;
    onReportarProblema: () => void;
}

function MaquinaQR({
    maquinaId,
    onVolver,
    onReportarProblema
}: MaquinaQRProps) {

    const [maquina, setMaquina] =
        useState<Maquina | null>(null);

    const [historial, setHistorial] =
        useState<HistorialMaquina[]>([]);

    const [cargando, setCargando] =
        useState(true);

    const [cargandoHistorial, setCargandoHistorial] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
     * =====================================================
     * CARGAR MÁQUINA
     * =====================================================
     */

    async function cargarMaquina() {

        try {

            setCargando(true);
            setError("");

            const maquinas =
                await obtenerMaquinas();

            const encontrada =
                maquinas.find(
                    m =>
                        m.MaquinaId ===
                        maquinaId
                );

            if (!encontrada) {

                throw new Error(
                    "La máquina indicada por el código QR no existe o no está disponible."
                );

            }

            setMaquina(
                encontrada
            );

        } catch (e) {

            console.error(e);

            setError(
                e instanceof Error
                    ? e.message
                    : "No fue posible cargar la máquina."
            );

        } finally {

            setCargando(false);

        }

    }


    /*
     * =====================================================
     * CARGAR HISTORIAL
     * =====================================================
     */

    async function cargarHistorial() {

        if (!maquina) {
            return;
        }

        try {

            setCargandoHistorial(true);
            setError("");

            const datos =
                await obtenerHistorialMaquina(
                    maquina.MaquinaId
                );

            setHistorial(
                datos
            );

        } catch (e) {

            console.error(e);

            setError(
                e instanceof Error
                    ? e.message
                    : "No fue posible cargar el historial."
            );

        } finally {

            setCargandoHistorial(false);

        }

    }


    /*
     * =====================================================
     * CARGA INICIAL
     * =====================================================
     */

    useEffect(() => {

        cargarMaquina();

    }, [maquinaId]);


    /*
     * =====================================================
     * CARGAR HISTORIAL AL ENCONTRAR MÁQUINA
     * =====================================================
     */

    useEffect(() => {

        if (maquina) {

            cargarHistorial();

        }

    }, [maquina]);


    /*
     * =====================================================
     * FORMATO FECHA
     * =====================================================
     */

    function formatoFecha(
        fecha?: string | null
    ) {

        if (!fecha) {
            return "—";
        }

        return new Date(
            fecha
        ).toLocaleDateString(
            "es-GT",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    /*
     * =====================================================
     * PRIORIDAD
     * =====================================================
     */

    function clasePrioridad(
        prioridad?: string | null
    ) {

        const valor =
            (prioridad || "")
                .toLowerCase();

        if (
            valor === "crítica" ||
            valor === "critica"
        ) {

            return {
                background: "#fee2e2",
                color: "#991b1b"
            };

        }

        if (
            valor === "alta"
        ) {

            return {
                background: "#ffedd5",
                color: "#9a3412"
            };

        }

        if (
            valor === "media"
        ) {

            return {
                background: "#fef3c7",
                color: "#92400e"
            };

        }

        return {
            background: "#dcfce7",
            color: "#166534"
        };

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
                        textAlign: "center",
                        color: "#475569"
                    }}
                >

                    <RefreshCw
                        size={34}
                        style={{
                            animation:
                                "spin 1s linear infinite"
                        }}
                    />

                    <p>
                        Cargando información de la
                        máquina...
                    </p>

                </div>

            </div>

        );

    }


    /*
     * =====================================================
     * ERROR
     * =====================================================
     */

    if (
        error ||
        !maquina
    ) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc",
                    padding: "20px"
                }}
            >

                <div
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        background: "#fff",
                        borderRadius: "18px",
                        padding: "35px",
                        textAlign: "center",
                        boxShadow:
                            "0 10px 30px rgba(0,0,0,.08)"
                    }}
                >

                    <AlertTriangle
                        size={45}
                        color="#dc2626"
                    />

                    <h2>
                        No fue posible cargar
                        la máquina
                    </h2>

                    <p
                        style={{
                            color: "#64748b",
                            lineHeight: 1.6
                        }}
                    >
                        {error ||
                            "La máquina no está disponible."}
                    </p>

                    <button
                        type="button"
                        onClick={
                            onVolver
                        }
                        style={{
                            marginTop: "15px",
                            border: "none",
                            borderRadius: "10px",
                            padding:
                                "12px 20px",
                            background:
                                "#172033",
                            color: "#fff",
                            cursor: "pointer"
                        }}
                    >
                        Volver
                    </button>

                </div>

            </div>

        );

    }


    /*
     * =====================================================
     * PANTALLA PRINCIPAL
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
                    onClick={
                        onVolver
                    }
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        border:
                            "1px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
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

                    <Wrench
                        size={22}
                    />

                </div>


                <div>

                    <strong
                        style={{
                            display: "block",
                            fontSize: "17px",
                            color: "#172033"
                        }}
                    >
                        Gestión de Mantenimiento
                    </strong>

                    <span
                        style={{
                            fontSize: "13px",
                            color: "#64748b"
                        }}
                    >
                        Historial de máquina
                    </span>

                </div>

            </header>


            {/* CONTENIDO */}

            <main
                style={{
                    width:
                        "min(1000px, 94vw)",
                    margin:
                        "30px auto"
                }}
            >

                {/* INFORMACIÓN DE MÁQUINA */}

                <section
                    style={{
                        background: "#fff",
                        borderRadius: "18px",
                        padding: "28px",
                        boxShadow:
                            "0 5px 20px rgba(15,23,42,.06)",
                        border:
                            "1px solid #e2e8f0"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "flex-start",
                            gap: "20px",
                            flexWrap: "wrap"
                        }}
                    >

                        <div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems:
                                        "center",
                                    gap: "10px"
                                }}
                            >

                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize:
                                            "28px",
                                        color:
                                            "#172033"
                                    }}
                                >
                                    {
                                        maquina.Nombre
                                    }
                                </h1>


                                <span
                                    style={{
                                        padding:
                                            "5px 10px",
                                        borderRadius:
                                            "20px",
                                        background:
                                            maquina.Activo
                                                ? "#dcfce7"
                                                : "#fee2e2",
                                        color:
                                            maquina.Activo
                                                ? "#166534"
                                                : "#991b1b",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            700
                                    }}
                                >
                                    {
                                        maquina.Activo
                                            ? "ACTIVA"
                                            : "INACTIVA"
                                    }
                                </span>

                            </div>


                            <div
                                style={{
                                    marginTop: "8px",
                                    fontSize: "15px",
                                    color: "#64748b",
                                    fontWeight: 600
                                }}
                            >
                                {
                                    maquina.Codigo
                                }
                            </div>

                        </div>


                        <div
                            style={{
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: "8px",
                                color: "#64748b"
                            }}
                        >

                            <MapPin
                                size={18}
                            />

                            <span>
                                {
                                    maquina.Ubicacion ||
                                    "Ubicación no registrada"
                                }
                            </span>

                        </div>

                    </div>


                    {maquina.Descripcion && (

                        <div
                            style={{
                                marginTop: "20px",
                                paddingTop: "18px",
                                borderTop:
                                    "1px solid #e2e8f0",
                                color: "#475569",
                                lineHeight: 1.6
                            }}
                        >
                            {
                                maquina.Descripcion
                            }
                        </div>

                    )}

                </section>


                {/* HISTORIAL */}

                <section
                    style={{
                        marginTop: "20px",
                        background: "#fff",
                        borderRadius: "18px",
                        padding: "25px",
                        border:
                            "1px solid #e2e8f0",
                        boxShadow:
                            "0 5px 20px rgba(15,23,42,.05)"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: "15px",
                            marginBottom: "20px"
                        }}
                    >

                        <div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems:
                                        "center",
                                    gap: "10px"
                                }}
                            >

                                <ClipboardList
                                    size={24}
                                    color="#2563eb"
                                />

                                <h2
                                    style={{
                                        margin: 0,
                                        color:
                                            "#172033"
                                    }}
                                >
                                    Historial de
                                    mantenimiento
                                </h2>

                            </div>

                            <p
                                style={{
                                    margin:
                                        "7px 0 0",
                                    color:
                                        "#64748b",
                                    fontSize:
                                        "14px"
                                }}
                            >
                                Mantenimientos
                                registrados para
                                esta máquina.
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={
                                cargarHistorial
                            }
                            disabled={
                                cargandoHistorial
                            }
                            title="Actualizar historial"
                            style={{
                                width: "42px",
                                height: "42px",
                                border:
                                    "1px solid #e2e8f0",
                                background: "#fff",
                                borderRadius:
                                    "9px",
                                cursor:
                                    "pointer",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center"
                            }}
                        >

                            <RefreshCw
                                size={17}
                            />

                        </button>

                    </div>


                    {cargandoHistorial ? (

                        <div
                            style={{
                                padding:
                                    "35px",
                                textAlign:
                                    "center",
                                color:
                                    "#64748b"
                            }}
                        >
                            Cargando historial...
                        </div>

                    ) : historial.length === 0 ? (

                        <div
                            style={{
                                padding:
                                    "45px 20px",
                                textAlign:
                                    "center",
                                color:
                                    "#94a3b8"
                            }}
                        >

                            <ClipboardList
                                size={42}
                                style={{
                                    opacity: 0.4,
                                    marginBottom:
                                        "10px"
                                }}
                            />

                            <div>
                                No hay mantenimientos
                                registrados para
                                esta máquina.
                            </div>

                        </div>

                    ) : (

                        <div
                            style={{
                                overflowX:
                                    "auto"
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse"
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#f8fafc"
                                        }}
                                    >

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Ticket
                                        </th>

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Fecha
                                        </th>

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Mecánico
                                        </th>

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Mantenimiento
                                        </th>

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Prioridad
                                        </th>

                                        <th style={{
                                            padding:
                                                "12px",
                                            textAlign:
                                                "left"
                                        }}>
                                            Estado
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {historial.map(
                                        ticket => {

                                            const prioridad =
                                                clasePrioridad(
                                                    ticket.Prioridad
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        ticket.TicketId
                                                    }
                                                    style={{
                                                        borderTop:
                                                            "1px solid #e2e8f0"
                                                    }}
                                                >

                                                    <td style={{
                                                        padding:
                                                            "13px",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "#2563eb"
                                                    }}>
                                                        {
                                                            ticket.NumeroTicket
                                                        }
                                                    </td>


                                                    <td style={{
                                                        padding:
                                                            "13px",
                                                        color:
                                                            "#475569"
                                                    }}>
                                                        {
                                                            formatoFecha(
                                                                ticket.FechaReporte
                                                            )
                                                        }
                                                    </td>


                                                    <td style={{
                                                        padding:
                                                            "13px"
                                                    }}>
                                                        {
                                                            ticket.Mecanico ||
                                                            "—"
                                                        }
                                                    </td>


                                                    <td style={{
                                                        padding:
                                                            "13px"
                                                    }}>
                                                        {
                                                            ticket.TipoMantenimiento ||
                                                            "—"
                                                        }
                                                    </td>


                                                    <td style={{
                                                        padding:
                                                            "13px"
                                                    }}>

                                                        <span
                                                            style={{
                                                                ...prioridad,
                                                                padding:
                                                                    "5px 9px",
                                                                borderRadius:
                                                                    "20px",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    700
                                                            }}
                                                        >
                                                            {
                                                                ticket.Prioridad ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </td>


                                                    <td style={{
                                                        padding:
                                                            "13px"
                                                    }}>

                                                        <span
                                                            style={{
                                                                padding:
                                                                    "5px 9px",
                                                                borderRadius:
                                                                    "20px",
                                                                background:
                                                                    ticket.Estado ===
                                                                    "Finalizado"
                                                                        ? "#dcfce7"
                                                                        : "#fef3c7",
                                                                color:
                                                                    ticket.Estado ===
                                                                    "Finalizado"
                                                                        ? "#166534"
                                                                        : "#92400e",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    700
                                                            }}
                                                        >
                                                            {
                                                                ticket.Estado ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>

    );

}

export default MaquinaQR;