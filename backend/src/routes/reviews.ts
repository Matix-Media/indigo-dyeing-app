import { Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Create review
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { bookingId, workshopId, rating, comment } = req.body;

        if (!bookingId || !workshopId || rating === undefined || !comment) {
            return res.status(400).json({ message: "Missing required fields: bookingId, workshopId, rating, comment" });
        }

        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
        }

        if (comment.trim().length < 5) {
            return res.status(400).json({ message: "Comment must be at least 5 characters long" });
        }

        // Verify booking exists, belongs to user, and is completed
        const booking = await db("bookings").where({ id: bookingId, user_id: userId, workshop_id: workshopId }).first();

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "completed" && booking.status !== "confirmed" && booking.status !== "paid") {
            return res.status(400).json({ message: "Can only review completed or confirmed bookings" });
        }

        // Check if review already exists for this booking
        const existingReview = await db("reviews").where({ booking_id: bookingId }).first();
        if (existingReview) {
            return res.status(400).json({ message: "Review already exists for this booking" });
        }

        // Create review
        const reviewId = uuidv4();
        await db("reviews").insert({
            id: reviewId,
            booking_id: bookingId,
            workshop_id: workshopId,
            user_id: userId,
            rating: Number(rating),
            comment: comment.trim(),
            created_at: new Date(),
        });

        // Get all reviews for workshop to recalculate rating
        const reviews = await db("reviews").where({ workshop_id: workshopId });
        const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;

        // Update workshop rating and review_count
        await db("workshops")
            .where({ id: workshopId })
            .update({
                rating: parseFloat(avgRating.toFixed(2)),
                review_count: reviews.length,
            });

        // Return created review
        const review = await db("reviews")
            .where({ id: reviewId })
            .select("id", "booking_id as bookingId", "workshop_id as workshopId", "user_id as userId", "rating", "comment", "created_at as createdAt")
            .first();

        res.status(201).json({
            id: review.id,
            bookingId: review.bookingId,
            workshopId: review.workshopId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create review" });
    }
});

export default router;
