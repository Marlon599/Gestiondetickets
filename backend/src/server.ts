import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import mntTicketRoutes from "./routes/ticketRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import fotoRoutes from "./routes/fotoRoutes";
import authRoutes from "./auth/authRoutes";

dotenv.config();

const app = express();

const PORT =
    Number(process.env.PORT || 3010);


// =====================================================
// SEGURIDAD
// =====================================================

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: false
    })
);


// =====================================================
// CORS
// =====================================================

app.use(cors());


// =====================================================
// JSON
// =====================================================

app.use(express.json());


// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(
    "/uploads",
    express.static("uploads")
);


// =====================================================
// RUTAS MNT
// =====================================================

app.use(
    "/api/v1/mnt",
    mntTicketRoutes
);

app.use(
    "/api/v1/mnt",
    catalogRoutes
);
app.use(
    "/api/v1/mnt",
    fotoRoutes
);

app.use("/api/v1/mnt/auth", authRoutes);

// =====================================================
// INICIO
// =====================================================

app.get("/", (req, res) => {

    res.json({

        ok: true,

        sistema:
            "Gestión de Mantenimiento",

        version:
            "1.0.0"

    });

});


app.get(
    "/api/v1/mnt/health",
    (req, res) => {

        res.json({

            ok: true,

            api: "online",

            modulo: "MNT"

        });

    }
);


// =====================================================
// SERVIDOR
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "=================================="
        );

        console.log(
            "   GESTIÓN DE MANTENIMIENTO"
        );

        console.log(
            "=================================="
        );

        console.log(
            `Servidor: http://localhost:${PORT}`
        );

        console.log(
            `Health:   http://localhost:${PORT}/api/v1/mnt/health`
        );

        console.log(
            "=================================="
        );

    }
);