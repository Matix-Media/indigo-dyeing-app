import { Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router();

interface DesignTemplateRow {
    id: string;
    name: string;
    image_url: string;
    category: string | null;
    svg_data: string | null;
    description: string | null;
}

interface DesignRow {
    id: string;
    user_id: string;
    name: string;
    customization: string | Record<string, unknown>;
    image_url: string;
    created_at: string;
    updated_at: string;
}

const toDesignTemplate = (row: DesignTemplateRow) => ({
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    category: row.category || "general",
    svgData: row.svg_data || "",
    description: row.description || "",
});

const toDesign = (row: DesignRow) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    customization: typeof row.customization === "string" ? JSON.parse(row.customization) : row.customization,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Get design templates
router.get("/templates", async (req: AuthRequest, res: Response) => {
    try {
        const templates = await db("design_templates")
            .select("id", "name", "image_url", "category", "svg_data", "description")
            .orderBy("name", "asc");

        res.json(templates.map(toDesignTemplate));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch design templates" });
    }
});

// Create design
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { name, customization, imageUrl } = req.body;

        if (!customization || !imageUrl) {
            return res.status(400).json({ message: "Customization and imageUrl are required" });
        }

        if (!customization.templateId || !customization.primaryColor || !customization.accentColor) {
            return res.status(400).json({ message: "Invalid customization data" });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const templateExists = await db("design_templates").where("id", customization.templateId).first();
        if (!templateExists) {
            return res.status(400).json({ message: "Invalid templateId" });
        }

        const designId = uuidv4();
        await db("designs").insert({
            id: designId,
            user_id: userId,
            name: name || "Untitled Indigo Design",
            customization: JSON.stringify(customization),
            image_url: imageUrl,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const createdDesign = await db("designs")
            .where({ id: designId })
            .first("id", "user_id", "name", "customization", "image_url", "created_at", "updated_at");

        if (!createdDesign) {
            return res.status(500).json({ message: "Failed to create design" });
        }

        res.status(201).json(toDesign(createdDesign as DesignRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create design" });
    }
});

// Get user designs
router.get("/my-designs", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const designs = await db("designs")
            .where({ user_id: userId })
            .select("id", "user_id", "name", "customization", "image_url", "created_at", "updated_at")
            .orderBy("created_at", "desc");

        res.json(designs.map((design: DesignRow) => toDesign(design)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user designs" });
    }
});

// Get design by ID
router.get("/:id", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const design = await db("designs")
            .where({ id: req.params.id })
            .first("id", "user_id", "name", "customization", "image_url", "created_at", "updated_at");

        if (!design) {
            return res.status(404).json({ message: "Design not found" });
        }

        // Designs are private to their creator in MVP.
        if (!req.user?.id || req.user.id !== design.user_id) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(toDesign(design as DesignRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch design" });
    }
});

// Delete design
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const deletedRows = await db("designs").where({ id: req.params.id, user_id: userId }).delete();

        if (!deletedRows) {
            return res.status(404).json({ message: "Design not found" });
        }

        res.json({ message: "Design deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete design" });
    }
});

export default router;
