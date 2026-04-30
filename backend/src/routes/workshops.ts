import { Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from "../middleware/auth.js";
import { validateEmail, validateName } from "../utils/validation.js";

const router = Router();

interface WorkshopRow {
    id: string;
    name: string;
    location: string;
    city: string;
    description: string | null;
    owner_id: string;
    phone: string | null;
    email: string | null;
    rating: string | number;
    review_count: number;
    image_url: string | null;
    active: boolean;
    created_at: string;
}

interface AvailabilityRow {
    id: string;
    workshop_id: string;
    date: string;
    time_slot: string;
    max_participants: number;
    available_spots: number;
    is_booked: boolean;
}

const toWorkshop = (row: WorkshopRow) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    city: row.city,
    description: row.description || "",
    ownerId: row.owner_id,
    phone: row.phone || "",
    email: row.email || "",
    rating: Number(row.rating || 0),
    reviewCount: row.review_count || 0,
    imageUrl: row.image_url || "",
    active: row.active,
    createdAt: row.created_at,
});

const toAvailabilitySlot = (row: AvailabilityRow) => ({
    id: row.id,
    workshopId: row.workshop_id,
    date: row.date,
    timeSlot: row.time_slot,
    maxParticipants: row.max_participants,
    availableSpots: row.available_spots,
    isBooked: row.is_booked,
});

// Register workshop
router.post("/register", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (role !== "workshop") {
            return res.status(403).json({ message: "Only workshop accounts can register a workshop profile" });
        }

        const { name, location, city, description, phone, email, imageUrl } = req.body;

        if (!name || !location || !city || !phone || !email) {
            return res.status(400).json({ message: "Missing required workshop fields" });
        }

        if (!validateName(name)) {
            return res.status(400).json({ message: "Workshop name must be at least 2 characters" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Invalid workshop email" });
        }

        const existingWorkshop = await db("workshops").where({ owner_id: userId }).first();
        if (existingWorkshop) {
            return res.status(400).json({ message: "Workshop profile already exists for this user" });
        }

        const workshopId = uuidv4();
        await db("workshops").insert({
            id: workshopId,
            name,
            location,
            city,
            description: description || "",
            owner_id: userId,
            phone,
            email,
            image_url: imageUrl || null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const workshop = await db("workshops")
            .where({ id: workshopId })
            .first(
                "id",
                "name",
                "location",
                "city",
                "description",
                "owner_id",
                "phone",
                "email",
                "rating",
                "review_count",
                "image_url",
                "active",
                "created_at",
            );

        res.status(201).json(toWorkshop(workshop as WorkshopRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to register workshop" });
    }
});

// Get workshops
router.get("/", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const city = typeof req.query.city === "string" ? req.query.city : undefined;
        const minRating = typeof req.query.minRating === "string" ? Number(req.query.minRating) : undefined;

        let query = db("workshops")
            .where({ active: true })
            .select(
                "id",
                "name",
                "location",
                "city",
                "description",
                "owner_id",
                "phone",
                "email",
                "rating",
                "review_count",
                "image_url",
                "active",
                "created_at",
            );

        if (city) {
            query = query.andWhereRaw("LOWER(city) = LOWER(?)", [city]);
        }

        if (!Number.isNaN(minRating) && minRating !== undefined) {
            query = query.andWhere("rating", ">=", minRating);
        }

        const workshops = await query.orderBy("rating", "desc").orderBy("created_at", "desc");
        res.json(workshops.map((workshop: WorkshopRow) => toWorkshop(workshop)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshops" });
    }
});

// Get current user's workshop
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const workshop = await db("workshops")
            .where({ owner_id: userId })
            .first(
                "id",
                "name",
                "location",
                "city",
                "description",
                "owner_id",
                "phone",
                "email",
                "rating",
                "review_count",
                "image_url",
                "active",
                "created_at",
            );

        if (!workshop) {
            return res.status(404).json({ message: "Workshop profile not found" });
        }

        res.json(toWorkshop(workshop as WorkshopRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshop profile" });
    }
});

// Update workshop
router.put("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { name, location, city, description, phone, email, imageUrl, active } = req.body;

        const workshop = await db("workshops").where({ owner_id: userId }).first();
        if (!workshop) {
            return res.status(404).json({ message: "Workshop profile not found" });
        }

        if (name && !validateName(name)) {
            return res.status(400).json({ message: "Workshop name must be at least 2 characters" });
        }

        if (email && !validateEmail(email)) {
            return res.status(400).json({ message: "Invalid workshop email" });
        }

        await db("workshops")
            .where({ owner_id: userId })
            .update({
                ...(name !== undefined && { name }),
                ...(location !== undefined && { location }),
                ...(city !== undefined && { city }),
                ...(description !== undefined && { description }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(imageUrl !== undefined && { image_url: imageUrl }),
                ...(active !== undefined && { active: Boolean(active) }),
                updated_at: new Date(),
            });

        const updatedWorkshop = await db("workshops")
            .where({ owner_id: userId })
            .first(
                "id",
                "name",
                "location",
                "city",
                "description",
                "owner_id",
                "phone",
                "email",
                "rating",
                "review_count",
                "image_url",
                "active",
                "created_at",
            );

        res.json(toWorkshop(updatedWorkshop as WorkshopRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update workshop profile" });
    }
});

// Get workshop availability
router.get("/:id([0-9a-fA-F-]{36})/availability", async (req: AuthRequest, res: Response) => {
    try {
        const availability = await db("workshop_availability")
            .where({ workshop_id: req.params.id })
            .andWhere("date", ">=", new Date().toISOString().slice(0, 10))
            .select("id", "workshop_id", "date", "time_slot", "max_participants", "available_spots", "is_booked")
            .orderBy("date", "asc")
            .orderBy("time_slot", "asc");

        res.json(availability.map((slot: AvailabilityRow) => toAvailabilitySlot(slot)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshop availability" });
    }
});

// Set workshop availability
router.post("/me/availability", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const workshop = await db("workshops").where({ owner_id: userId }).first("id");
        if (!workshop) {
            return res.status(404).json({ message: "Workshop profile not found" });
        }

        const { slots } = req.body as {
            slots?: Array<{ date: string; timeSlot: string; maxParticipants?: number; availableSpots?: number }>;
        };

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ message: "Slots array is required" });
        }

        for (const slot of slots) {
            if (!slot.date || !slot.timeSlot) {
                return res.status(400).json({ message: "Each slot needs date and timeSlot" });
            }

            const maxParticipants = slot.maxParticipants ?? 1;
            const availableSpots = slot.availableSpots ?? maxParticipants;

            await db("workshop_availability")
                .insert({
                    id: uuidv4(),
                    workshop_id: workshop.id,
                    date: slot.date,
                    time_slot: slot.timeSlot,
                    max_participants: maxParticipants,
                    available_spots: availableSpots,
                    is_booked: availableSpots <= 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .onConflict(["workshop_id", "date", "time_slot"])
                .merge({
                    max_participants: maxParticipants,
                    available_spots: availableSpots,
                    is_booked: availableSpots <= 0,
                    updated_at: new Date(),
                });
        }

        const availability = await db("workshop_availability")
            .where({ workshop_id: workshop.id })
            .select("id", "workshop_id", "date", "time_slot", "max_participants", "available_spots", "is_booked")
            .orderBy("date", "asc")
            .orderBy("time_slot", "asc");

        res.status(201).json(availability.map((slot: AvailabilityRow) => toAvailabilitySlot(slot)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save workshop availability" });
    }
});

// Get workshop bookings
router.get("/me/bookings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const workshop = await db("workshops").where({ owner_id: userId }).first("id");
        if (!workshop) {
            return res.status(404).json({ message: "Workshop profile not found" });
        }

        const bookings = await db("bookings as b")
            .leftJoin("users as u", "u.id", "b.user_id")
            .leftJoin("designs as d", "d.id", "b.design_id")
            .where("b.workshop_id", workshop.id)
            .select(
                "b.id",
                "b.user_id",
                "b.workshop_id",
                "b.design_id",
                "b.date",
                "b.time_slot",
                "b.participant_count",
                "b.status",
                "b.price",
                "b.created_at",
                "u.name as customer_name",
                "u.email as customer_email",
                "d.name as design_name",
                "d.image_url as design_image_url",
            )
            .orderBy("b.date", "asc");

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshop bookings" });
    }
});

// Get workshop reviews
router.get("/:id([0-9a-fA-F-]{36})/reviews", async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await db("reviews as r")
            .join("users as u", "u.id", "r.user_id")
            .where("r.workshop_id", req.params.id)
            .select("r.id", "r.booking_id", "r.workshop_id", "r.user_id", "r.rating", "r.comment", "r.created_at", "u.name as user_name")
            .orderBy("r.created_at", "desc");

        res.json(
            reviews.map((review) => ({
                id: review.id,
                bookingId: review.booking_id,
                workshopId: review.workshop_id,
                userId: review.user_id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.created_at,
                userName: review.user_name,
            })),
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshop reviews" });
    }
});

// Get workshop by ID
router.get("/:id([0-9a-fA-F-]{36})", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const workshop = await db("workshops")
            .where({ id: req.params.id, active: true })
            .first(
                "id",
                "name",
                "location",
                "city",
                "description",
                "owner_id",
                "phone",
                "email",
                "rating",
                "review_count",
                "image_url",
                "active",
                "created_at",
            );

        if (!workshop) {
            return res.status(404).json({ message: "Workshop not found" });
        }

        res.json(toWorkshop(workshop as WorkshopRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch workshop" });
    }
});

export default router;
