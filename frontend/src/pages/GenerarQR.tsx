import {
  useRef,
  useState
} from "react";

import {
  QRCodeCanvas
} from "qrcode.react";

import type {
  MaquinaAdmin
} from "../services/api";


/*
 * =========================================================
 * PROPIEDADES
 * =========================================================
 */

interface GenerarQRProps {

  maquina: MaquinaAdmin;

  onCerrar: () => void;

}


/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

function GenerarQR({

  maquina,

  onCerrar

}: GenerarQRProps) {


  /*
   * =======================================================
   * ESTADO
   * =======================================================
   */

  const [
    descargando,
    setDescargando
  ] = useState(false);


  /*
   * =======================================================
   * REFERENCIA AL CANVAS
   * =======================================================
   *
   * Usamos useRef en lugar de document.getElementById().
   * Esto evita problemas cuando React todavía está
   * renderizando el componente.
   */

  const qrRef =
    useRef<HTMLCanvasElement | null>(null);


  /*
   * =======================================================
   * URL DEL QR
   * =======================================================
   *
   * Ejemplo:
   *
   * http://localhost:5173/MNTMECANICOS/?maquina=1
   *
   */

  const urlQR =
    `${window.location.origin}${window.location.pathname}?maquina=${maquina.MaquinaId}`;


  /*
   * =======================================================
   * DESCARGAR QR
   * =======================================================
   */

  function descargarQR() {

    setDescargando(true);

    try {

      const canvas =
        qrRef.current;


      if (!canvas) {

        throw new Error(
          "No se encontró el código QR."
        );

      }


      const enlace =
        document.createElement("a");


      enlace.download =
        `QR-${maquina.Codigo}-${maquina.Nombre}.png`;


      enlace.href =
        canvas.toDataURL(
          "image/png"
        );


      document.body.appendChild(
        enlace
      );


      enlace.click();


      document.body.removeChild(
        enlace
      );


    } catch (error) {

      console.error(
        "Error descargando QR:",
        error
      );


      alert(
        "No se pudo descargar el código QR."
      );


    } finally {

      setDescargando(false);

    }

  }


  /*
   * =======================================================
   * IMPRIMIR QR
   * =======================================================
   */

  function imprimirQR() {

    const canvas =
      qrRef.current;


    if (!canvas) {

      alert(
        "No se encontró el código QR."
      );

      return;

    }


    const imagen =
      canvas.toDataURL(
        "image/png"
      );


    const ventana =
      window.open(
        "",
        "_blank",
        "width=700,height=800"
      );


    if (!ventana) {

      alert(
        "El navegador bloqueó la ventana de impresión."
      );

      return;

    }


    ventana.document.write(`

      <!DOCTYPE html>

      <html>

      <head>

        <title>
          QR ${maquina.Codigo}
        </title>

        <style>

          body {

            margin: 0;

            padding: 40px;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            text-align: center;

          }


          .contenedor {

            border:
              2px solid #222;

            border-radius:
              16px;

            padding:
              30px;

            width:
              420px;

            margin:
              0 auto;

          }


          img {

            width:
              320px;

            height:
              320px;

            margin:
              20px auto;

            display:
              block;

          }


          h1 {

            margin: 0;

            font-size:
              28px;

          }


          h2 {

            margin:
              8px 0;

            font-size:
              22px;

          }


          p {

            color:
              #555;

            margin:
              6px 0;

          }


          .codigo {

            font-size:
              20px;

            font-weight:
              bold;

            margin-top:
              15px;

          }

        </style>

      </head>


      <body>

        <div class="contenedor">

          <h1>
            GESTIÓN DE MANTENIMIENTO
          </h1>

          <h2>
            ${maquina.Nombre}
          </h2>

          <p class="codigo">
            ${maquina.Codigo}
          </p>

          <img
            src="${imagen}"
            alt="Código QR"
          />

          <p>
            Escanee este código para
            consultar la máquina.
          </p>

          <p>
            Se requiere iniciar sesión.
          </p>

        </div>


        <script>

          window.onload =
            function () {

              window.print();

            };

        </script>

      </body>

      </html>

    `);


    ventana.document.close();

  }


  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (

    <div

      className="mnt-admin-modal-backdrop"

      onMouseDown={(e) => {

        if (
          e.target ===
          e.currentTarget
        ) {

          onCerrar();

        }

      }}

    >

      <div

        className="mnt-admin-modal"

        style={{
          width:
            "min(560px, 94vw)",

          maxWidth:
            560
        }}

      >

        {/* ===============================================
            ENCABEZADO
           =============================================== */}

        <div
          className="mnt-admin-modal-header"
        >

          <div>

            <h3
              style={{
                margin: 0
              }}
            >

              Código QR de máquina

            </h3>


            <p
              style={{
                margin:
                  "5px 0 0",

                color:
                  "#64748b"
              }}
            >

              {maquina.Codigo}

              {" • "}

              {maquina.Nombre}

            </p>

          </div>


          <button

            type="button"

            className=
              "mnt-admin-modal-close"

            onClick={
              onCerrar
            }

            title="Cerrar"

          >

            ×

          </button>

        </div>


        {/* ===============================================
            QR
           =============================================== */}

        <div

          style={{
            padding:
              "28px",

            textAlign:
              "center"
          }}

        >

          <div

            style={{
              display:
                "inline-flex",

              padding:
                18,

              background:
                "#fff",

              borderRadius:
                14,

              border:
                "1px solid #e2e8f0"
            }}

          >

            <QRCodeCanvas

              ref={qrRef}

              value={urlQR}

              size={280}

              level="H"

              includeMargin={true}

            />

          </div>


          <h3
            style={{
              margin:
                "18px 0 4px"
            }}
          >

            {maquina.Nombre}

          </h3>


          <strong
            style={{
              color:
                "#334155"
            }}
          >

            {maquina.Codigo}

          </strong>


          <p

            style={{
              color:
                "#64748b",

              fontSize:
                13,

              marginTop:
                15
            }}

          >

            El QR identifica únicamente
            esta máquina. El usuario
            deberá iniciar sesión para
            consultar la información.

          </p>


          {/* =============================================
              MOSTRAR URL PARA VERIFICAR
             ============================================= */}

          <div

            style={{
              marginTop:
                15,

              padding:
                "10px 12px",

              background:
                "#f8fafc",

              border:
                "1px solid #e2e8f0",

              borderRadius:
                8,

              fontSize:
                12,

              color:
                "#64748b",

              wordBreak:
                "break-all"
            }}

          >

            {urlQR}

          </div>

        </div>


        {/* ===============================================
            BOTONES
           =============================================== */}

        <div

          className=
            "mnt-admin-modal-footer"

          style={{
            display:
              "flex",

            gap:
              10,

            justifyContent:
              "flex-end"
          }}

        >

          <button

            type="button"

            className=
              "refresh-button"

            onClick={
              onCerrar
            }

          >

            Cancelar

          </button>


          <button

            type="button"

            className=
              "refresh-button"

            onClick={
              imprimirQR
            }

          >

            🖨️ Imprimir

          </button>


          <button

            type="button"

            className=
              "primary-button"

            onClick={
              descargarQR
            }

            disabled={
              descargando
            }

          >

            {descargando
              ? "Generando..."
              : "⬇️ Descargar"}

          </button>

        </div>

      </div>

    </div>

  );

}


export default GenerarQR;

