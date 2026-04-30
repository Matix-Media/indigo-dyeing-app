import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { Design, Workshop } from "../types";

type Step = "design" | "datetime" | "review" | "payment";

interface AvailabilitySlot {
    date: string;
    timeSlot: string;
    maxParticipants: number;
    availableSpots: number;
}

const BookingFlow: React.FC = () => {
    const { workshopId } = useParams<{ workshopId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [step, setStep] = useState<Step>("design");
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [userDesigns, setUserDesigns] = useState<Design[]>([]);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [participantCount, setParticipantCount] = useState(1);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                if (!workshopId) throw new Error("Workshop ID not found");

                const [workshopData, designsData, availabilityData] = await Promise.all([
                    apiClient.getWorkshop(workshopId),
                    apiClient.getUserDesigns(),
                    apiClient.getWorkshopAvailability(workshopId),
                ]);

                setWorkshop(workshopData);
                setUserDesigns(designsData);

                // Map availability to component format
                const mappedAvailability: AvailabilitySlot[] = availabilityData.map((slot: any) => ({
                    date: slot.date,
                    timeSlot: slot.timeSlot,
                    maxParticipants: slot.maxParticipants,
                    availableSpots: slot.availableSpots,
                }));
                setAvailability(mappedAvailability);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to load booking data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, workshopId, navigate]);

    const handleCreateBooking = async () => {
        if (!workshopId || !selectedDate || !selectedTimeSlot || !user?.id) {
            setError("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const slot = availability.find((s) => s.date === selectedDate && s.timeSlot === selectedTimeSlot);
            if (!slot || slot.availableSpots < participantCount) {
                setError("Selected time slot does not have enough available spots");
                setIsSubmitting(false);
                return;
            }

            const price = (workshop?.rating || 1) * 100; // Simple pricing logic
            const booking = await apiClient.createBooking({
                workshopId,
                designId: selectedDesign || undefined,
                date: selectedDate,
                timeSlot: selectedTimeSlot,
                participantCount,
                price,
            });

            setBookingId(booking.id);
            setStep("payment");
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckout = async () => {
        if (!bookingId) return;

        setIsSubmitting(true);
        try {
            const checkout = await apiClient.createStripeCheckout(bookingId);
            if (checkout.sessionUrl) {
                window.location.href = checkout.sessionUrl;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to create payment session");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableDates = Array.from(new Set(availability.map((s) => s.date))).sort();
    const timeSlotsForDate = selectedDate ? availability.filter((s) => s.date === selectedDate && s.availableSpots > 0) : [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading workshop details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Workshop</h1>
                    {workshop && (
                        <p className="text-lg text-gray-600">
                            {workshop.name} • {workshop.city}
                        </p>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8">
                    {(["design", "datetime", "review", "payment"] as Step[]).map((s, idx) => (
                        <div key={s} className="flex items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                    step === s
                                        ? "bg-indigo-600 text-white"
                                        : ["design", "datetime", "review", "payment"].indexOf(s) <
                                            ["design", "datetime", "review", "payment"].indexOf(step)
                                          ? "bg-green-600 text-white"
                                          : "bg-gray-300 text-gray-600"
                                }`}
                            >
                                {idx + 1}
                            </div>
                            {idx < 3 && <div className="flex-1 h-1 bg-gray-300 mx-2"></div>}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

                {/* Step 1: Design Selection */}
                {step === "design" && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Your Design</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setSelectedDesign(null)}
                                className={`p-4 border-2 rounded-lg text-center transition ${
                                    selectedDesign === null ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                            >
                                <div className="text-2xl mb-2">✨</div>
                                <div className="font-semibold text-gray-900">No Design</div>
                                <div className="text-sm text-gray-600">Create one during the workshop</div>
                            </button>
                            {userDesigns.map((design) => (
                                <button
                                    key={design.id}
                                    onClick={() => setSelectedDesign(design.id)}
                                    className={`p-4 border-2 rounded-lg text-center transition ${
                                        selectedDesign === design.id ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
                                    }`}
                                >
                                    {design.imageUrl && (
                                        <img src={design.imageUrl} alt={design.name} className="w-full h-24 object-cover rounded mb-2" />
                                    )}
                                    <div className="font-semibold text-gray-900 text-sm">{design.name}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep("datetime")}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {step === "datetime" && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date & Time</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <select
                                value={selectedDate || ""}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedTimeSlot(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select a date...</option>
                                {availableDates.map((date) => (
                                    <option key={date} value={date}>
                                        {new Date(date).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedDate && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {timeSlotsForDate.map((slot) => (
                                        <button
                                            key={`${slot.date}-${slot.timeSlot}`}
                                            onClick={() => setSelectedTimeSlot(slot.timeSlot)}
                                            className={`p-3 border-2 rounded-lg text-center transition ${
                                                selectedTimeSlot === slot.timeSlot
                                                    ? "border-indigo-600 bg-indigo-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900">{slot.timeSlot}</div>
                                            <div className="text-xs text-gray-600">{slot.availableSpots} spots</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTimeSlot && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={timeSlotsForDate.find((s) => s.timeSlot === selectedTimeSlot)?.availableSpots || 1}
                                    value={participantCount}
                                    onChange={(e) => setParticipantCount(Math.max(1, parseInt(e.target.value)))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("design")}
                                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep("review")}
                                disabled={!selectedDate || !selectedTimeSlot}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                            >
                                Review
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === "review" && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Booking</h2>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div className="text-gray-600">Workshop</div>
                                <div className="font-semibold text-gray-900 text-right">{workshop?.name}</div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="text-gray-600">Design</div>
                                <div className="font-semibold text-gray-900 text-right">
                                    {selectedDesign ? userDesigns.find((d) => d.id === selectedDesign)?.name : "Create during workshop"}
                                </div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="text-gray-600">Date</div>
                                <div className="font-semibold text-gray-900 text-right">
                                    {selectedDate &&
                                        new Date(selectedDate).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                </div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="text-gray-600">Time</div>
                                <div className="font-semibold text-gray-900 text-right">{selectedTimeSlot}</div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="text-gray-600">Participants</div>
                                <div className="font-semibold text-gray-900 text-right">{participantCount}</div>
                            </div>
                            <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-start">
                                <div className="text-lg font-semibold text-gray-900">Total Price</div>
                                <div className="text-2xl font-bold text-indigo-600">
                                    NT${((workshop?.rating || 1) * 100 * participantCount).toFixed(0)}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("datetime")}
                                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateBooking}
                                disabled={isSubmitting}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                            >
                                {isSubmitting ? "Creating..." : "Proceed to Payment"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Payment */}
                {step === "payment" && bookingId && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Payment</h2>
                        <p className="text-gray-600 mb-6">Your booking has been created. Click below to complete payment via Stripe.</p>
                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-semibold"
                        >
                            {isSubmitting ? "Redirecting..." : "Pay Now"}
                        </button>
                        <button
                            onClick={() => navigate("/workshops")}
                            className="w-full mt-3 bg-gray-300 text-gray-900 py-3 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingFlow;
