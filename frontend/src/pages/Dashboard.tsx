import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Wrench,
  ClipboardCheck,
  Eye,
  Activity,
  LogOut,
  Filter,
  Search,
  X,
  Users,
  Cog,
  Timer,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";

import * as XLSX from "xlsx-js-style";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import GenerarQR from "./GenerarQR";

import {
  obtenerTickets,
  Ticket,
  UsuarioSesion,
  obtenerMecanicosAdmin,
  crearMecanicoAdmin,
  actualizarMecanicoAdmin,
  cambiarEstadoMecanicoAdmin,
  obtenerMaquinasAdmin,
  crearMaquinaAdmin,
  actualizarMaquinaAdmin,
  cambiarEstadoMaquinaAdmin,
  obtenerHistorialMaquina,
  HistorialMaquina,
  obtenerEmpresasAdmin,
  obtenerPlantasAdmin,  
  obtenerAdministradoresAdmin,
  crearAdministradorAdmin,
  actualizarAdministradorAdmin,
  cambiarEstadoAdministradorAdmin

} from "../services/api";


interface DashboardProps {

  usuario: UsuarioSesion;

  onNuevoTicket: () => void;

  onActualizarTicket: (
    ticketId: number
  ) => void;

  onCerrarSesion: () => void;

}


function fechaLocalSinUTC(
  fecha: string
): Date | null {

  if (!fecha) {
    return null;
  }

  const valor = String(fecha).trim();

  /*
    SQL Server guarda la hora correctamente en Guatemala (-06:00),
    pero Node/JSON puede serializar un DATETIME como UTC terminado
    en "Z". Aquí quitamos esa conversión para mostrar exactamente
    la hora que viene de SQL Server.
  */
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
    const milisegundo = Number(
      (match[7] || "0").padEnd(3, "0").slice(0, 3)
    );

    const resultado = new Date(
      anio,
      mes - 1,
      dia,
      hora,
      minuto,
      segundo,
      milisegundo
    );

    if (!Number.isNaN(resultado.getTime())) {
      return resultado;
    }
  }

  const resultado = new Date(valor);

  return Number.isNaN(resultado.getTime())
    ? null
    : resultado;
}


function formatoFecha(
  fecha: string
) {

  const fechaLocal = fechaLocalSinUTC(fecha);

  if (!fechaLocal) {
    return "-";
  }

  return fechaLocal.toLocaleString(
    "es-GT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  );

}


function convertirHoraAMinutos(
  hora: string | null | undefined
): number | null {

  if (!hora) {
    return null;
  }

  const valor = String(hora).trim();

  /*
    Soporta tanto una hora SQL tipo:
    15:32:43.3700000

    como una fecha completa serializada por Node:
    2026-09-29T15:32:43.370Z
  */

  const matchHora = valor.match(
    /(?:T|\s)?(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?/
  );

  if (!matchHora) {
    return null;
  }

  const horas = Number(matchHora[1]);
  const minutos = Number(matchHora[2]);
  const segundos = Number(matchHora[3] || 0);

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59 ||
    segundos < 0 ||
    segundos > 59
  ) {
    return null;
  }

  return (
    horas * 60 +
    minutos +
    segundos / 60
  );
}


function calcularDuracionMinutos(
  horaInicio: string | null | undefined,
  horaFin: string | null | undefined
): number | null {

  const inicio = convertirHoraAMinutos(
    horaInicio
  );

  const fin = convertirHoraAMinutos(
    horaFin
  );

  if (
    inicio === null ||
    fin === null
  ) {
    return null;
  }

  let duracion = fin - inicio;

  /*
    Si el mantenimiento terminó después de medianoche,
    corregimos el cambio de día.
  */
  if (duracion < 0) {
    duracion += 24 * 60;
  }

  return duracion;
}






function MechanicDashboard({
  usuario,
  onNuevoTicket,
  onActualizarTicket,
  onCerrarSesion
}: DashboardProps) {


  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // CARGAR TICKETS
  // =====================================================

  async function cargarTickets() {

    try {

      setCargando(true);

      setError("");

      const data =
        await obtenerTickets();

      setTickets(data);

    } catch (error) {

      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los tickets."
      );

    } finally {

      setCargando(false);

    }

  }


  useEffect(() => {

    cargarTickets();

  }, []);


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const estadisticas = useMemo(() => {

    const pendientes =
      tickets.filter(
        ticket =>
          ticket.Estado === "Pendiente"
      ).length;


    const enProceso =
      tickets.filter(
        ticket =>
          ticket.Estado === "En proceso"
      ).length;


    const finalizados =
      tickets.filter(
        ticket =>
          ticket.Estado === "Finalizado"
      ).length;


    const criticos =
      tickets.filter(
        ticket =>
          ticket.Prioridad.toLowerCase() ===
            "crítica" ||

          ticket.Prioridad.toLowerCase() ===
            "critica"
      ).length;


    return {

      pendientes,

      enProceso,

      finalizados,

      criticos

    };

  }, [tickets]);


  // =====================================================
  // TICKETS RECIENTES
  // =====================================================

  const ticketsRecientes =
    tickets.slice(0, 8);


  // =====================================================
  // PRIORIDAD
  // =====================================================

  function clasePrioridad(
    prioridad: string
  ) {

    switch (
      prioridad.toLowerCase()
    ) {

      case "baja":

        return "priority-baja";


      case "media":

        return "priority-media";


      case "alta":

        return "priority-alta";


      case "crítica":

      case "critica":

        return "priority-critica";


      default:

        return "priority-default";

    }

  }


  // =====================================================
  // ESTADO
  // =====================================================

  function claseEstado(
    estado: string
  ) {

    switch (
      estado.toLowerCase()
    ) {

      case "pendiente":

        return "status-pendiente";


      case "en proceso":

        return "status-proceso";


      case "finalizado":

        return "status-finalizado";


      case "cancelado":

        return "status-cancelado";


      default:

        return "status-default";

    }

  }


  // =====================================================
  // FORMATO FECHA
  // =====================================================

  // =====================================================
  // ACCIÓN DEL TICKET
  // =====================================================

  function obtenerAccionTicket(
    ticket: Ticket
  ) {

    if (
      ticket.Estado ===
      "Finalizado"
    ) {

      return {

        icono:
          <Eye size={17} />,

        texto:
          "Ver ticket",

        clase:
          "ticket-action ticket-action-view"

      };

    }


    if (
      ticket.Estado ===
      "En proceso"
    ) {

      return {

        icono:
          <ClipboardCheck
            size={17}
          />,

        texto:
          "Finalizar mantenimiento",

        clase:
          "ticket-action ticket-action-finish"

      };

    }


    if (
      ticket.Estado ===
      "Pendiente"
    ) {

      return {

        icono:
          <Wrench size={17} />,

        texto:
          "Atender ticket",

        clase:
          "ticket-action ticket-action-start"

      };

    }


    return {

      icono:
        <Eye size={17} />,

      texto:
        "Ver ticket",

      clase:
        "ticket-action ticket-action-view"

    };

  }


  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {

    return (

      <div className="loading-page">

        <RefreshCw
          size={32}
          className="loading-icon"
        />

        <p>
          Cargando panel de mantenimiento...
        </p>

      </div>

    );

  }


  // =====================================================
  // DASHBOARD
  // =====================================================

  return (

    <div className="app-container">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="topbar">


        {/* MARCA */}

        <div className="brand">

          <div className="brand-icon">

            <Wrench size={25} />

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


        {/* ACCIONES / USUARIO */}

        <div
          className="topbar-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >


          {/* USUARIO */}

          <div
            className="topbar-user"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              lineHeight: 1.2
            }}
          >

            <strong
              style={{
                fontSize: "14px",
                color: "#0f172a"
              }}
            >

              {usuario.nombre ||
                usuario.usuario}

            </strong>


            <span
              style={{
                fontSize: "12px",
                color: "#64748b"
              }}
            >

              {usuario.rol === "ADMIN"
                ? "Administrador"
                : "Mecánico"}

            </span>

          </div>


          {/* ACTUALIZAR */}

          <button
            className="refresh-button"
            onClick={
              cargarTickets
            }
            title="Actualizar información"
          >

            <RefreshCw
              size={16}
            />

            Actualizar

          </button>


          {/* CERRAR SESIÓN */}

          <button
            className="refresh-button"
            onClick={
              onCerrarSesion
            }
            title="Cerrar sesión"
          >

            <LogOut
              size={16}
            />

            Cerrar sesión

          </button>

        </div>

      </header>


      <main className="dashboard-page">


        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div
          className="dashboard-header"
        >

          <div>

            <h2>
              Panel de mantenimiento
            </h2>

            <p>
              Resumen general de las
              actividades de mantenimiento.
            </p>

          </div>


          <button
            className="primary-button dashboard-new-button"
            onClick={
              onNuevoTicket
            }
          >

            <Plus size={18} />

            Nuevo ticket

          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="dashboard-alert"
          >

            <AlertTriangle
              size={18}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            TARJETAS
        ================================================= */}

        <section
          className="stats-grid"
        >


          {/* PENDIENTES */}

          <div
            className="stat-card stat-pending"
          >

            <div
              className="stat-card-top"
            >

              <div
                className="stat-icon"
              >

                <Clock3
                  size={22}
                />

              </div>

              <span
                className="stat-label"
              >
                Pendientes
              </span>

            </div>


            <div
              className="stat-value"
            >

              {estadisticas.pendientes}

            </div>


            <div
              className="stat-description"
            >

              Tickets esperando atención

            </div>

          </div>


          {/* EN PROCESO */}

          <div
            className="stat-card stat-process"
          >

            <div
              className="stat-card-top"
            >

              <div
                className="stat-icon"
              >

                <Wrench
                  size={22}
                />

              </div>

              <span
                className="stat-label"
              >
                En proceso
              </span>

            </div>


            <div
              className="stat-value"
            >

              {estadisticas.enProceso}

            </div>


            <div
              className="stat-description"
            >

              Mantenimientos actualmente activos

            </div>

          </div>


          {/* FINALIZADOS */}

          <div
            className="stat-card stat-completed"
          >

            <div
              className="stat-card-top"
            >

              <div
                className="stat-icon"
              >

                <CheckCircle2
                  size={22}
                />

              </div>

              <span
                className="stat-label"
              >
                Finalizados
              </span>

            </div>


            <div
              className="stat-value"
            >

              {estadisticas.finalizados}

            </div>


            <div
              className="stat-description"
            >

              Trabajos completados

            </div>

          </div>


          {/* CRÍTICOS */}

          <div
            className="stat-card stat-critical"
          >

            <div
              className="stat-card-top"
            >

              <div
                className="stat-icon"
              >

                <AlertTriangle
                  size={22}
                />

              </div>

              <span
                className="stat-label"
              >
                Críticos
              </span>

            </div>


            <div
              className="stat-value"
            >

              {estadisticas.criticos}

            </div>


            <div
              className="stat-description"
            >

              Tickets de prioridad crítica

            </div>

          </div>

        </section>


        {/* =================================================
            TABLA
        ================================================= */}

        <section
          className="tickets-section"
        >


          <div
            className="tickets-section-header"
          >

            <div
              className="section-heading"
            >

              <div
                className="section-heading-icon"
              >

                <FileText
                  size={19}
                />

              </div>


              <div>

                <h3>
                  Tickets recientes
                </h3>

                <p>
                  Últimos registros de mantenimiento
                </p>

              </div>

            </div>


            <div
              className="ticket-count"
            >

              {tickets.length}

              {" "}

              {tickets.length === 1
                ? "ticket"
                : "tickets"}

            </div>

          </div>


          {ticketsRecientes.length === 0 ? (

            <div
              className="empty-state"
            >

              <div
                className="empty-icon"
              >

                <FileText
                  size={28}
                />

              </div>


              <h3>
                No hay tickets registrados
              </h3>


              <p>
                Crea el primer ticket de
                mantenimiento para comenzar.
              </p>


              <button
                className="primary-button"
                onClick={
                  onNuevoTicket
                }
              >

                <Plus
                  size={18}
                />

                Crear primer ticket

              </button>

            </div>

          ) : (

            <div
              className="table-wrapper"
            >

              <table
                className="tickets-table"
              >

                <thead>

                  <tr>

                    <th>
                      Ticket
                    </th>

                    <th>
                      Máquina
                    </th>

                    <th>
                      Mecánico
                    </th>

                    <th>
                      Mantenimiento
                    </th>

                    <th>
                      Prioridad
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {ticketsRecientes.map(
                    ticket => (

                      <tr
                        key={
                          ticket.TicketId
                        }

                        className={
                          ticket.Estado ===
                          "En proceso"
                            ? "ticket-row-active"
                            : ""
                        }
                      >


                        {/* TICKET */}

                        <td>

                          <button
                            className="ticket-number"
                            onClick={() =>
                              onActualizarTicket(
                                ticket.TicketId
                              )
                            }
                          >

                            {
                              ticket.NumeroTicket
                            }

                          </button>

                        </td>


                        {/* MÁQUINA */}

                        <td>

                          <div
                            className="machine-cell"
                          >

                            <div
                              className="machine-icon"
                            >

                              <Wrench
                                size={16}
                              />

                            </div>


                            <div>

                              <strong>
                                {
                                  ticket.Maquina
                                }
                              </strong>

                              <span>
                                {
                                  ticket.CodigoMaquina
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* MECÁNICO */}

                        <td>

                          <span
                            className="mechanic-name"
                          >

                            {
                              ticket.Mecanico
                            }

                          </span>

                        </td>


                        {/* MANTENIMIENTO */}

                        <td>

                          <span
                            className="maintenance-type"
                          >

                            {
                              ticket.TipoMantenimiento
                            }

                          </span>

                        </td>


                        {/* PRIORIDAD */}

                        <td>

                          <span
                            className={
                              `priority-badge ${
                                clasePrioridad(
                                  ticket.Prioridad
                                )
                              }`
                            }
                          >

                            {
                              ticket.Prioridad
                            }

                          </span>

                        </td>


                        {/* ESTADO */}

                        <td>

                          <span
                            className={
                              `status-badge ${
                                claseEstado(
                                  ticket.Estado
                                )
                              }`
                            }
                          >

                            <span
                              className="status-dot"
                            />

                            {
                              ticket.Estado
                            }

                          </span>

                        </td>


                        {/* FECHA */}

                        <td>

                          <span
                            className="date-cell"
                          >

                            {
                              formatoFecha(
                                ticket.FechaReporte
                              )
                            }

                          </span>

                        </td>


                        {/* ACCIÓN */}

                        <td>

                          {(() => {

                            const accion =
                              obtenerAccionTicket(
                                ticket
                              );


                            return (

                              <button
                                className={
                                  accion.clase
                                }

                                onClick={() =>
                                  onActualizarTicket(
                                    ticket.TicketId
                                  )
                                }

                                title={
                                  accion.texto
                                }

                                aria-label={
                                  accion.texto
                                }
                              >

                                {
                                  accion.icono
                                }

                              </button>

                            );

                          })()}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* =================================================
            PIE DEL DASHBOARD
        ================================================= */}

        <div
          className="dashboard-footer"
        >

          <div>

            <Activity
              size={16}
            />

            <span>
              Sistema operativo
            </span>

          </div>


          <span>
            {tickets.length} registros cargados
          </span>

        </div>


      </main>

    </div>

  );

}



/* ============================================================
   ADMINISTRACIÓN
   ============================================================ */

type AdminSeccion =
  | "inicio"
  | "tickets"
  | "mecanicos"
  | "maquinas"
  | "administradores"
  | "reportes";

function AdminDashboard({
  usuario,
  onNuevoTicket,
  onActualizarTicket,
  onCerrarSesion
}: DashboardProps) {
  const [seccion, setSeccion] = useState<AdminSeccion>("inicio");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  // =====================================================
// ESTADO VISUAL DEL MECÁNICO
// =====================================================

function obtenerEstadoMecanico(mecanicoId: number) {
  const ticketEnProceso = tickets.find(
    ticket =>
      ticket.MecanicoId === mecanicoId &&
      ticket.Estado === "En proceso"
  );

  return ticketEnProceso;
}
  const [administradores, setAdministradores] = useState<any[]>([]);
const [empresasAdmin, setEmpresasAdmin] = useState<any[]>([]);
const [plantasAdmin, setPlantasAdmin] = useState<any[]>([]);

const [modalAdministrador, setModalAdministrador] =
  useState(false);

const [editandoAdministrador, setEditandoAdministrador] =
  useState<any | null>(null);

const [administradorForm, setAdministradorForm] =
  useState({
    Usuario: "",
    Password: "",
    Activo: true,
    EmpresaIds: [] as number[],
    PlantaIds: [] as number[]
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroMecanico, setFiltroMecanico] = useState("");
  const [filtroMaquina, setFiltroMaquina] = useState("");
  const [filtroMantenimiento, setFiltroMantenimiento] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  const [modalMecanico, setModalMecanico] = useState(false);
  const [modalMaquina, setModalMaquina] = useState(false);
  const [maquinaQR, setMaquinaQR] = useState<any | null>(null);

  const [editandoMecanico, setEditandoMecanico] = useState<any | null>(null);
  const [editandoMaquina, setEditandoMaquina] = useState<any | null>(null);

  const [guardando, setGuardando] = useState(false);

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [plantas, setPlantas] = useState<any[]>([]);

  const [mecanicoForm, setMecanicoForm] = useState({
    Nombre: "",
    Apellido: "",
    Usuario: "",
    Password: "",
    Activo: true,
    EmpresaIds: [] as number[],
    PlantaIds: [] as number[]
  });

  const [maquinaForm, setMaquinaForm] = useState({
    Codigo: "",
    Nombre: "",
    Ubicacion: "",
    Descripcion: "",
    Activo: true,
    EmpresaIds: [] as number[],
    PlantaIds: [] as number[]
  });

  const [maquinaHistorial, setMaquinaHistorial] =
    useState<HistorialMaquina[]>([]);

const [maquinaSeleccionada, setMaquinaSeleccionada] =
    useState<any | null>(null);

const [mostrarHistorial, setMostrarHistorial] =
    useState(false);

const [cargandoHistorial, setCargandoHistorial] =
    useState(false);

  async function cargarTodo() {
  try {
    setCargando(true);
    setError("");

    /*
     * Estos datos los pueden consultar tanto ADMIN
     * como SUPERADMIN.
     */
    const [
      ticketsData,
      mecanicosData,
      maquinasData,
      empresasData,
      plantasData
    ] = await Promise.all([
      obtenerTickets(),
      obtenerMecanicosAdmin(),
      obtenerMaquinasAdmin(),
      obtenerEmpresasAdmin(),
      obtenerPlantasAdmin()
    ]);

    setTickets(ticketsData);
    setMecanicos(mecanicosData);
    setMaquinas(maquinasData);

    setEmpresasAdmin(empresasData);
    setPlantasAdmin(plantasData);

    setEmpresas(empresasData);
    setPlantas(plantasData);

    /*
     * SOLO SUPERADMIN puede consultar y administrar
     * los usuarios administradores.
     *
     * El ADMIN no debe llamar este endpoint porque
     * el backend correctamente responde 403.
     */
    if (usuario.rol === "SUPERADMIN") {
      const administradoresData =
        await obtenerAdministradoresAdmin();

      setAdministradores(administradoresData);
    } else {
      /*
       * Para ADMIN dejamos la lista vacía.
       * No se realiza ninguna petición al endpoint
       * de administradores.
       */
      setAdministradores([]);
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

  useEffect(() => {
    cargarTodo();
  }, []);

  async function abrirHistorialMaquina(
    maquina: any
) {

    try {

        setMaquinaSeleccionada(maquina);

        setMostrarHistorial(true);

        setCargandoHistorial(true);

        setError("");

        const historial =
            await obtenerHistorialMaquina(
                maquina.MaquinaId
            );

        setMaquinaHistorial(historial);

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

function cerrarHistorialMaquina() {

    setMostrarHistorial(false);

    setMaquinaSeleccionada(null);

    setMaquinaHistorial([]);

}
  const estadisticas = useMemo(() => {
    const total = tickets.length;
    const pendientes = tickets.filter(t => t.Estado === "Pendiente").length;
    const proceso = tickets.filter(t => t.Estado === "En proceso").length;
    const finalizados = tickets.filter(t => t.Estado === "Finalizado").length;
    const cancelados = tickets.filter(t => t.Estado === "Cancelado").length;
    const criticos = tickets.filter(t =>
      ["crítica", "critica"].includes(
        (t.Prioridad || "").toLowerCase()
      )
    ).length;

    const porcentajeFinalizacion = total > 0
      ? Math.round((finalizados / total) * 100)
      : 0;

    const mecanicosActivos = mecanicos.filter(m => Boolean(m.Activo)).length;
    const mecanicosInactivos = mecanicos.length - mecanicosActivos;
    const maquinasActivas = maquinas.filter(m => Boolean(m.Activo)).length;
    const maquinasInactivas = maquinas.length - maquinasActivas;

    /*
      El backend entrega HoraInicio y HoraFin.
      No usamos FechaInicio/FechaFin porque esos campos
      no forman parte de la consulta actual de tickets.
    */
    const tiempos = tickets
      .filter(
        t =>
          t.Estado === "Finalizado" &&
          t.HoraInicio &&
          t.HoraFin
      )
      .map(t =>
        calcularDuracionMinutos(
          t.HoraInicio,
          t.HoraFin
        )
      )
      .filter(
        (minutos): minutos is number =>
          minutos !== null &&
          Number.isFinite(minutos) &&
          minutos >= 0
      );

    const promedioMinutos = tiempos.length > 0
      ? Math.round(
          tiempos.reduce(
            (a, b) => a + b,
            0
          ) / tiempos.length
        )
      : 0;

    return {
      total,
      pendientes,
      proceso,
      finalizados,
      cancelados,
      criticos,
      porcentajeFinalizacion,
      mecanicosActivos,
      mecanicosInactivos,
      maquinasActivas,
      maquinasInactivas,
      promedioMinutos
    };
  }, [tickets, mecanicos, maquinas]);


  function formatoDuracion(minutos: number) {
    if (!minutos) return "Sin datos";
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    if (horas === 0) return `${minutosRestantes} min`;
    if (minutosRestantes === 0) return `${horas} h`;
    return `${horas} h ${minutosRestantes} min`;
  }

const ticketsFiltrados = useMemo(() => {
  const texto = busqueda.trim().toLowerCase();

  return tickets.filter(ticket => {

    // ================================
    // BÚSQUEDA GENERAL
    // ================================

    if (texto) {
      const coincideTexto = [
        ticket.NumeroTicket,
        ticket.Maquina,
        ticket.CodigoMaquina,
        ticket.Mecanico,
        ticket.TipoMantenimiento,
        ticket.Prioridad,
        ticket.Estado
      ]
        .filter(Boolean)
        .some(valor =>
          String(valor)
            .toLowerCase()
            .includes(texto)
        );

      if (!coincideTexto) {
        return false;
      }
    }

    // ================================
    // MECÁNICO
    // ================================

    if (
      filtroMecanico &&
      ticket.Mecanico !== filtroMecanico
    ) {
      return false;
    }

    // ================================
    // MÁQUINA
    // ================================

    if (
      filtroMaquina &&
      ticket.Maquina !== filtroMaquina
    ) {
      return false;
    }

    // ================================
    // TIPO DE MANTENIMIENTO
    // ================================

    if (
      filtroMantenimiento &&
      ticket.TipoMantenimiento !== filtroMantenimiento
    ) {
      return false;
    }

    // ================================
    // PRIORIDAD
    // ================================

    if (
      filtroPrioridad &&
      ticket.Prioridad !== filtroPrioridad
    ) {
      return false;
    }

    // ================================
    // ESTADO
    // ================================

    if (
      filtroEstado &&
      ticket.Estado !== filtroEstado
    ) {
      return false;
    }

    // ================================
    // FECHA DESDE
    // ================================

    if (filtroFechaDesde && ticket.FechaReporte) {

      const fechaTicket =
        fechaLocalSinUTC(ticket.FechaReporte);

      const fechaDesde =
        new Date(`${filtroFechaDesde}T00:00:00`);

      if (
        fechaTicket &&
        fechaTicket < fechaDesde
      ) {
        return false;
      }
    }

    // ================================
    // FECHA HASTA
    // ================================

    if (filtroFechaHasta && ticket.FechaReporte) {

      const fechaTicket =
        fechaLocalSinUTC(ticket.FechaReporte);

      const fechaHasta =
        new Date(`${filtroFechaHasta}T23:59:59`);

      if (
        fechaTicket &&
        fechaTicket > fechaHasta
      ) {
        return false;
      }
    }

    return true;
  });

}, [
  tickets,
  busqueda,
  filtroMecanico,
  filtroMaquina,
  filtroMantenimiento,
  filtroPrioridad,
  filtroEstado,
  filtroFechaDesde,
  filtroFechaHasta
]);

function limpiarFiltros() {
  setBusqueda("");
  setFiltroMecanico("");
  setFiltroMaquina("");
  setFiltroMantenimiento("");
  setFiltroPrioridad("");
  setFiltroEstado("");
  setFiltroFechaDesde("");
  setFiltroFechaHasta("");
}


  const datosEstado = useMemo(() => [
    { name: "Pendientes", value: estadisticas.pendientes },
    { name: "En proceso", value: estadisticas.proceso },
    { name: "Finalizados", value: estadisticas.finalizados },
    { name: "Cancelados", value: estadisticas.cancelados }
  ].filter(item => item.value > 0), [estadisticas]);

  const datosPrioridad = useMemo(() => {
    const nombres = ["Baja", "Media", "Alta", "Crítica"];

    return nombres.map(nombre => ({
      name: nombre,
      cantidad: tickets.filter(t =>
        (t.Prioridad || "").toLowerCase() === nombre.toLowerCase()
      ).length
    }));
  }, [tickets]);

  const datosMecanicos = useMemo(() => {
    const mapa = new Map<string, number>();

    tickets.forEach(ticket => {
      const nombre = ticket.Mecanico || "Sin asignar";
      mapa.set(nombre, (mapa.get(nombre) || 0) + 1);
    });

    return Array.from(mapa.entries())
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [tickets]);

  const datosMaquinas = useMemo(() => {
    const mapa = new Map<string, number>();

    tickets.forEach(ticket => {
      const nombre = ticket.Maquina || "Sin máquina";
      mapa.set(nombre, (mapa.get(nombre) || 0) + 1);
    });

    return Array.from(mapa.entries())
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [tickets]);

  const datosMantenimiento = useMemo(() => {
    const mapa = new Map<string, number>();

    tickets.forEach(ticket => {
      const nombre = ticket.TipoMantenimiento || "Sin tipo";
      mapa.set(nombre, (mapa.get(nombre) || 0) + 1);
    });

    return Array.from(mapa.entries())
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [tickets]);

  const coloresEstado = [
    "#f59e0b",
    "#3b82f6",
    "#22c55e",
    "#ef4444"
  ];

  function alternarEmpresaSeleccionada(
  empresaId: number,
  tipo: "mecanico" | "maquina"
) {
  if (tipo === "mecanico") {
    const seleccionadas =
      mecanicoForm.EmpresaIds.includes(empresaId)
        ? mecanicoForm.EmpresaIds.filter(
            id => id !== empresaId
          )
        : [
            ...mecanicoForm.EmpresaIds,
            empresaId
          ];

    setMecanicoForm({
      ...mecanicoForm,
      EmpresaIds: seleccionadas
    });

    return;
  }

//CODIGO NUEVO
// =====================================================
// ESTADO VISUAL DE MECÁNICOS
// =====================================================

const obtenerEstadoMecanico = (mecanicoId: number) => {
    const ticketEnProceso = tickets.find(
        (ticket) =>
            ticket.MecanicoId === mecanicoId &&
            (
                ticket.Estado?.toLowerCase() === "en proceso" ||
                ticket.EstadoNombre?.toLowerCase() === "en proceso"
            )
    );

    if (ticketEnProceso) {
        return {
            ocupado: true,
            ticket: ticketEnProceso
        };
    }

    return {
        ocupado: false,
        ticket: null
    };
};

  const seleccionadas =
    maquinaForm.EmpresaIds.includes(empresaId)
      ? maquinaForm.EmpresaIds.filter(
          id => id !== empresaId
        )
      : [
          ...maquinaForm.EmpresaIds,
          empresaId
        ];

  setMaquinaForm({
    ...maquinaForm,
    EmpresaIds: seleccionadas
  });
}


  function alternarPlantaSeleccionada(
    plantaId: number,
    tipo: "mecanico" | "maquina"
  ) {
    if (tipo === "mecanico") {
      const seleccionadas = mecanicoForm.PlantaIds.includes(plantaId)
        ? mecanicoForm.PlantaIds.filter(id => id !== plantaId)
        : [...mecanicoForm.PlantaIds, plantaId];

      setMecanicoForm({
        ...mecanicoForm,
        PlantaIds: seleccionadas
      });

      return;
    }

    const seleccionadas = maquinaForm.PlantaIds.includes(plantaId)
      ? maquinaForm.PlantaIds.filter(id => id !== plantaId)
      : [...maquinaForm.PlantaIds, plantaId];

    setMaquinaForm({
      ...maquinaForm,
      PlantaIds: seleccionadas
    });
  }

 function plantasDisponiblesParaForm(
  form: { EmpresaIds: number[] }
) {
  if (form.EmpresaIds.length === 0) {
    return [];
  }

  return plantas;
}

  function abrirNuevoMecanico() {
    setEditandoMecanico(null);
    setMecanicoForm({
      Nombre: "",
      Apellido: "",
      Usuario: "",
      Password: "",
      Activo: true,
      EmpresaIds: [],
      PlantaIds: []
    });
    setModalMecanico(true);
  }

  function abrirEditarMecanico(m: any) {
    setEditandoMecanico(m);
    setMecanicoForm({
      Nombre: m.Nombre || "",
      Apellido: m.Apellido || "",
      Usuario: m.Usuario || "",
      Password: "",
      Activo: Boolean(m.Activo),
      EmpresaIds: Array.isArray(m.EmpresaIds)
        ? m.EmpresaIds.map(Number)
        : m.EmpresaId != null
          ? [Number(m.EmpresaId)]
          : [],
      PlantaIds: Array.isArray(m.PlantaIds)
        ? m.PlantaIds.map(Number)
        : m.PlantaId != null
          ? [Number(m.PlantaId)]
          : []
    });
    setModalMecanico(true);
  }

  async function guardarMecanico(e: FormEvent) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");

      if (mecanicoForm.EmpresaIds.length === 0) {
        setError("Debes seleccionar al menos una empresa.");
        setGuardando(false);
        return;
      }

      if (mecanicoForm.PlantaIds.length === 0) {
        setError("Debes seleccionar al menos una planta.");
        setGuardando(false);
        return;
      }

      if (editandoMecanico) {
        await actualizarMecanicoAdmin(
          editandoMecanico.MecanicoId,
          mecanicoForm as any
        );
      } else {
        await crearMecanicoAdmin(mecanicoForm as any);
      }

      setModalMecanico(false);
      await cargarTodo();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible guardar el mecánico."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoMecanico(m: any) {
    const accion = m.Activo ? "desactivar" : "activar";

    if (!window.confirm(`¿Deseas ${accion} a ${m.Nombre} ${m.Apellido}?`)) {
      return;
    }

    try {
      setError("");
      await cambiarEstadoMecanicoAdmin(
        m.MecanicoId,
        !Boolean(m.Activo)
      );
      await cargarTodo();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible cambiar el estado."
      );
    }
  }

  function abrirNuevaMaquina() {
    setEditandoMaquina(null);
    setMaquinaForm({
      Codigo: "",
      Nombre: "",
      Ubicacion: "",
      Descripcion: "",
      Activo: true,
      EmpresaIds: [],
      PlantaIds: []
    });
    setModalMaquina(true);
  }

  function abrirEditarMaquina(m: any) {
    setEditandoMaquina(m);
    setMaquinaForm({
      Codigo: m.Codigo || "",
      Nombre: m.Nombre || "",
      Ubicacion: m.Ubicacion || "",
      Descripcion: m.Descripcion || "",
      Activo: Boolean(m.Activo),
      EmpresaIds: Array.isArray(m.EmpresaIds)
        ? m.EmpresaIds.map(Number)
        : m.EmpresaId != null
          ? [Number(m.EmpresaId)]
          : [],
      PlantaIds: Array.isArray(m.PlantaIds)
        ? m.PlantaIds.map(Number)
        : m.PlantaId != null
          ? [Number(m.PlantaId)]
          : []
    });
    setModalMaquina(true);
  }

  async function guardarMaquina(e: FormEvent) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");

      if (maquinaForm.EmpresaIds.length === 0) {
        setError("Debes seleccionar al menos una empresa.");
        setGuardando(false);
        return;
      }

      if (maquinaForm.PlantaIds.length === 0) {
        setError("Debes seleccionar al menos una planta.");
        setGuardando(false);
        return;
      }

      if (editandoMaquina) {
        await actualizarMaquinaAdmin(
          editandoMaquina.MaquinaId,
          maquinaForm as any
        );
      } else {
        await crearMaquinaAdmin(maquinaForm as any);
      }

      setModalMaquina(false);
      await cargarTodo();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible guardar la máquina."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoMaquina(m: any) {
    const accion = m.Activo ? "desactivar" : "activar";

    if (!window.confirm(`¿Deseas ${accion} la máquina ${m.Nombre}?`)) {
      return;
    }

    try {
      setError("");
      await cambiarEstadoMaquinaAdmin(
        m.MaquinaId,
        !Boolean(m.Activo)
      );
      await cargarTodo();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No fue posible cambiar el estado."
      );
    }
  }

    // =====================================================
  // ADMINISTRADORES CREAR
  // =====================================================

  function abrirNuevoAdministrador() {
  setEditandoAdministrador(null);

  setAdministradorForm({
    Usuario: "",
    Password: "",
    Activo: true,
    EmpresaIds: [],
    PlantaIds: []
  });

  setModalAdministrador(true);
}


function abrirEditarAdministrador(
  administrador: any
) {
  setEditandoAdministrador(administrador);

  setAdministradorForm({
    Usuario:
      administrador.Usuario || "",

    Password: "",

    Activo:
      Boolean(administrador.Activo),

    EmpresaIds:
      Array.isArray(administrador.EmpresaIds)
        ? administrador.EmpresaIds.map(Number)
        : [],

    PlantaIds:
      Array.isArray(administrador.PlantaIds)
        ? administrador.PlantaIds.map(Number)
        : []
  });

  setModalAdministrador(true);
}


function cambiarEmpresaAdministrador(
  empresaId: number
) {
  setAdministradorForm(actual => {

    const existe =
      actual.EmpresaIds.includes(empresaId);

    const nuevasEmpresas = existe
      ? actual.EmpresaIds.filter(
          id => id !== empresaId
        )
      : [
          ...actual.EmpresaIds,
          empresaId
        ];

    /*
     * Las plantas se mantienen por ahora.
     * La selección de plantas se validará
     * posteriormente contra las empresas.
     */
    return {
      ...actual,
      EmpresaIds: nuevasEmpresas
    };
  });
}


function cambiarPlantaAdministrador(
  plantaId: number
) {
  setAdministradorForm(actual => {

    const existe =
      actual.PlantaIds.includes(plantaId);

    return {
      ...actual,

      PlantaIds: existe
        ? actual.PlantaIds.filter(
            id => id !== plantaId
          )
        : [
            ...actual.PlantaIds,
            plantaId
          ]
    };
  });
}


async function guardarAdministrador(
  e: FormEvent
) {
  e.preventDefault();

  try {

    setGuardando(true);
    setError("");

    if (
      administradorForm.EmpresaIds.length === 0
    ) {
      setError(
        "Debes seleccionar al menos una empresa."
      );
      return;
    }

    if (
      administradorForm.PlantaIds.length === 0
    ) {
      setError(
        "Debes seleccionar al menos una planta."
      );
      return;
    }


    if (editandoAdministrador) {

      await actualizarAdministradorAdmin(
        editandoAdministrador.UsuarioId,
        administradorForm
      );

    } else {

      if (
        !administradorForm.Password.trim()
      ) {
        setError(
          "La contraseña es obligatoria."
        );
        return;
      }

      await crearAdministradorAdmin(
        administradorForm
      );
    }


    setModalAdministrador(false);

    setEditandoAdministrador(null);

    await cargarTodo();

  } catch (e) {

    console.error(e);

    setError(
      e instanceof Error
        ? e.message
        : "No fue posible guardar el administrador."
    );

  } finally {

    setGuardando(false);
  }
}


async function cambiarEstadoAdministrador(
  administrador: any
) {

  const accion =
    administrador.Activo
      ? "desactivar"
      : "activar";

  if (
    !window.confirm(
      `¿Deseas ${accion} al administrador "${administrador.Usuario}"?`
    )
  ) {
    return;
  }


  try {

    setError("");

    await cambiarEstadoAdministradorAdmin(
      administrador.UsuarioId,
      !Boolean(administrador.Activo)
    );

    await cargarTodo();

  } catch (e) {

    console.error(e);

    setError(
      e instanceof Error
        ? e.message
        : "No fue posible cambiar el estado."
    );
  }
}

  // =====================================================
  // REPORTES - EXCEL
  // =====================================================

  function exportarReporteExcel() {
    if (ticketsFiltrados.length === 0) {
      return;
    }

    const fechaActual = new Date();
    const total = ticketsFiltrados.length;
    const pendientes = ticketsFiltrados.filter(t => t.Estado === "Pendiente").length;
    const proceso = ticketsFiltrados.filter(t => t.Estado === "En proceso").length;
    const finalizados = ticketsFiltrados.filter(t => t.Estado === "Finalizado").length;
    const cancelados = ticketsFiltrados.filter(t => t.Estado === "Cancelado").length;
    const criticos = ticketsFiltrados.filter(t =>
      ["crítica", "critica"].includes((t.Prioridad || "").toLowerCase())
    ).length;

    const porcentajeFinalizados = total
      ? Math.round((finalizados / total) * 100)
      : 0;

    const rangoFecha = filtroFechaDesde || filtroFechaHasta
      ? `${filtroFechaDesde || "Inicio"} al ${filtroFechaHasta || "Actual"}`
      : "Todos los registros";

    const hojaResumen = XLSX.utils.aoa_to_sheet([
      ["GESTIÓN DE MANTENIMIENTO"],
      ["REPORTE GENERAL DE TICKETS"],
      [],
      ["Período", rangoFecha],
      ["Generado", fechaActual.toLocaleString("es-GT")],
      [],
      ["INDICADORES"],
      ["Indicador", "Cantidad", "Porcentaje"],
      ["Total de tickets", total, "100%"],
      ["Pendientes", pendientes, `${total ? Math.round((pendientes / total) * 100) : 0}%`],
      ["En proceso", proceso, `${total ? Math.round((proceso / total) * 100) : 0}%`],
      ["Finalizados", finalizados, `${porcentajeFinalizados}%`],
      ["Cancelados", cancelados, `${total ? Math.round((cancelados / total) * 100) : 0}%`],
      ["Prioridad crítica", criticos, `${total ? Math.round((criticos / total) * 100) : 0}%`]
    ]);

    hojaResumen["!cols"] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 18 }
    ];

    hojaResumen["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } }
    ];

    const detalle = ticketsFiltrados.map(ticket => ({
      Ticket: ticket.NumeroTicket || "",
      Fecha: ticket.FechaReporte
        ? new Date(ticket.FechaReporte).toLocaleDateString("es-GT")
        : "",
      HoraInicio: ticket.HoraInicio || "",
      HoraFin: ticket.HoraFin || "",
      Maquina: ticket.Maquina || "",
      CodigoMaquina: ticket.CodigoMaquina || "",
      Mecanico: ticket.Mecanico || "",
      Mantenimiento: ticket.TipoMantenimiento || "",
      Prioridad: ticket.Prioridad || "",
      Estado: ticket.Estado || "",
      TrabajoRealizado: ticket.TrabajoRealizado || "",
      Observaciones: ticket.Observaciones || ""
    }));

    const hojaDetalle = XLSX.utils.json_to_sheet(detalle);
    hojaDetalle["!cols"] = [
      { wch: 16 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 24 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
      { wch: 46 },
      { wch: 46 }
    ];

    const encabezado = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    };

    const titulo = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 18 },
      fill: { fgColor: { rgb: "17365D" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const subtitulo = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    ["A1", "A2", "A7"].forEach(celda => {
      hojaResumen[celda].s = celda === "A1" ? titulo : subtitulo;
    });

    ["A8", "B8", "C8"].forEach(celda => {
      hojaResumen[celda].s = encabezado;
    });

    for (let fila = 9; fila <= 14; fila++) {
      hojaResumen[`A${fila}`].s = {
        font: { bold: fila === 9 },
        alignment: { vertical: "center" }
      };
      hojaResumen[`B${fila}`].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center" }
      };
      hojaResumen[`C${fila}`].s = {
        alignment: { horizontal: "center" }
      };
    }

    const ultimaColumna = "L";
    hojaDetalle["!autofilter"] = { ref: `A1:${ultimaColumna}${detalle.length + 1}` };
    hojaDetalle["!freeze"] = { xSplit: 0, ySplit: 1 };

    for (let col = 0; col < 12; col++) {
      const letra = String.fromCharCode(65 + col);
      hojaDetalle[`${letra}1`].s = encabezado;
    }

    const prioridadColor = (valor: string) => {
      const p = valor.toLowerCase();
      if (p === "crítica" || p === "critica") return "F4CCCC";
      if (p === "alta") return "FCE5CD";
      if (p === "media") return "FFF2CC";
      return "D9EAD3";
    };

    const estadoColor = (valor: string) => {
      const e = valor.toLowerCase();
      if (e === "finalizado") return "D9EAD3";
      if (e === "en proceso") return "CFE2F3";
      if (e === "pendiente") return "FFF2CC";
      if (e === "cancelado") return "E6E6E6";
      return "FFFFFF";
    };

    for (let fila = 2; fila <= detalle.length + 1; fila++) {
      hojaDetalle[`I${fila}`].s = {
        fill: { fgColor: { rgb: prioridadColor(String(hojaDetalle[`I${fila}`]?.v || "")) } },
        font: { bold: true },
        alignment: { horizontal: "center" }
      };
      hojaDetalle[`J${fila}`].s = {
        fill: { fgColor: { rgb: estadoColor(String(hojaDetalle[`J${fila}`]?.v || "")) } },
        font: { bold: true },
        alignment: { horizontal: "center" }
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, hojaResumen, "Resumen");
    XLSX.utils.book_append_sheet(workbook, hojaDetalle, "Detalle");

    const fechaArchivo = fechaActual.toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Reporte_Mantenimiento_${fechaArchivo}.xlsx`);
  }

  // =====================================================
  // REPORTES - PDF
  // =====================================================

  function exportarReportePDF() {
    if (ticketsFiltrados.length === 0) {
      return;
    }

    const fechaActual = new Date();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const total = ticketsFiltrados.length;
    const pendientes = ticketsFiltrados.filter(t => t.Estado === "Pendiente").length;
    const proceso = ticketsFiltrados.filter(t => t.Estado === "En proceso").length;
    const finalizados = ticketsFiltrados.filter(t => t.Estado === "Finalizado").length;
    const cancelados = ticketsFiltrados.filter(t => t.Estado === "Cancelado").length;
    const criticos = ticketsFiltrados.filter(t =>
      ["crítica", "critica"].includes((t.Prioridad || "").toLowerCase())
    ).length;

    const rangoFecha = filtroFechaDesde || filtroFechaHasta
      ? `${filtroFechaDesde || "Inicio"} al ${filtroFechaHasta || "Actual"}`
      : "Todos los registros";

    doc.setFillColor(23, 54, 93);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("GESTIÓN DE MANTENIMIENTO", 14, 13);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte general de tickets", 14, 21);
    doc.text(`Generado: ${fechaActual.toLocaleString("es-GT")}`, 205, 13);
    doc.text(`Período: ${rangoFecha}`, 205, 21);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RESUMEN", 14, 41);

    const indicadores = [
      ["Total", total],
      ["Pendientes", pendientes],
      ["En proceso", proceso],
      ["Finalizados", finalizados],
      ["Cancelados", cancelados],
      ["Críticos", criticos]
    ];

    const ancho = 43;
    indicadores.forEach(([nombre, valor], index) => {
      const x = 14 + index * 46;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(x, 45, ancho, 20, 2, 2, "F");
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(String(nombre), x + 4, 52);
      doc.setTextColor(23, 54, 93);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(String(valor), x + 4, 61);
    });

    const filas = ticketsFiltrados.map(ticket => [
      ticket.NumeroTicket || "-",
      ticket.FechaReporte
        ? new Date(ticket.FechaReporte).toLocaleDateString("es-GT")
        : "-",
      ticket.Maquina || "-",
      ticket.Mecanico || "-",
      ticket.TipoMantenimiento || "-",
      ticket.Prioridad || "-",
      ticket.Estado || "-",
      ticket.HoraInicio || "-",
      ticket.HoraFin || "-"
    ]);

    autoTable(doc, {
      startY: 72,
      head: [[
        "Ticket",
        "Fecha",
        "Máquina",
        "Mecánico",
        "Mantenimiento",
        "Prioridad",
        "Estado",
        "Inicio",
        "Fin"
      ]],
      body: filas,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "middle"
      },
      headStyles: {
        fillColor: [31, 78, 121],
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 34 },
        3: { cellWidth: 31 },
        4: { cellWidth: 30 },
        5: { cellWidth: 22 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 }
      },
      didParseCell: data => {
        if (data.section !== "body") return;

        if (data.column.index === 5) {
          const valor = String(data.cell.raw || "").toLowerCase();
          if (valor === "crítica" || valor === "critica") {
            data.cell.styles.fillColor = [244, 204, 204];
          } else if (valor === "alta") {
            data.cell.styles.fillColor = [252, 229, 205];
          } else if (valor === "media") {
            data.cell.styles.fillColor = [255, 242, 204];
          } else {
            data.cell.styles.fillColor = [217, 234, 211];
          }
        }

        if (data.column.index === 6) {
          const valor = String(data.cell.raw || "").toLowerCase();
          if (valor === "finalizado") data.cell.styles.fillColor = [217, 234, 211];
          if (valor === "en proceso") data.cell.styles.fillColor = [207, 226, 243];
          if (valor === "pendiente") data.cell.styles.fillColor = [255, 242, 204];
        }
      },
      didDrawPage: data => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text("Gestión de Mantenimiento", 14, pageHeight - 8);
        doc.text(`Página ${data.pageNumber}`, pageWidth - 30, pageHeight - 8);
      }
    });

    const fechaArchivo = fechaActual.toISOString().slice(0, 10);
    doc.save(`Reporte_Mantenimiento_${fechaArchivo}.pdf`);
  }



  function claseEstadoAdmin(estado: string) {
    switch ((estado || "").toLowerCase()) {
      case "pendiente":
        return "status-pendiente";
      case "en proceso":
        return "status-proceso";
      case "finalizado":
        return "status-finalizado";
      case "cancelado":
        return "status-cancelado";
      default:
        return "status-default";
    }
  }

  function clasePrioridadAdmin(prioridad: string) {
    switch ((prioridad || "").toLowerCase()) {
      case "baja":
        return "priority-baja";
      case "media":
        return "priority-media";
      case "alta":
        return "priority-alta";
      case "crítica":
      case "critica":
        return "priority-critica";
      default:
        return "priority-default";
    }
  }

  if (cargando) {
    return (
      <div className="loading-page">
        <RefreshCw size={32} className="loading-icon" />
        <p>Cargando panel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Wrench size={25} />
          </div>
          <div>
            <h1>Gestión de Mantenimiento</h1>
            <span>Panel administrativo</span>
          </div>
        </div>

        <div className="mnt-admin-userbar">
          <div className="mnt-admin-user">
            <strong>{usuario.usuario}</strong>
            <span>Administrador</span>
          </div>

          <button
            className="refresh-button"
            onClick={cargarTodo}
            title="Actualizar información"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>

          <button
            className="refresh-button"
            onClick={onCerrarSesion}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mnt-admin-layout">
        <aside className="mnt-admin-sidebar">
          <button
            className={seccion === "inicio" ? "mnt-admin-nav active" : "mnt-admin-nav"}
            onClick={() => setSeccion("inicio")}
          >
            <Activity size={18} />
            Inicio
          </button>

          <button
            className={seccion === "tickets" ? "mnt-admin-nav active" : "mnt-admin-nav"}
            onClick={() => setSeccion("tickets")}
          >
            <FileText size={18} />
            Tickets
          </button>

          <button
            className={seccion === "mecanicos" ? "mnt-admin-nav active" : "mnt-admin-nav"}
            onClick={() => setSeccion("mecanicos")}
          >
            <Wrench size={18} />
            Mecánicos
          </button>

          <button
            className={seccion === "maquinas" ? "mnt-admin-nav active" : "mnt-admin-nav"}
            onClick={() => setSeccion("maquinas")}
          >
            <ClipboardCheck size={18} />
            Máquinas
          </button>
          {usuario.rol === "SUPERADMIN" && (
  <button
    className={
      seccion === "administradores"
        ? "mnt-admin-nav active"
        : "mnt-admin-nav"
    }
    onClick={() =>
      setSeccion("administradores")
    }
  >
    <Users size={18} />
    Administradores
  </button>
)}

          <button
            className={seccion === "reportes" ? "mnt-admin-nav active" : "mnt-admin-nav"}
            onClick={() => setSeccion("reportes")}
          >
            <FileSpreadsheet size={18} />
            Reportes
          </button>

          <button
            className="mnt-admin-nav"
            onClick={onNuevoTicket}
          >
            <Plus size={18} />
            Nuevo ticket
          </button>
        </aside>

        <main className="mnt-admin-main">
          {error && (
            <div className="dashboard-alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {seccion === "inicio" && (
            <>
              <div className="mnt-admin-page-header">
                <div>
                  <h2>Inicio</h2>
                  <p>Resumen general del mantenimiento.</p>
                </div>

                <button
                  className="refresh-button"
                  onClick={cargarTodo}
                >
                  <RefreshCw size={17} />
                  Actualizar datos
                </button>
              </div>

              <section className="mnt-admin-stats mnt-admin-stats-enhanced">
                <div className="mnt-admin-stat mnt-admin-stat-primary">
                  <div className="mnt-admin-stat-icon"><FileText size={20} /></div>
                  <div>
                    <span>Total tickets</span>
                    <strong>{estadisticas.total}</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-warning">
                  <div className="mnt-admin-stat-icon"><Clock3 size={20} /></div>
                  <div>
                    <span>Pendientes</span>
                    <strong>{estadisticas.pendientes}</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-info">
                  <div className="mnt-admin-stat-icon"><Wrench size={20} /></div>
                  <div>
                    <span>En proceso</span>
                    <strong>{estadisticas.proceso}</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-success">
                  <div className="mnt-admin-stat-icon"><CheckCircle2 size={20} /></div>
                  <div>
                    <span>Finalizados</span>
                    <strong>{estadisticas.finalizados}</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-danger">
                  <div className="mnt-admin-stat-icon"><AlertTriangle size={20} /></div>
                  <div>
                    <span>Críticos</span>
                    <strong>{estadisticas.criticos}</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-purple">
                  <div className="mnt-admin-stat-icon"><TrendingUp size={20} /></div>
                  <div>
                    <span>Finalización</span>
                    <strong>{estadisticas.porcentajeFinalizacion}%</strong>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-teal">
                  <div className="mnt-admin-stat-icon"><Users size={20} /></div>
                  <div>
                    <span>Mecánicos activos</span>
                    <strong>{estadisticas.mecanicosActivos}</strong>
                    <small>{estadisticas.mecanicosInactivos} inactivos</small>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-indigo">
                  <div className="mnt-admin-stat-icon"><Cog size={20} /></div>
                  <div>
                    <span>Máquinas activas</span>
                    <strong>{estadisticas.maquinasActivas}</strong>
                    <small>{estadisticas.maquinasInactivas} inactivas</small>
                  </div>
                </div>

                <div className="mnt-admin-stat mnt-admin-stat-dark">
                  <div className="mnt-admin-stat-icon"><Timer size={20} /></div>
                  <div>
                    <span>Tiempo promedio</span>
                    <strong>{formatoDuracion(estadisticas.promedioMinutos)}</strong>
                    <small>tickets finalizados</small>
                  </div>
                </div>
              </section>

              <section className="mnt-admin-chart-grid">
                <div className="mnt-admin-chart-card">
                  <div className="mnt-admin-chart-header">
                    <div>
                      <h3>Tickets por estado</h3>
                      <p>Distribución actual de los mantenimientos</p>
                    </div>
                  </div>

                  <div className="mnt-admin-chart">
                    {datosEstado.length === 0 ? (
                      <div className="mnt-admin-chart-empty">
                        No hay tickets para mostrar.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datosEstado}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={105}
                            innerRadius={55}
                            paddingAngle={3}
                          >
                            {datosEstado.map((_, index) => (
                              <Cell
                                key={`estado-${index}`}
                                fill={coloresEstado[index % coloresEstado.length]}
                              />
                            ))}
                          </Pie>

                          <Tooltip />

                          <Legend
                            verticalAlign="bottom"
                            height={36}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="mnt-admin-chart-card">
                  <div className="mnt-admin-chart-header">
                    <div>
                      <h3>Tickets por prioridad</h3>
                      <p>Cantidad de incidencias según prioridad</p>
                    </div>
                  </div>

                  <div className="mnt-admin-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosPrioridad}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="cantidad"
                          name="Tickets"
                          fill="#2563eb"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="mnt-admin-chart-grid">
                <div className="mnt-admin-chart-card">
                  <div className="mnt-admin-chart-header">
                    <div>
                      <h3>Mantenimientos por mecánico</h3>
                      <p>Top 8 mecánicos con más tickets</p>
                    </div>
                  </div>

                  <div className="mnt-admin-chart mnt-admin-chart-large">
                    {datosMecanicos.length === 0 ? (
                      <div className="mnt-admin-chart-empty">
                        No hay datos disponibles.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datosMecanicos}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 20,
                            left: 20,
                            bottom: 5
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="cantidad"
                            name="Tickets"
                            fill="#0f766e"
                            radius={[0, 5, 5, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="mnt-admin-chart-card">
                  <div className="mnt-admin-chart-header">
                    <div>
                      <h3>Mantenimientos por máquina</h3>
                      <p>Top 8 máquinas con más incidencias</p>
                    </div>
                  </div>

                  <div className="mnt-admin-chart mnt-admin-chart-large">
                    {datosMaquinas.length === 0 ? (
                      <div className="mnt-admin-chart-empty">
                        No hay datos disponibles.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datosMaquinas}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 20,
                            left: 20,
                            bottom: 5
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="cantidad"
                            name="Tickets"
                            fill="#7c3aed"
                            radius={[0, 5, 5, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </section>

              <section className="mnt-admin-chart-card mnt-admin-chart-full">
                <div className="mnt-admin-chart-header">
                  <div>
                    <h3>Tipos de mantenimiento</h3>
                    <p>Distribución de preventivos, correctivos y demás tipos</p>
                  </div>
                </div>

                <div className="mnt-admin-chart mnt-admin-chart-medium">
                  {datosMantenimiento.length === 0 ? (
                    <div className="mnt-admin-chart-empty">
                      No hay datos disponibles.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosMantenimiento}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="cantidad"
                          name="Tickets"
                          fill="#ea580c"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="tickets-section">
                <div className="tickets-section-header">
                  <div className="section-heading">
                    <div className="section-heading-icon">
                      <Activity size={19} />
                    </div>
                    <div>
                      <h3>Actividad reciente</h3>
                      <p>Últimos tickets registrados</p>
                    </div>
                  </div>

                  <button
                    className="mnt-admin-small-button"
                    onClick={() => setSeccion("tickets")}
                  >
                    Ver todos
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Máquina</th>
                        <th>Mecánico</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {tickets.slice(0, 10).map(ticket => (
                        <tr key={ticket.TicketId}>
                          <td>
                            <button
                              className="ticket-number"
                              onClick={() =>
                                onActualizarTicket(ticket.TicketId)
                              }
                            >
                              {ticket.NumeroTicket}
                            </button>
                          </td>

                          <td>{ticket.Maquina}</td>
                          <td>{ticket.Mecanico}</td>

                          <td>
                            <span
                              className={`priority-badge ${clasePrioridadAdmin(ticket.Prioridad)}`}
                            >
                              {ticket.Prioridad}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${claseEstadoAdmin(ticket.Estado)}`}
                            >
                              <span className="status-dot" />
                              {ticket.Estado}
                            </span>
                          </td>

                          <td>
                            <button
                              className="ticket-action ticket-action-view"
                              onClick={() =>
                                onActualizarTicket(ticket.TicketId)
                              }
                              title="Ver ticket"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {tickets.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="mnt-admin-empty">
                              No hay tickets registrados.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {seccion === "tickets" && (
            <>
              <div className="mnt-admin-page-header">
                <div>
                  <h2>Tickets</h2>
                  <p>Consulta y administración de todos los mantenimientos.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={onNuevoTicket}
                >
                  <Plus size={18} />
                  Nuevo ticket
                </button>
              </div>

<div className="mnt-admin-filters">

  {/* CABECERA */}

  <div className="mnt-admin-filters-header">

    <div>
      <div className="mnt-admin-filters-title">
        <Filter size={18} />
        <strong>Filtros de tickets</strong>
      </div>

      <span>
        Mostrando {ticketsFiltrados.length} de {tickets.length} tickets
      </span>
    </div>

    <button
      type="button"
      className="mnt-admin-clear-filters"
      onClick={limpiarFiltros}
    >
      <X size={16} />
      Limpiar filtros
    </button>

  </div>


  {/* FILA 1 */}

  <div className="mnt-admin-filter-grid">

    {/* BUSCAR */}

    <div className="mnt-admin-filter-field mnt-admin-filter-search">

      <label>
        Buscar
      </label>

      <div className="mnt-admin-search-box">

        <Search size={17} />

        <input
          value={busqueda}
          onChange={e =>
            setBusqueda(e.target.value)
          }
          placeholder="Ticket, máquina, mecánico..."
        />

      </div>

    </div>


    {/* MECÁNICO */}

    <div className="mnt-admin-filter-field">

      <label>
        Mecánico
      </label>

      <select
        value={filtroMecanico}
        onChange={e =>
          setFiltroMecanico(e.target.value)
        }
      >

        <option value="">
          Todos los mecánicos
        </option>

        {Array.from(
          new Set(
            tickets
              .map(t => t.Mecanico)
              .filter(Boolean)
          )
        )
          .sort()
          .map(mecanico => (

            <option
              key={mecanico}
              value={mecanico ?? ""}
            >
              {mecanico}
            </option>

          ))}

      </select>

    </div>


    {/* MÁQUINA */}

    <div className="mnt-admin-filter-field">

      <label>
        Máquina
      </label>

      <select
        value={filtroMaquina}
        onChange={e =>
          setFiltroMaquina(e.target.value)
        }
      >

        <option value="">
          Todas las máquinas
        </option>

        {Array.from(
          new Set(
            tickets
              .map(t => t.Maquina)
              .filter(Boolean)
          )
        )
          .sort()
          .map(maquina => (

            <option
              key={maquina}
              value={maquina ?? ""}
            >
              {maquina}
            </option>

          ))}

      </select>

    </div>


    {/* MANTENIMIENTO */}

    <div className="mnt-admin-filter-field">

      <label>
        Mantenimiento
      </label>

      <select
        value={filtroMantenimiento}
        onChange={e =>
          setFiltroMantenimiento(e.target.value)
        }
      >

        <option value="">
          Todos
        </option>

        {Array.from(
          new Set(
            tickets
              .map(t => t.TipoMantenimiento)
              .filter(Boolean)
          )
        )
          .sort()
          .map(tipo => (

            <option
              key={tipo}
              value={tipo ?? ""}
            >
              {tipo}
            </option>

          ))}

      </select>

    </div>


    {/* PRIORIDAD */}

    <div className="mnt-admin-filter-field">

      <label>
        Prioridad
      </label>

      <select
        value={filtroPrioridad}
        onChange={e =>
          setFiltroPrioridad(e.target.value)
        }
      >

        <option value="">
          Todas
        </option>

        {Array.from(
          new Set(
            tickets
              .map(t => t.Prioridad)
              .filter(Boolean)
          )
        )
          .sort()
          .map(prioridad => (

            <option
              key={prioridad}
              value={prioridad}
            >
              {prioridad}
            </option>

          ))}

      </select>

    </div>


    {/* ESTADO */}

    <div className="mnt-admin-filter-field">

      <label>
        Estado
      </label>

      <select
        value={filtroEstado}
        onChange={e =>
          setFiltroEstado(e.target.value)
        }
      >

        <option value="">
          Todos
        </option>

        {Array.from(
          new Set(
            tickets
              .map(t => t.Estado)
              .filter(Boolean)
          )
        )
          .sort()
          .map(estado => (

            <option
              key={estado}
              value={estado}
            >
              {estado}
            </option>

          ))}

      </select>

    </div>


    {/* FECHA DESDE */}

    <div className="mnt-admin-filter-field">

      <label>
        Fecha desde
      </label>

      <input
        type="date"
        value={filtroFechaDesde}
        onChange={e =>
          setFiltroFechaDesde(e.target.value)
        }
      />

    </div>


    {/* FECHA HASTA */}

    <div className="mnt-admin-filter-field">

      <label>
        Fecha hasta
      </label>

      <input
        type="date"
        value={filtroFechaHasta}
        onChange={e =>
          setFiltroFechaHasta(e.target.value)
        }
      />

    </div>

  </div>

</div>

              <section className="tickets-section">
                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Máquina</th>
                        <th>Mecánico</th>
                        <th>Mantenimiento</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {ticketsFiltrados.map(ticket => (
                        <tr key={ticket.TicketId}>
                          <td>
                            <button
                              className="ticket-number"
                              onClick={() =>
                                onActualizarTicket(ticket.TicketId)
                              }
                            >
                              {ticket.NumeroTicket}
                            </button>
                          </td>

                          <td>
                            <div className="machine-cell">
                              <div className="machine-icon">
                                <Wrench size={16} />
                              </div>
                              <div>
                                <strong>{ticket.Maquina}</strong>
                                <span>{ticket.CodigoMaquina}</span>
                              </div>
                            </div>
                          </td>

                          <td>{ticket.Mecanico}</td>
                          <td>{ticket.TipoMantenimiento}</td>

                          <td>
                            <span
                              className={`priority-badge ${clasePrioridadAdmin(ticket.Prioridad)}`}
                            >
                              {ticket.Prioridad}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${claseEstadoAdmin(ticket.Estado)}`}
                            >
                              <span className="status-dot" />
                              {ticket.Estado}
                            </span>
                          </td>

                          <td>
                            {ticket.FechaReporte
                              ? new Date(ticket.FechaReporte).toLocaleString(
                                  "es-GT"
                                )
                              : "-"}
                          </td>

                          <td>
                            <button
                              className="ticket-action ticket-action-view"
                              onClick={() =>
                                onActualizarTicket(ticket.TicketId)
                              }
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {ticketsFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={8}>
                            <div className="mnt-admin-empty">
                              No se encontraron tickets.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {seccion === "mecanicos" && (
            <>
              <div className="mnt-admin-page-header">
                <div>
                  <h2>Mecánicos</h2>
                  <p>Administración de usuarios mecánicos.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={abrirNuevoMecanico}
                >
                  <Plus size={18} />
                  Nuevo mecánico
                </button>
              </div>

              <section className="tickets-section">
                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {mecanicos.map(m => (
                        <tr key={m.MecanicoId}>
                          <td>{m.MecanicoId}</td>
                          <td>
                            <strong>
                              {m.Nombre} {m.Apellido}
                            </strong>
                          </td>
                          <td>{m.Usuario || "-"}</td>
<td>
  {!m.Activo ? (
    <span className="mnt-admin-status inactivo">
      Inactivo
    </span>
  ) : obtenerEstadoMecanico(m.MecanicoId) ? (
    <div className="mnt-mecanico-ocupado">
      <span className="mnt-admin-status ocupado">
        ● Ocupado
      </span>

      <small>
        {obtenerEstadoMecanico(m.MecanicoId)?.NumeroTicket}
      </small>
    </div>
  ) : (
    <span className="mnt-admin-status disponible">
      ● Disponible
    </span>
  )}
</td>
                          <td>
                            <div className="mnt-admin-actions">
                              <button
                                className="mnt-admin-small-button"
                                onClick={() => abrirEditarMecanico(m)}
                              >
                                Editar
                              </button>

                              <button
                                className="mnt-admin-small-button"
                                onClick={() => cambiarEstadoMecanico(m)}
                              >
                                {m.Activo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {mecanicos.length === 0 && (
                        <tr>
                          <td colSpan={5}>
                            <div className="mnt-admin-empty">
                              No hay mecánicos registrados.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {seccion === "maquinas" && (
            <>
              <div className="mnt-admin-page-header">
                <div>
                  <h2>Máquinas</h2>
                  <p>Administración del catálogo de máquinas.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={abrirNuevaMaquina}
                >
                  <Plus size={18} />
                  Nueva máquina
                </button>
              </div>

              <section className="tickets-section">
                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {maquinas.map(m => (
                        <tr key={m.MaquinaId}>
                          <td>{m.MaquinaId}</td>
                          <td>{m.Codigo}</td>
                          <td><strong>{m.Nombre}</strong></td>
                          <td>{m.Ubicacion || "-"}</td>
                          <td>
                            <span
                              className={`mnt-admin-status ${m.Activo ? "activo" : "inactivo"}`}
                            >
                              {m.Activo ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td>
<div className="mnt-admin-actions">

    <button
        className="mnt-admin-small-button"
        onClick={() =>
            abrirHistorialMaquina(m)
        }
    >
        Historial
    </button>

    <button
        className="mnt-admin-small-button"
        onClick={() => setMaquinaQR(m)}
    >
        QR
    </button>

    <button
        className="mnt-admin-small-button"
        onClick={() =>
            abrirEditarMaquina(m)
        }
    >
        Editar
    </button>

    <button
        className="mnt-admin-small-button"
        onClick={() =>
            cambiarEstadoMaquina(m)
        }
    >
        {m.Activo
            ? "Desactivar"
            : "Activar"}
    </button>

</div>
                          </td>
                        </tr>
                      ))}

                      {maquinas.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="mnt-admin-empty">
                              No hay máquinas registradas.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {seccion === "administradores" &&
  usuario.rol === "SUPERADMIN" && (
    <>
      <div className="mnt-admin-page-header">

        <div>
          <h2>Administradores</h2>

          <p>
            Administración de usuarios con acceso
            al panel administrativo.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={abrirNuevoAdministrador}
        >
          <Plus size={18} />
          Nuevo administrador
        </button>

      </div>


      <section className="tickets-section">

        <div className="table-wrapper">

          <table className="tickets-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Empresas</th>
                <th>Plantas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>


            <tbody>

              {administradores.map(
                administrador => (

                  <tr
                    key={
                      administrador.UsuarioId
                    }
                  >

                    <td>
                      {
                        administrador.UsuarioId
                      }
                    </td>


                    <td>
                      <strong>
                        {
                          administrador.Usuario
                        }
                      </strong>
                    </td>


                    <td>
                      <span
                        className="mnt-admin-status activo"
                      >
                        ADMIN
                      </span>
                    </td>


                    <td>
                      {
                        Array.isArray(
                          administrador.EmpresaIds
                        )
                          ? administrador.EmpresaIds.length
                          : 0
                      }
                    </td>


                    <td>
                      {
                        Array.isArray(
                          administrador.PlantaIds
                        )
                          ? administrador.PlantaIds.length
                          : 0
                      }
                    </td>


                    <td>
                      <span
                        className={
                          `mnt-admin-status ${
                            administrador.Activo
                              ? "activo"
                              : "inactivo"
                          }`
                        }
                      >
                        {
                          administrador.Activo
                            ? "Activo"
                            : "Inactivo"
                        }
                      </span>
                    </td>


                    <td>

                      <div
                        className="mnt-admin-actions"
                      >

                        <button
                          className="mnt-admin-small-button"
                          onClick={() =>
                            abrirEditarAdministrador(
                              administrador
                            )
                          }
                        >
                          Editar
                        </button>


                        <button
                          className="mnt-admin-small-button"
                          onClick={() =>
                            cambiarEstadoAdministrador(
                              administrador
                            )
                          }
                        >
                          {
                            administrador.Activo
                              ? "Desactivar"
                              : "Activar"
                          }
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}


              {administradores.length === 0 && (
                <tr>
                  <td colSpan={7}>

                    <div
                      className="mnt-admin-empty"
                    >
                      No hay administradores
                      registrados.
                    </div>

                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>
    </>
)}
{modalAdministrador &&
  usuario.rol === "SUPERADMIN" && (
    <div
      className="mnt-admin-modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          setModalAdministrador(false);
          setEditandoAdministrador(null);
        }
      }}
    >
      <form
        className="mnt-admin-modal"
        onSubmit={guardarAdministrador}
      >

        {/* =========================================
            ENCABEZADO
        ========================================= */}

        <div className="mnt-admin-modal-header">

          <div>
            <h3>
              {editandoAdministrador
                ? "Editar administrador"
                : "Nuevo administrador"}
            </h3>

            <p>
              Gestiona el acceso administrativo
              y el alcance de empresas y plantas.
            </p>
          </div>

          <button
            type="button"
            className="mnt-admin-modal-close"
            onClick={() => {
              setModalAdministrador(false);
              setEditandoAdministrador(null);
            }}
          >
            ×
          </button>

        </div>


        {/* =========================================
            DATOS DEL USUARIO
        ========================================= */}

        <div className="mnt-admin-form-grid">

          <label>
            Usuario

            <input
              required
              autoComplete="off"
              value={
                administradorForm.Usuario
              }
              onChange={e =>
                setAdministradorForm({
                  ...administradorForm,
                  Usuario:
                    e.target.value
                })
              }
            />
          </label>


          <label>
            Contraseña

            <input
              type="password"
              autoComplete="new-password"
              required={
                !editandoAdministrador
              }
              placeholder={
                editandoAdministrador
                  ? "Dejar vacío para conservarla"
                  : "Contraseña"
              }
              value={
                administradorForm.Password
              }
              onChange={e =>
                setAdministradorForm({
                  ...administradorForm,
                  Password:
                    e.target.value
                })
              }
            />
          </label>


          <label className="mnt-admin-checkbox">

            <input
              type="checkbox"
              checked={
                administradorForm.Activo
              }
              onChange={e =>
                setAdministradorForm({
                  ...administradorForm,
                  Activo:
                    e.target.checked
                })
              }
            />

            Usuario activo

          </label>

        </div>


        {/* =========================================
            EMPRESAS
        ========================================= */}

        <div className="mnt-admin-selection-section">

          <div className="mnt-admin-selection-header">

            <div>
              <h4>Empresas</h4>

              <p>
                Selecciona las empresas a las que
                tendrá acceso este administrador.
              </p>
            </div>

            <span>
              {
                administradorForm
                  .EmpresaIds.length
              } seleccionadas
            </span>

          </div>


          <div className="mnt-admin-selection-grid">

            {empresasAdmin.map(
              empresa => {

                const empresaId =
                  Number(
                    empresa.EmpresaId ??
                    empresa.id
                  );

                const seleccionada =
                  administradorForm
                    .EmpresaIds
                    .includes(empresaId);

                return (
                  <label
                    key={empresaId}
                    className={
                      `mnt-admin-selection-card ${
                        seleccionada
                          ? "selected"
                          : ""
                      }`
                    }
                  >

                    <input
                      type="checkbox"
                      checked={
                        seleccionada
                      }
                      onChange={() =>
                        cambiarEmpresaAdministrador(
                          empresaId
                        )
                      }
                    />

                    <div>

                      <strong>
                        {
                          empresa.Codigo ??
                          empresa.codigo ??
                          ""
                        }
                      </strong>

                      <span>
                        {
                          empresa.Nombre ??
                          empresa.nombre ??
                          ""
                        }
                      </span>

                    </div>

                  </label>
                );
              }
            )}

          </div>


          {empresasAdmin.length === 0 && (
            <div className="mnt-admin-empty">
              No hay empresas disponibles.
            </div>
          )}

        </div>


        {/* =========================================
            PLANTAS
        ========================================= */}

        <div className="mnt-admin-selection-section">

          <div className="mnt-admin-selection-header">

            <div>
              <h4>Plantas</h4>

              <p>
                Selecciona las plantas a las que
                tendrá acceso este administrador.
              </p>
            </div>

            <span>
              {
                administradorForm
                  .PlantaIds.length
              } seleccionadas
            </span>

          </div>


          <div className="mnt-admin-selection-grid">

            {plantasAdmin
              .filter(planta => {

                /*
                 * Intentamos identificar la empresa
                 * asociada a la planta.
                 */
                const empresaId =
                  Number(
                    planta.EmpresaId ??
                    planta.empresaId
                  );

                /*
                 * Si la planta tiene EmpresaId,
                 * solamente se muestra cuando
                 * la empresa está seleccionada.
                 */
                if (
                  Number.isInteger(
                    empresaId
                  ) &&
                  empresaId > 0
                ) {
                  return administradorForm
                    .EmpresaIds
                    .includes(empresaId);
                }

                /*
                 * Si la API no devuelve EmpresaId,
                 * la dejamos visible para no romper
                 * el comportamiento actual.
                 */
                return true;
              })
              .map(planta => {

                const plantaId =
                  Number(
                    planta.PlantaId ??
                    planta.id
                  );

                const seleccionada =
                  administradorForm
                    .PlantaIds
                    .includes(plantaId);

                return (
                  <label
                    key={plantaId}
                    className={
                      `mnt-admin-selection-card ${
                        seleccionada
                          ? "selected"
                          : ""
                      }`
                    }
                  >

                    <input
                      type="checkbox"
                      checked={
                        seleccionada
                      }
                      onChange={() =>
                        cambiarPlantaAdministrador(
                          plantaId
                        )
                      }
                    />

                    <div>

                      <strong>
                        {
                          planta.Codigo ??
                          planta.codigo ??
                          ""
                        }
                      </strong>

                      <span>
                        {
                          planta.Nombre ??
                          planta.nombre ??
                          ""
                        }
                      </span>

                    </div>

                  </label>
                );
              })}

          </div>


          {plantasAdmin.length === 0 && (
            <div className="mnt-admin-empty">
              No hay plantas disponibles.
            </div>
          )}

          {plantasAdmin.length > 0 &&
            administradorForm.EmpresaIds.length === 0 && (
              <div className="dashboard-alert">
                Selecciona primero al menos una empresa
                para asignar plantas.
              </div>
            )}

        </div>


        {/* =========================================
            PIE DEL MODAL
        ========================================= */}

        <div className="mnt-admin-modal-footer">

          <button
            type="button"
            className="refresh-button"
            onClick={() => {
              setModalAdministrador(false);
              setEditandoAdministrador(null);
            }}
          >
            Cancelar
          </button>


          <button
            type="submit"
            className="primary-button"
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : editandoAdministrador
                ? "Guardar cambios"
                : "Crear administrador"}
          </button>

        </div>

      </form>
    </div>
  )}
          {seccion === "reportes" && (
            <>
              <div className="mnt-admin-page-header">
                <div>
                  <h2>Reportes</h2>
                  <p>Genera reportes de mantenimiento en Excel o PDF utilizando los filtros seleccionados.</p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="primary-button"
                    onClick={exportarReporteExcel}
                    disabled={ticketsFiltrados.length === 0}
                  >
                    <FileSpreadsheet size={18} />
                    Exportar Excel
                  </button>

                  <button
                    className="primary-button"
                    style={{ background: "#475569" }}
                    onClick={exportarReportePDF}
                    disabled={ticketsFiltrados.length === 0}
                  >
                    <FileText size={18} />
                    Exportar PDF
                  </button>
                </div>
              </div>

              <section className="mnt-admin-filters">
                <div className="mnt-admin-filters-header">
                  <div>
                    <div className="mnt-admin-filters-title">
                      <Filter size={18} />
                      <strong>Filtros del reporte</strong>
                    </div>
                    <span>
                      Se exportarán {ticketsFiltrados.length} de {tickets.length} tickets.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mnt-admin-clear-filters"
                    onClick={limpiarFiltros}
                  >
                    <X size={16} />
                    Limpiar filtros
                  </button>
                </div>

                <div className="mnt-admin-filter-grid">
                  <div className="mnt-admin-filter-field mnt-admin-filter-search">
                    <label>Buscar</label>
                    <div className="mnt-admin-search-box">
                      <Search size={17} />
                      <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Ticket, máquina, mecánico..."
                      />
                    </div>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Mecánico</label>
                    <select value={filtroMecanico} onChange={e => setFiltroMecanico(e.target.value)}>
                      <option value="">Todos</option>
                      {Array.from(new Set(tickets.map(t => t.Mecanico).filter(Boolean))).sort().map(m => (
                        <option key={m} value={m ?? ""}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Máquina</label>
                    <select value={filtroMaquina} onChange={e => setFiltroMaquina(e.target.value)}>
                      <option value="">Todas</option>
                      {Array.from(new Set(tickets.map(t => t.Maquina).filter(Boolean))).sort().map(m => (
                        <option key={m} value={m ?? ""}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Mantenimiento</label>
                    <select value={filtroMantenimiento} onChange={e => setFiltroMantenimiento(e.target.value)}>
                      <option value="">Todos</option>
                      {Array.from(new Set(tickets.map(t => t.TipoMantenimiento).filter(Boolean))).sort().map(t => (
                        <option key={t} value={t ?? ""}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Prioridad</label>
                    <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
                      <option value="">Todas</option>
                      {Array.from(new Set(tickets.map(t => t.Prioridad).filter(Boolean))).sort().map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Estado</label>
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                      <option value="">Todos</option>
                      {Array.from(new Set(tickets.map(t => t.Estado).filter(Boolean))).sort().map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Fecha desde</label>
                    <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} />
                  </div>

                  <div className="mnt-admin-filter-field">
                    <label>Fecha hasta</label>
                    <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="mnt-admin-stats" style={{ marginTop: "18px" }}>
                <div className="mnt-admin-stat">
                  <span>Tickets incluidos</span>
                  <strong>{ticketsFiltrados.length}</strong>
                </div>
                <div className="mnt-admin-stat">
                  <span>Finalizados</span>
                  <strong>{ticketsFiltrados.filter(t => t.Estado === "Finalizado").length}</strong>
                </div>
                <div className="mnt-admin-stat">
                  <span>En proceso</span>
                  <strong>{ticketsFiltrados.filter(t => t.Estado === "En proceso").length}</strong>
                </div>
                <div className="mnt-admin-stat">
                  <span>Pendientes</span>
                  <strong>{ticketsFiltrados.filter(t => t.Estado === "Pendiente").length}</strong>
                </div>
                <div className="mnt-admin-stat">
                  <span>Críticos</span>
                  <strong>{ticketsFiltrados.filter(t => ["crítica", "critica"].includes((t.Prioridad || "").toLowerCase())).length}</strong>
                </div>
              </section>

              <section className="tickets-section" style={{ marginTop: "18px" }}>
                <div className="tickets-section-header">
                  <div className="section-heading">
                    <div className="section-heading-icon">
                      <FileSpreadsheet size={19} />
                    </div>
                    <div>
                      <h3>Vista previa del reporte</h3>
                      <p>Los registros que aparecen aquí serán incluidos en el reporte.</p>
                    </div>
                  </div>
                  <div className="ticket-count">{ticketsFiltrados.length} registros</div>
                </div>

                <div className="table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Fecha</th>
                        <th>Máquina</th>
                        <th>Mecánico</th>
                        <th>Mantenimiento</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsFiltrados.slice(0, 25).map(ticket => (
                        <tr key={ticket.TicketId}>
                          <td>
                            <button className="ticket-number" onClick={() => onActualizarTicket(ticket.TicketId)}>
                              {ticket.NumeroTicket}
                            </button>
                          </td>
                          <td>{ticket.FechaReporte ? new Date(ticket.FechaReporte).toLocaleDateString("es-GT") : "-"}</td>
                          <td>{ticket.Maquina || "-"}</td>
                          <td>{ticket.Mecanico || "-"}</td>
                          <td>{ticket.TipoMantenimiento || "-"}</td>
                          <td>
                            <span className={`priority-badge ${clasePrioridadAdmin(ticket.Prioridad)}`}>
                              {ticket.Prioridad || "-"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${claseEstadoAdmin(ticket.Estado)}`}>
                              <span className="status-dot" />
                              {ticket.Estado || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {ticketsFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={7}>
                            <div className="mnt-admin-empty">
                              No hay tickets que coincidan con los filtros seleccionados.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {ticketsFiltrados.length > 25 && (
                  <div style={{ padding: "14px 18px", color: "#64748b", fontSize: "13px" }}>
                    Se muestran los primeros 25 registros como vista previa. El Excel incluirá los {ticketsFiltrados.length} registros.
                  </div>
                )}
              </section>
            </>
          )}

        </main>
      </div>

      {maquinaQR && (
        <GenerarQR
          maquina={maquinaQR}
          onCerrar={() => setMaquinaQR(null)}
        />
      )}

      {mostrarHistorial && maquinaSeleccionada && (
        <div
          className="mnt-admin-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              cerrarHistorialMaquina();
            }
          }}
        >
          <div
            className="mnt-admin-modal"
            style={{
              width: "min(1100px, 95vw)",
              maxWidth: "1100px",
              padding: 0,
              overflow: "hidden"
            }}
          >
            {/* =====================================================
                CABECERA DEL HISTORIAL
            ===================================================== */}
            <div
              style={{
                padding: "26px 30px 22px",
                borderBottom: "1px solid #e2e8f0",
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "20px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px"
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #dbeafe",
                      flexShrink: 0
                    }}
                  >
                    <Wrench size={25} />
                  </div>

                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "23px",
                        color: "#172033",
                        fontWeight: 750
                      }}
                    >
                      Historial de mantenimiento
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "7px",
                        color: "#64748b",
                        fontSize: "14px"
                      }}
                    >
                      <strong style={{ color: "#334155" }}>
                        {maquinaSeleccionada.Codigo || "-"}
                      </strong>
                      <span>•</span>
                      <span>{maquinaSeleccionada.Nombre || "-"}</span>
                      {maquinaSeleccionada.Ubicacion && (
                        <>
                          <span>•</span>
                          <span>{maquinaSeleccionada.Ubicacion}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mnt-admin-modal-close"
                  onClick={cerrarHistorialMaquina}
                  title="Cerrar historial"
                  aria-label="Cerrar historial"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    fontSize: "24px"
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "22px 30px 26px" }}>
              {/* =====================================================
                  RESUMEN DE LA MÁQUINA
              ===================================================== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "12px",
                  marginBottom: "24px"
                }}
              >
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    background: "#f8fafc"
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    Total mantenimientos
                  </div>
                  <div
                    style={{
                      marginTop: "7px",
                      fontSize: "27px",
                      lineHeight: 1,
                      fontWeight: 800,
                      color: "#172033"
                    }}
                  >
                    {maquinaHistorial.length}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #bbf7d0",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    background: "#f0fdf4"
                  }}
                >
                  <div
                    style={{
                      color: "#15803d",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    Finalizados
                  </div>
                  <div
                    style={{
                      marginTop: "7px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <CheckCircle2 size={20} color="#16a34a" />
                    <strong
                      style={{
                        fontSize: "25px",
                        lineHeight: 1,
                        color: "#166534"
                      }}
                    >
                      {maquinaHistorial.filter(
                        item => item.Estado === "Finalizado"
                      ).length}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #bfdbfe",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    background: "#eff6ff"
                  }}
                >
                  <div
                    style={{
                      color: "#1d4ed8",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    En proceso
                  </div>
                  <div
                    style={{
                      marginTop: "7px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <Clock3 size={20} color="#2563eb" />
                    <strong
                      style={{
                        fontSize: "25px",
                        lineHeight: 1,
                        color: "#1e40af"
                      }}
                    >
                      {maquinaHistorial.filter(
                        item => item.Estado === "En proceso"
                      ).length}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #fecaca",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    background: "#fef2f2"
                  }}
                >
                  <div
                    style={{
                      color: "#b91c1c",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    Críticos
                  </div>
                  <div
                    style={{
                      marginTop: "7px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <AlertTriangle size={20} color="#dc2626" />
                    <strong
                      style={{
                        fontSize: "25px",
                        lineHeight: 1,
                        color: "#991b1b"
                      }}
                    >
                      {maquinaHistorial.filter(item => {
                        const prioridad = (item.Prioridad || "").toLowerCase();
                        return prioridad === "crítica" || prioridad === "critica";
                      }).length}
                    </strong>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  ESTADO DE CARGA
              ===================================================== */}
              {cargandoHistorial ? (
                <div
                  style={{
                    minHeight: "330px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "16px",
                    background: "#f8fafc"
                  }}
                >
                  <RefreshCw
                    size={32}
                    className="loading-icon"
                  />
                  <strong style={{ marginTop: "12px", color: "#334155" }}>
                    Cargando historial...
                  </strong>
                  <span style={{ marginTop: "5px", fontSize: "13px" }}>
                    Consultando los mantenimientos de la máquina.
                  </span>
                </div>
              ) : maquinaHistorial.length === 0 ? (
                <div
                  style={{
                    minHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "16px",
                    background: "#f8fafc",
                    color: "#64748b"
                  }}
                >
                  <div
                    style={{
                      width: "58px",
                      height: "58px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#e2e8f0",
                      color: "#64748b"
                    }}
                  >
                    <Wrench size={27} />
                  </div>
                  <h3
                    style={{
                      margin: "14px 0 5px",
                      color: "#334155"
                    }}
                  >
                    Sin historial todavía
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Esta máquina todavía no tiene mantenimientos registrados.
                  </p>
                </div>
              ) : (
                <div>
                  {/* =================================================
                      CABECERA DE LA LÍNEA DE TIEMPO
                  ================================================= */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      marginBottom: "18px"
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "17px",
                          color: "#172033"
                        }}
                      >
                        Historial de trabajos
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "13px",
                          color: "#64748b"
                        }}
                      >
                        Los registros más recientes aparecen primero.
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "7px 11px",
                        borderRadius: "999px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {maquinaHistorial.length} registros
                    </div>
                  </div>

                  {/* =================================================
                      TIMELINE
                  ================================================= */}
                  <div
                    style={{
                      maxHeight: "53vh",
                      overflowY: "auto",
                      padding: "4px 8px 42px 2px",
                      scrollPaddingBottom: "42px"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          top: "15px",
                          bottom: "15px",
                          left: "19px",
                          width: "2px",
                          background: "#dbeafe"
                        }}
                      />

                      {maquinaHistorial.map((historial, index) => {
                        const estado = historial.Estado || "";
                        const prioridad = historial.Prioridad || "";
                        const finalizado = estado === "Finalizado";
                        const critico =
                          prioridad.toLowerCase() === "crítica" ||
                          prioridad.toLowerCase() === "critica";

                        const fecha = historial.FechaReporte
                          ? new Date(historial.FechaReporte)
                          : null;

                        const fechaTexto = fecha
                          ? fecha.toLocaleDateString("es-GT", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "-";

                        const horaTexto = fecha
                          ? fecha.toLocaleTimeString("es-GT", {
                              hour: "numeric",
                              minute: "2-digit"
                            })
                          : "";

                        return (
                          <div
                            key={historial.TicketId}
                            style={{
                              position: "relative",
                              display: "grid",
                              gridTemplateColumns: "40px minmax(0, 1fr)",
                              gap: "13px",
                              marginBottom:
                                index === maquinaHistorial.length - 1
                                  ? 0
                                  : "16px"
                            }}
                          >
                            {/* PUNTO */}
                            <div
                              style={{
                                position: "relative",
                                zIndex: 2,
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: finalizado
                                  ? "#dcfce7"
                                  : critico
                                  ? "#fee2e2"
                                  : "#dbeafe",
                                border: `4px solid ${
                                  finalizado
                                    ? "#f0fdf4"
                                    : critico
                                    ? "#fef2f2"
                                    : "#eff6ff"
                                }`,
                                boxShadow: "0 0 0 1px #cbd5e1"
                              }}
                            >
                              {finalizado ? (
                                <CheckCircle2 size={17} color="#16a34a" />
                              ) : critico ? (
                                <AlertTriangle size={17} color="#dc2626" />
                              ) : (
                                <Wrench size={17} color="#2563eb" />
                              )}
                            </div>

                            {/* TARJETA */}
                            <div
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "15px",
                                background: "#ffffff",
                                overflow: "hidden",
                                boxShadow:
                                  "0 2px 7px rgba(15, 23, 42, 0.045)"
                              }}
                            >
                              <div
                                style={{
                                  padding: "15px 17px 13px",
                                  background:
                                    "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                                  borderBottom: "1px solid #eef2f7"
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: "15px"
                                  }}
                                >
                                  <div>
                                    <button
                                      type="button"
                                      className="ticket-number"
                                      onClick={() => {
                                        cerrarHistorialMaquina();
                                        onActualizarTicket(historial.TicketId);
                                      }}
                                      style={{
                                        padding: 0,
                                        border: 0,
                                        background: "transparent",
                                        fontSize: "15px",
                                        fontWeight: 800,
                                        cursor: "pointer"
                                      }}
                                    >
                                      {historial.NumeroTicket}
                                    </button>

                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginTop: "7px",
                                        color: "#64748b",
                                        fontSize: "12px"
                                      }}
                                    >
                                      <span>{fechaTexto}</span>
                                      {horaTexto && (
                                        <>
                                          <span>•</span>
                                          <span>{horaTexto}</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>
                                        {historial.Mecanico || "Sin mecánico"}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="ticket-action ticket-action-view"
                                    onClick={() => {
                                      cerrarHistorialMaquina();
                                      onActualizarTicket(historial.TicketId);
                                    }}
                                    title="Ver ticket completo"
                                    aria-label="Ver ticket completo"
                                  >
                                    <Eye size={17} />
                                  </button>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "7px",
                                    marginTop: "12px"
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      padding: "5px 9px",
                                      borderRadius: "999px",
                                      background: "#f1f5f9",
                                      color: "#334155",
                                      fontSize: "12px",
                                      fontWeight: 700
                                    }}
                                  >
                                    <Wrench size={13} />
                                    {historial.TipoMantenimiento || "Sin tipo"}
                                  </span>

                                  <span
                                    className={`priority-badge ${clasePrioridadAdmin(
                                      prioridad
                                    )}`}
                                  >
                                    {prioridad || "Sin prioridad"}
                                  </span>

                                  <span
                                    className={`status-badge ${claseEstadoAdmin(
                                      estado
                                    )}`}
                                  >
                                    <span className="status-dot" />
                                    {estado || "Sin estado"}
                                  </span>
                                </div>
                              </div>

                              <div style={{ padding: "14px 17px 16px" }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: "#64748b",
                                    marginBottom: "7px"
                                  }}
                                >
                                  Trabajo realizado
                                </div>

                                <p
                                  style={{
                                    margin: 0,
                                    color: historial.TrabajoRealizado
                                      ? "#334155"
                                      : "#94a3b8",
                                    fontSize: "14px",
                                    lineHeight: 1.55,
                                    whiteSpace: "pre-wrap"
                                  }}
                                >
                                  {historial.TrabajoRealizado ||
                                    historial.Observaciones ||
                                    "No se ha registrado trabajo realizado."}
                                </p>

                                {historial.Observaciones &&
                                  historial.TrabajoRealizado && (
                                    <div
                                      style={{
                                        marginTop: "13px",
                                        paddingTop: "12px",
                                        borderTop: "1px solid #eef2f7"
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          fontWeight: 800,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                          color: "#64748b",
                                          marginBottom: "6px"
                                        }}
                                      >
                                        Observaciones
                                      </div>
                                      <p
                                        style={{
                                          margin: 0,
                                          color: "#475569",
                                          fontSize: "13px",
                                          lineHeight: 1.5,
                                          whiteSpace: "pre-wrap"
                                        }}
                                      >
                                        {historial.Observaciones}
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="mnt-admin-modal-footer"
              style={{
                padding: "14px 30px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <button
                type="button"
                className="refresh-button"
                onClick={cerrarHistorialMaquina}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMecanico && (
        <div
          className="mnt-admin-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setModalMecanico(false);
            }
          }}
        >
          <form
            className="mnt-admin-modal"
            onSubmit={guardarMecanico}
          >
            <div className="mnt-admin-modal-header">
              <div>
                <h3>
                  {editandoMecanico
                    ? "Editar mecánico"
                    : "Nuevo mecánico"}
                </h3>
                <p>
                  Datos necesarios para crear el acceso del mecánico.
                </p>
              </div>

              <button
                type="button"
                className="mnt-admin-modal-close"
                onClick={() => setModalMecanico(false)}
              >
                ×
              </button>
            </div>

            <div className="mnt-admin-form-grid">
              <label>
                Nombre
                <input
                  required
                  value={mecanicoForm.Nombre}
                  onChange={e =>
                    setMecanicoForm({
                      ...mecanicoForm,
                      Nombre: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Apellido
                <input
                  required
                  value={mecanicoForm.Apellido}
                  onChange={e =>
                    setMecanicoForm({
                      ...mecanicoForm,
                      Apellido: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Usuario
                <input
                  required
                  value={mecanicoForm.Usuario}
                  onChange={e =>
                    setMecanicoForm({
                      ...mecanicoForm,
                      Usuario: e.target.value
                    })
                  }
                />
              </label>

              <label>
                {editandoMecanico
                  ? "Nueva contraseña (opcional)"
                  : "Contraseña"}
                <input
                  type="password"
                  required={!editandoMecanico}
                  value={mecanicoForm.Password}
                  onChange={e =>
                    setMecanicoForm({
                      ...mecanicoForm,
                      Password: e.target.value
                    })
                  }
                />
              </label>

              <div className="mnt-admin-full" style={{ display: "grid", gap: "10px" }}>
                <strong>Empresas asignadas</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                  {empresas.map(empresa => (
                    <label key={empresa.EmpresaId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "9px", background: mecanicoForm.EmpresaIds.includes(Number(empresa.EmpresaId)) ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={mecanicoForm.EmpresaIds.includes(Number(empresa.EmpresaId))}
                        onChange={() => alternarEmpresaSeleccionada(Number(empresa.EmpresaId), "mecanico")}
                      />
                      <span>{empresa.Codigo} - {empresa.Nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mnt-admin-full" style={{ display: "grid", gap: "10px" }}>
                <strong>Plantas asignadas</strong>
                {mecanicoForm.EmpresaIds.length === 0 ? (
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Selecciona al menos una empresa.</span>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                    {plantasDisponiblesParaForm(mecanicoForm).map(planta => (
                      <label key={planta.PlantaId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "9px", background: mecanicoForm.PlantaIds.includes(Number(planta.PlantaId)) ? "#f0fdf4" : "#fff", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={mecanicoForm.PlantaIds.includes(Number(planta.PlantaId))}
                          onChange={() => alternarPlantaSeleccionada(Number(planta.PlantaId), "mecanico")}
                        />
                        <span>{planta.Codigo} - {planta.Nombre}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="mnt-admin-checkbox">
                <input
                  type="checkbox"
                  checked={mecanicoForm.Activo}
                  onChange={e =>
                    setMecanicoForm({
                      ...mecanicoForm,
                      Activo: e.target.checked
                    })
                  }
                />
                Usuario activo
              </label>
            </div>

            <div className="mnt-admin-modal-footer">
              <button
                type="button"
                className="refresh-button"
                onClick={() => setModalMecanico(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar mecánico"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modalMaquina && (
        <div
          className="mnt-admin-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setModalMaquina(false);
            }
          }}
        >
          <form
            className="mnt-admin-modal"
            onSubmit={guardarMaquina}
          >
            <div className="mnt-admin-modal-header">
              <div>
                <h3>
                  {editandoMaquina
                    ? "Editar máquina"
                    : "Nueva máquina"}
                </h3>
                <p>
                  La máquina puede ser utilizada por cualquier mecánico.
                </p>
              </div>

              <button
                type="button"
                className="mnt-admin-modal-close"
                onClick={() => setModalMaquina(false)}
              >
                ×
              </button>
            </div>

            <div className="mnt-admin-form-grid">
              <label>
                Código
                <input
                  required
                  value={maquinaForm.Codigo}
                  onChange={e =>
                    setMaquinaForm({
                      ...maquinaForm,
                      Codigo: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Nombre
                <input
                  required
                  value={maquinaForm.Nombre}
                  onChange={e =>
                    setMaquinaForm({
                      ...maquinaForm,
                      Nombre: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Ubicación
                <input
                  value={maquinaForm.Ubicacion}
                  onChange={e =>
                    setMaquinaForm({
                      ...maquinaForm,
                      Ubicacion: e.target.value
                    })
                  }
                />
              </label>

              <label className="mnt-admin-full">
                Descripción
                <textarea
                  rows={5}
                  placeholder="Marca, modelo, serie, características u otra información de la máquina..."
                  value={maquinaForm.Descripcion}
                  onChange={e =>
                    setMaquinaForm({
                      ...maquinaForm,
                      Descripcion: e.target.value
                    })
                  }
                />
              </label>

              <div className="mnt-admin-full" style={{ display: "grid", gap: "10px" }}>
                <strong>Empresas asignadas</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                  {empresas.map(empresa => (
                    <label key={empresa.EmpresaId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "9px", background: maquinaForm.EmpresaIds.includes(Number(empresa.EmpresaId)) ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={maquinaForm.EmpresaIds.includes(Number(empresa.EmpresaId))}
                        onChange={() => alternarEmpresaSeleccionada(Number(empresa.EmpresaId), "maquina")}
                      />
                      <span>{empresa.Codigo} - {empresa.Nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mnt-admin-full" style={{ display: "grid", gap: "10px" }}>
                <strong>Plantas asignadas</strong>
                {maquinaForm.EmpresaIds.length === 0 ? (
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Selecciona al menos una empresa.</span>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                    {plantasDisponiblesParaForm(maquinaForm).map(planta => (
                      <label key={planta.PlantaId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "9px", background: maquinaForm.PlantaIds.includes(Number(planta.PlantaId)) ? "#f0fdf4" : "#fff", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={maquinaForm.PlantaIds.includes(Number(planta.PlantaId))}
                          onChange={() => alternarPlantaSeleccionada(Number(planta.PlantaId), "maquina")}
                        />
                        <span>{planta.Codigo} - {planta.Nombre}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="mnt-admin-checkbox">
                <input
                  type="checkbox"
                  checked={maquinaForm.Activo}
                  onChange={e =>
                    setMaquinaForm({
                      ...maquinaForm,
                      Activo: e.target.checked
                    })
                  }
                />
                Máquina activa
              </label>
            </div>

            <div className="mnt-admin-modal-footer">
              <button
                type="button"
                className="refresh-button"
                onClick={() => setModalMaquina(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar máquina"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


function Dashboard(props: DashboardProps) {
  if (props.usuario.rol === "ADMIN"||
    props.usuario.rol === "SUPERADMIN") {
    return <AdminDashboard {...props} />;
  }
  

  return <MechanicDashboard {...props} />;
}

export default Dashboard;
