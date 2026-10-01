import {
    FormEvent,
    useState
} from "react";

import {
    LockKeyhole,
    UserRound,
    LogIn,
    Wrench
} from "lucide-react";

import {
    iniciarSesion,
    UsuarioSesion
} from "../services/api";


interface LoginProps {

    onLogin: (
        usuario: UsuarioSesion
    ) => void;

}


function Login({
    onLogin
}: LoginProps) {

    const [usuario, setUsuario] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [cargando, setCargando] =
        useState(false);

    const [error, setError] =
        useState("");


    async function handleSubmit(
        event: FormEvent
    ) {

        event.preventDefault();

        setError("");

        if (!usuario.trim() || !password) {

            setError(
                "Ingrese usuario y contraseña."
            );

            return;
        }


        try {

            setCargando(true);


            const resultado =
                await iniciarSesion(
                    usuario.trim(),
                    password
                );


            localStorage.setItem(
                "mnt_sesion",
                JSON.stringify(resultado)
            );


            onLogin(resultado);


        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "No fue posible iniciar sesión."
            );

        } finally {

            setCargando(false);

        }

    }


    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, #0f172a, #1e293b)",
                padding: "20px"
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "40px",
                    boxShadow:
                        "0 20px 50px rgba(0,0,0,0.25)"
                }}
            >

                {/* LOGO */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "18px"
                    }}
                >

                    <div
                        style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "18px",
                            background: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff"
                        }}
                    >

                        <Wrench size={36} />

                    </div>

                </div>


                {/* TITULO */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "30px"
                    }}
                >

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "26px",
                            color: "#0f172a"
                        }}
                    >
                        Gestión de Mantenimiento
                    </h1>

                    <p
                        style={{
                            marginTop: "8px",
                            color: "#64748b"
                        }}
                    >
                        Inicie sesión para continuar
                    </p>

                </div>


                <form
                    onSubmit={handleSubmit}
                >

                    {/* USUARIO */}

                    <div
                        style={{
                            marginBottom: "20px"
                        }}
                    >

                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 600,
                                color: "#334155"
                            }}
                        >
                            Usuario
                        </label>

                        <div
                            style={{
                                position: "relative"
                            }}
                        >

                            <UserRound
                                size={19}
                                style={{
                                    position: "absolute",
                                    left: "14px",
                                    top: "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color: "#94a3b8"
                                }}
                            />

                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) =>
                                    setUsuario(
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese su usuario"
                                autoComplete="username"
                                disabled={cargando}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding:
                                        "13px 14px 13px 44px",
                                    border:
                                        "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "15px",
                                    outline: "none"
                                }}
                            />

                        </div>

                    </div>


                    {/* CONTRASEÑA */}

                    <div
                        style={{
                            marginBottom: "20px"
                        }}
                    >

                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: 600,
                                color: "#334155"
                            }}
                        >
                            Contraseña
                        </label>

                        <div
                            style={{
                                position: "relative"
                            }}
                        >

                            <LockKeyhole
                                size={19}
                                style={{
                                    position: "absolute",
                                    left: "14px",
                                    top: "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color: "#94a3b8"
                                }}
                            />

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese su contraseña"
                                autoComplete="current-password"
                                disabled={cargando}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding:
                                        "13px 14px 13px 44px",
                                    border:
                                        "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "15px",
                                    outline: "none"
                                }}
                            />

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div
                            style={{
                                background: "#fef2f2",
                                border:
                                    "1px solid #fecaca",
                                color: "#b91c1c",
                                padding: "12px",
                                borderRadius: "10px",
                                marginBottom: "20px",
                                fontSize: "14px"
                            }}
                        >

                            {error}

                        </div>

                    )}


                    {/* BOTÓN */}

                    <button
                        type="submit"
                        disabled={cargando}
                        style={{
                            width: "100%",
                            border: "none",
                            borderRadius: "10px",
                            padding: "14px",
                            background:
                                cargando
                                    ? "#94a3b8"
                                    : "#2563eb",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: 600,
                            cursor:
                                cargando
                                    ? "not-allowed"
                                    : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >

                        <LogIn size={19} />

                        {cargando
                            ? "Ingresando..."
                            : "Ingresar"}

                    </button>

                </form>


                <div
                    style={{
                        textAlign: "center",
                        marginTop: "25px",
                        fontSize: "12px",
                        color: "#94a3b8"
                    }}
                >

                    Sistema de Gestión de Mantenimiento

                </div>

            </div>

        </div>

    );

}


export default Login;