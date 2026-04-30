import { Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { comparePasswords, generateToken, hashPassword } from "../utils/auth.js";
import { validateEmail, validateName, validatePassword } from "../utils/validation.js";

const router = Router();

// Register
router.post("/register", async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        if (!validateName(name)) {
            return res.status(400).json({ message: "Name must be at least 2 characters" });
        }

        if (!["user", "workshop"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user exists
        const existingUser = await db("users").where("email", email).first();
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userId = uuidv4();
        await db("users").insert({
            id: userId,
            email,
            password: hashedPassword,
            name,
            role,
            created_at: new Date(),
        });

        // Generate token
        const token = generateToken(userId, email, role);

        res.status(201).json({
            token,
            user: {
                id: userId,
                email,
                name,
                role,
            },
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Registration failed" });
    }
});

// Login
router.post("/login", async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Find user
        const user = await db("users").where("email", email).first();
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(user.id, user.email, user.role);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Login failed" });
    }
});

// Get current user
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await db("users").where("id", req.user?.id).first();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
});

// Logout
router.post("/logout", authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({ message: "Logged out successfully" });
});

export default router;
