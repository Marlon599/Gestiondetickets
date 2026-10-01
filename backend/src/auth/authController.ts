import { Request, Response } from "express";
import { loginUsuario } from "./authService";

export async function login(req: Request, res: Response) {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                success: false,
                message: "Usuario y contraseña son obligatorios."
            });
        }

        const resultado = await loginUsuario(
            String(usuario).trim(),
            String(password)
        );

        return res.json({
            success: true,
            message: "Inicio de sesión correcto.",
            data: resultado
        });

    } catch (error) {
        console.error("Error en login:", error);

        return res.status(401).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "No fue posible iniciar sesión."
        });
    }
}