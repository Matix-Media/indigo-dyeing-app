import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { Booking } from "../types";

interface BookingWithDetails extends Booking {
    workshopName?: string;
    workshopCity?: string;
}

const UserDashboard: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<"bookings" | "reviews">("bookings");
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Review form state
    const [reviewingBooking, setReviewingBooking] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                const bookingsData = await apiClient.getUserBookings();

                // Fetch workshop details for each booking
                const bookingsWithDetails: BookingWithDetails[] = [];
                for (const booking of bookingsData) {
                    const workshop = await apiClient.getWorkshop(booking.workshopId);
                    bookingsWithDetails.push({
                        ...booking,
                        workshopName: workshop.name,
                        workshopCity: workshop.city,
                    });
                }

                setBookings(bookingsWithDetails);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to load bookings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const handleSubmitReview = async (booking: Booking) => {
        if (!reviewComment.trim() || reviewRating < 1 || reviewRating > 5) {
            setReviewError("Please fill in all fields");
            return;
        }

        setIsSubmittingReview(true);
        setReviewError(null);

        try {
            await apiClient.createReview({
                bookingId: booking.id,
                workshopId: booking.workshopId,
                rating: reviewRating,
                comment: reviewComment,
            });

            // Refresh bookings list
            const updatedBookings = await apiClient.getUserBookings();
            const bookingsWithDetails: BookingWithDetails[] = [];
            for (const booking of updatedBookings) {
                const workshop = await apiClient.getWorkshop(booking.workshopId);
                bookingsWithDetails.push({
                    ...booking,
                    workshopName: workshop.name,
                    workshopCity: workshop.city,
                });
            }
            setBookings(bookingsWithDetails);

            // Reset form
            setReviewingBooking(null);
            setReviewRating(5);
            setReviewComment("");
        } catch (err: any) {
            setReviewError(err.response?.data?.message || err.message || "Failed to submit review");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            Logout
                        </button>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setTab("bookings")}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                                tab === "bookings" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            My Bookings ({bookings.length})
                        </button>
                        <button
                            onClick={() => setTab("reviews")}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                                tab === "reviews" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            My Reviews
                        </button>
                    </div>

                    {/* Bookings Tab */}
                    {tab === "bookings" && (
                        <div className="p-6">
                            {bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4">📅</div>
                                    <p className="text-gray-600 mb-4">No bookings yet</p>
                                    <button
                                        onClick={() => navigate("/workshops")}
                                        className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Browse Workshops
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">{booking.workshopName}</h3>
                                                    <p className="text-sm text-gray-600">{booking.workshopCity}</p>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                        booking.status === "paid" || booking.status === "confirmed"
                                                            ? "bg-green-100 text-green-800"
                                                            : booking.status === "pending"
                                                              ? "bg-yellow-100 text-yellow-800"
                                                              : booking.status === "cancelled"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                <div>
                                                    <div className="text-gray-600">Date</div>
                                                    <div className="font-semibold text-gray-900">
                                                        {new Date(booking.date).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Time</div>
                                                    <div className="font-semibold text-gray-900">{booking.timeSlot}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Participants</div>
                                                    <div className="font-semibold text-gray-900">{booking.participantCount}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Price</div>
                                                    <div className="font-semibold text-gray-900">NT${booking.price}</div>
                                                </div>
                                            </div>

                                            {/* Review Section */}
                                            {reviewingBooking === booking.id ? (
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <h4 className="font-semibold text-gray-900 mb-4">Write a Review</h4>

                                                    {reviewError && (
                                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                                            {reviewError}
                                                        </div>
                                                    )}

                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    onClick={() => setReviewRating(star)}
                                                                    className={`text-2xl transition ${
                                                                        reviewRating >= star ? "text-yellow-400" : "text-gray-300"
                                                                    }`}
                                                                >
                                                                    ★
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                                                        <textarea
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            placeholder="Share your experience..."
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            rows={4}
                                                        />
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSubmitReview(booking)}
                                                            disabled={isSubmittingReview}
                                                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                                                        >
                                                            {isSubmittingReview ? "Submitting..." : "Submit Review"}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReviewingBooking(null);
                                                                setReviewComment("");
                                                                setReviewRating(5);
                                                                setReviewError(null);
                                                            }}
                                                            className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                (booking.status === "confirmed" || booking.status === "paid" || booking.status === "completed") && (
                                                    <button
                                                        onClick={() => setReviewingBooking(booking.id)}
                                                        className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition font-semibold"
                                                    >
                                                        Write a Review
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {tab === "reviews" && (
                        <div className="p-6">
                            {bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-4">⭐</div>
                                    <p className="text-gray-600">No reviews yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings
                                        .filter(() => reviewingBooking === null) // Simplified: show bookings that could have reviews
                                        .map((booking) => (
                                            <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{booking.workshopName}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(booking.date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-gray-600">Booking #{booking.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Ready to write your review!</p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Design Studio Link */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Create More Designs</h2>
                    <p className="text-gray-600 mb-4">Design new patterns and book more workshops</p>
                    <button
                        onClick={() => navigate("/design-studio")}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Go to Design Studio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
