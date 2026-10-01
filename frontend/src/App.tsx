import {
    useEffect,
    useState
} from "react";

import Dashboard from "./pages/Dashboard";
import NuevoTicket from "./pages/NuevoTicket";
import ActualizarTicket from "./pages/ActualizarTicket";
import MaquinaQR from "./pages/MaquinaQR";
import Login from "./pages/Login";

import {
    UsuarioSesion
} from "./services/api";

type Pagina =
    | "dashboard"
    | "nuevo"
    | "actualizar";


/*
 * ============================================================
 * OBTENER MÁQUINA DESDE EL QR
 * ============================================================
 */

function obtenerMaquinaDesdeURL():
    number | null {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const valor =
        parametros.get("maquina");

    if (!valor) {
        return null;
    }

    const id =
        Number(valor);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}


/*
 * ============================================================
 * LIMPIAR PARÁMETRO DEL QR
 * ============================================================
 */

function limpiarParametroMaquina() {

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.delete(
        "maquina"
    );

    window.history.replaceState(
        {},
        "",
        url.pathname +
        url.search +
        url.hash
    );

}


/*
 * ============================================================
 * APP
 * ============================================================
 */

function App() {

    const [
        sesion,
        setSesion
    ] =
        useState<UsuarioSesion | null>(
            null
        );


    const [
        pagina,
        setPagina
    ] =
        useState<Pagina>(
            "dashboard"
        );


    const [
        ticketId,
        setTicketId
    ] =
        useState<number | null>(
            null
        );


    /*
     * ID DE LA MÁQUINA OBTENIDO
     * DESDE EL CÓDIGO QR
     */

    const [
        maquinaQR,
        setMaquinaQR
    ] =
        useState<number | null>(
            null
        );


    /*
     * ========================================================
     * CARGAR SESIÓN Y DETECTAR QR
     * ========================================================
     */

    useEffect(() => {

        /*
         * Recuperar sesión guardada
         */

        const sesionGuardada =
            localStorage.getItem(
                "mnt_sesion"
            );


        /*
         * Revisar si la URL contiene:
         *
         * ?maquina=2
         */

        const maquinaDesdeQR =
            obtenerMaquinaDesdeURL();


        if (
            maquinaDesdeQR !== null
        ) {

            setMaquinaQR(
                maquinaDesdeQR
            );

        }


        /*
         * Si no hay sesión,
         * Login se mostrará automáticamente.
         */

        if (!sesionGuardada) {

            return;

        }


        /*
         * Recuperar usuario
         */

        try {

            const usuario:
                UsuarioSesion =
                JSON.parse(
                    sesionGuardada
                );

            setSesion(
                usuario
            );

        } catch {

            localStorage.removeItem(
                "mnt_sesion"
            );

        }

    }, []);


    /*
     * ========================================================
     * LOGIN
     * ========================================================
     */

    function handleLogin(
        usuario: UsuarioSesion
    ) {

        setSesion(
            usuario
        );


        /*
         * Si el usuario llegó mediante
         * un QR, NO lo mandamos al Dashboard.
         *
         * Después del login se abrirá
         * directamente la máquina.
         */

        if (
            maquinaQR !== null
        ) {

            return;

        }


        /*
         * Login normal
         */

        setPagina(
            "dashboard"
        );

    }


    /*
     * ========================================================
     * CERRAR SESIÓN
     * ========================================================
     */

    function cerrarSesion() {

        localStorage.removeItem(
            "mnt_sesion"
        );


        setSesion(
            null
        );


        setPagina(
            "dashboard"
        );


        setTicketId(
            null
        );


        setMaquinaQR(
            null
        );


        limpiarParametroMaquina();

    }


    /*
     * ========================================================
     * SALIR DE LA MÁQUINA QR
     * ========================================================
     */

    function salirDeMaquinaQR() {

        setMaquinaQR(
            null
        );


        limpiarParametroMaquina();


        setPagina(
            "dashboard"
        );

    }


    /*
     * ========================================================
     * LOGIN
     * ========================================================
     *
     * Si no hay sesión:
     * mostrar pantalla de Login.
     */

    if (!sesion) {

        return (

            <Login
                onLogin={
                    handleLogin
                }
            />

        );

    }


    /*
     * ========================================================
     * MÁQUINA ABIERTA DESDE QR
     * ========================================================
     *
     * Si existe:
     *
     * ?maquina=2
     *
     * mostramos directamente
     * la ficha/historial de la máquina.
     */

    if (
        maquinaQR !== null
    ) {

        return (

            <MaquinaQR
                maquinaId={
                    maquinaQR
                }

                onVolver={
                    salirDeMaquinaQR
                }

                onReportarProblema={() => {
                    /*
                     * Ya no utilizamos esta
                     * funcionalidad desde el QR.
                     */
                }}
            />

        );

    }


    /*
     * ========================================================
     * NUEVO TICKET
     * ========================================================
     */

    if (
        pagina === "nuevo"
    ) {

        return (

            <NuevoTicket

                onVolver={() =>
                    setPagina(
                        "dashboard"
                    )
                }

                onGuardado={() =>
                    setPagina(
                        "dashboard"
                    )
                }

            />

        );

    }


    /*
     * ========================================================
     * ACTUALIZAR TICKET
     * ========================================================
     */

    if (
        pagina === "actualizar" &&
        ticketId !== null
    ) {

        return (

            <ActualizarTicket

                ticketId={
                    ticketId
                }

                onVolver={() =>
                    setPagina(
                        "dashboard"
                    )
                }

                onActualizado={() =>
                    setPagina(
                        "dashboard"
                    )
                }

            />

        );

    }


    /*
     * ========================================================
     * DASHBOARD
     * ========================================================
     */

    return (

        <Dashboard

            usuario={
                sesion
            }


            onNuevoTicket={() =>
                setPagina(
                    "nuevo"
                )
            }


            onActualizarTicket={
                (id: number) => {

                    setTicketId(
                        id
                    );

                    setPagina(
                        "actualizar"
                    );

                }
            }


            onCerrarSesion={
                cerrarSesion
            }

        />

    );

}


export default App;