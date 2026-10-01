import multer from "multer";

const storage = multer.memoryStorage();

export const uploadFotos = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    },

    fileFilter: (_req, file, callback) => {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {

            return callback(
                new Error(
                    "Solo se permiten imágenes JPG, PNG o WEBP."
                )
            );

        }

        callback(null, true);

    }

});