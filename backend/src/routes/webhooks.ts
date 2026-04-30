import { Response, Router } from "express";
import Stripe from "stripe";
import db from "../db.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-04-10" as any,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Stripe webhook
router.post("/stripe", async (req: any, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    let event;

    try {
        if (!WEBHOOK_SECRET) {
            console.warn("STRIPE_WEBHOOK_SECRET not configured; webhook verification skipped");
            event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        } else {
            event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
        }
    } catch (error: any) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).json({ received: false });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const bookingId = session.client_reference_id;

                if (bookingId) {
                    await db("bookings")
                        .where({ id: bookingId })
                        .update({
                            status: "paid",
                            stripe_payment_id: session.payment_intent as string,
                            updated_at: new Date(),
                        });

                    console.log(`Booking ${bookingId} marked as paid`);
                }
                break;
            }

            case "checkout.session.async_payment_failed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const bookingId = session.client_reference_id;

                if (bookingId) {
                    await db("bookings").where({ id: bookingId }).update({
                        status: "cancelled",
                        updated_at: new Date(),
                    });

                    console.log(`Booking ${bookingId} cancelled due to payment failure`);
                }
                break;
            }

            case "charge.dispute.created": {
                // Log disputes but don't auto-cancel; manual review needed
                console.log("Charge dispute created:", event.data.object);
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).json({ received: false });
    }

    res.json({ received: true });
});

export default router;
