import { apiClient } from "@/api/client";
import { Workshop } from "@/types";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface AvailabilitySlot {
    id: string;
    workshopId: string;
    date: string;
    timeSlot: string;
    maxParticipants: number;
    availableSpots: number;
    isBooked: boolean;
}

interface WorkshopReview {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
}

const WorkshopDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [reviews, setReviews] = useState<WorkshopReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadWorkshop = async () => {
            if (!id) return;
            setIsLoading(true);
            setError("");

            try {
                const [workshopData, availabilityData, reviewData] = await Promise.all([
                    apiClient.getWorkshop(id),
                    apiClient.getWorkshopAvailability(id),
                    apiClient.getWorkshopReviews(id),
                ]);

                setWorkshop(workshopData);
                setAvailability(availabilityData);
                setReviews(reviewData);
            } catch (loadError: any) {
                setError(loadError.response?.data?.message || "Could not load workshop details");
            } finally {
                setIsLoading(false);
            }
        };

        void loadWorkshop();
    }, [id]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-600">Loading workshop details...</div>;
    }

    if (error) {
        return <div className="min-h-screen bg-slate-100 px-4 py-10 text-red-700">{error}</div>;
    }

    if (!workshop) {
        return <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-600">Workshop not found.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl bg-white p-6 shadow-md">
                    <h1 className="text-3xl font-bold text-slate-900">{workshop.name}</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {workshop.city} • {workshop.location}
                    </p>
                    <p className="mt-4 text-slate-700">{workshop.description || "No description available yet."}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span>
                            Rating: {Number(workshop.rating).toFixed(1)} ({workshop.reviewCount} reviews)
                        </span>
                        <span>Contact: {workshop.email || "N/A"}</span>
                    </div>
                    <Link
                        to={`/booking/${workshop.id}`}
                        className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
                    >
                        Book this workshop
                    </Link>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-md">
                    <h2 className="text-xl font-semibold text-slate-900">Available Time Slots</h2>
                    {availability.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No availability has been published yet.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="py-2">Date</th>
                                        <th className="py-2">Time</th>
                                        <th className="py-2">Spots</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {availability.map((slot) => (
                                        <tr key={slot.id} className="border-b border-slate-100">
                                            <td className="py-2 text-slate-700">{slot.date}</td>
                                            <td className="py-2 text-slate-700">{slot.timeSlot}</td>
                                            <td className="py-2 text-slate-700">
                                                {slot.availableSpots}/{slot.maxParticipants}
                                            </td>
                                            <td className="py-2">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${slot.isBooked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                                                >
                                                    {slot.isBooked ? "Booked" : "Available"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-md">
                    <h2 className="text-xl font-semibold text-slate-900">Reviews</h2>
                    {reviews.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No reviews yet.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {reviews.map((review) => (
                                <article key={review.id} className="rounded-lg border border-slate-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-900">{review.userName}</p>
                                        <p className="text-sm text-amber-600">{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-700">{review.comment || "No comment provided."}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default WorkshopDetail;
