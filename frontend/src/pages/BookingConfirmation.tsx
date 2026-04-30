import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { Booking, Design, Workshop } from "../types";

interface BookingDetails {
    booking: Booking | null;
    workshop: Workshop | null;
    design: Design | null;
    error: string | null;
}

const BookingConfirmation: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [details, setDetails] = useState<BookingDetails>({
        booking: null,
        workshop: null,
        design: null,
        error: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                if (!bookingId) throw new Error("Booking ID not found");

                const booking = await apiClient.getBooking(bookingId);
                const workshop = await apiClient.getWorkshop(booking.workshopId);
                let design = null;

                if (booking.designId) {
                    design = await apiClient.getDesign(booking.designId);
                }

                setDetails({
                    booking,
                    workshop,
                    design,
                    error: null,
                });
            } catch (err: any) {
                setDetails({
                    booking: null,
                    workshop: null,
                    design: null,
                    error: err.response?.data?.message || err.message || "Failed to load booking details",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading booking confirmation...</p>
                </div>
            </div>
        );
    }

    if (details.error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">❌</div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                            <p className="text-gray-600 mb-6">{details.error}</p>
                        </div>
                        <button
                            onClick={() => navigate("/workshops")}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Back to Workshops
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!details.booking || !details.workshop) {
        return null;
    }

    const { booking, workshop, design } = details;
    const isPaymentSuccessful = booking.status === "paid" || booking.status === "confirmed";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success/Pending Status */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{isPaymentSuccessful ? "✅" : "⏳"}</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {isPaymentSuccessful ? "Booking Confirmed!" : "Booking Pending Payment"}
                        </h1>
                        <p className="text-gray-600 mb-4">
                            {isPaymentSuccessful
                                ? "Your indigo dyeing workshop booking is confirmed."
                                : "Your booking is waiting for payment confirmation."}
                        </p>
                        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Confirmation Number</div>
                            <div className="font-mono text-lg font-bold text-indigo-600">{booking.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Workshop</span>
                            <span className="font-semibold text-gray-900">{workshop.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Location</span>
                            <span className="font-semibold text-gray-900">{workshop.location}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Date</span>
                            <span className="font-semibold text-gray-900">
                                {new Date(booking.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Time</span>
                            <span className="font-semibold text-gray-900">{booking.timeSlot}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Participants</span>
                            <span className="font-semibold text-gray-900">{booking.participantCount}</span>
                        </div>
                        {design && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Design</span>
                                <span className="font-semibold text-gray-900">{design.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Price per Participant</span>
                            <span className="font-semibold text-gray-900">NT${booking.price.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Number of Participants</span>
                            <span className="font-semibold text-gray-900">{booking.participantCount}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-indigo-50 px-3 rounded-lg">
                            <span className="font-semibold text-gray-900">Total Amount</span>
                            <span className="text-2xl font-bold text-indigo-600">NT${(booking.price * booking.participantCount).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Status</span>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    isPaymentSuccessful ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                        </div>
                        {booking.stripePaymentId && (
                            <div className="flex justify-between py-2 border-t border-gray-200">
                                <span className="text-gray-600">Payment ID</span>
                                <span className="font-mono text-sm text-gray-500">...{booking.stripePaymentId.slice(-8)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Important Information */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-indigo-900 mb-3">Important Information</h3>
                    <ul className="space-y-2 text-sm text-indigo-800">
                        <li>✓ Please arrive 15 minutes before your scheduled time</li>
                        <li>✓ Wear clothes you don't mind getting dyed indigo blue</li>
                        <li>✓ A confirmation email has been sent to your registered email address</li>
                        <li>✓ Contact the workshop directly if you need to reschedule</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/workshops")}
                        className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                    >
                        Browse More Workshops
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmation;
