import { Response, Router } from "express";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { validatePrice } from "../utils/validation.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-04-10" as any,
});

interface BookingRow {
    id: string;
    user_id: string;
    workshop_id: string;
    design_id: string | null;
    date: string;
    time_slot: string;
    participant_count: number;
    status: string;
    price: string | number;
    stripe_payment_id: string | null;
    created_at: string;
    updated_at: string;
}

const toBooking = (row: BookingRow) => ({
    id: row.id,
    userId: row.user_id,
    workshopId: row.workshop_id,
    designId: row.design_id,
    date: row.date,
    timeSlot: row.time_slot,
    participantCount: row.participant_count,
    status: row.status,
    price: Number(row.price),
    stripePaymentId: row.stripe_payment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Create booking
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { workshopId, designId, date, timeSlot, participantCount, price } = req.body;

        if (!workshopId || !date || !timeSlot) {
            return res.status(400).json({ message: "Missing required booking fields" });
        }

        if (!validatePrice(price)) {
            return res.status(400).json({ message: "Invalid price" });
        }

        const workshop = await db("workshops").where({ id: workshopId, active: true }).first();
        if (!workshop) {
            return res.status(400).json({ message: "Workshop not found" });
        }

        if (designId) {
            const design = await db("designs").where({ id: designId, user_id: userId }).first();
            if (!design) {
                return res.status(400).json({ message: "Design not found or does not belong to user" });
            }
        }

        const bookingId = uuidv4();
        await db("bookings").insert({
            id: bookingId,
            user_id: userId,
            workshop_id: workshopId,
            design_id: designId || null,
            date,
            time_slot: timeSlot,
            participant_count: participantCount || 1,
            status: "pending",
            price: Number(price),
            created_at: new Date(),
            updated_at: new Date(),
        });

        const booking = await db("bookings")
            .where({ id: bookingId })
            .first(
                "id",
                "user_id",
                "workshop_id",
                "design_id",
                "date",
                "time_slot",
                "participant_count",
                "status",
                "price",
                "stripe_payment_id",
                "created_at",
                "updated_at",
            );

        res.status(201).json(toBooking(booking as BookingRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create booking" });
    }
});

// Get booking by ID
router.get("/:id([0-9a-fA-F-]{36})", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const booking = await db("bookings")
            .where({ id: req.params.id, user_id: userId })
            .first(
                "id",
                "user_id",
                "workshop_id",
                "design_id",
                "date",
                "time_slot",
                "participant_count",
                "status",
                "price",
                "stripe_payment_id",
                "created_at",
                "updated_at",
            );

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json(toBooking(booking as BookingRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch booking" });
    }
});

// Get user bookings
router.get("/my-bookings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const bookings = await db("bookings")
            .where({ user_id: userId })
            .select(
                "id",
                "user_id",
                "workshop_id",
                "design_id",
                "date",
                "time_slot",
                "participant_count",
                "status",
                "price",
                "stripe_payment_id",
                "created_at",
                "updated_at",
            )
            .orderBy("date", "desc");

        res.json(bookings.map((booking: BookingRow) => toBooking(booking)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
});

// Cancel booking
router.put("/:id([0-9a-fA-F-]{36})/cancel", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const booking = await db("bookings").where({ id: req.params.id, user_id: userId }).first();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "completed" || booking.status === "cancelled") {
            return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
        }

        await db("bookings").where({ id: req.params.id }).update({
            status: "cancelled",
            updated_at: new Date(),
        });

        const updatedBooking = await db("bookings")
            .where({ id: req.params.id })
            .first(
                "id",
                "user_id",
                "workshop_id",
                "design_id",
                "date",
                "time_slot",
                "participant_count",
                "status",
                "price",
                "stripe_payment_id",
                "created_at",
                "updated_at",
            );

        res.json(toBooking(updatedBooking as BookingRow));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to cancel booking" });
    }
});

// Create Stripe checkout
router.post("/:id([0-9a-fA-F-]{36})/checkout", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const booking = await db("bookings").where({ id: req.params.id, user_id: userId }).first();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Only pending bookings can be checked out" });
        }

        const user = await db("users").where({ id: userId }).first();
        const workshop = await db("workshops").where({ id: booking.workshop_id }).first();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user?.email,
            client_reference_id: req.params.id,
            line_items: [
                {
                    price_data: {
                        currency: "twd",
                        product_data: {
                            name: `Indigo Workshop at ${workshop?.name}`,
                            description: `${booking.date} • ${booking.time_slot} • ${booking.participant_count} participant(s)`,
                            images: workshop?.image_url ? [workshop.image_url] : undefined,
                        },
                        unit_amount: Math.round(Number(booking.price) * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/booking-confirmation/${req.params.id}?session={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/booking/${booking.workshop_id}`,
        });

        res.json({ sessionId: session.id, sessionUrl: session.url });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
});

export default router;
