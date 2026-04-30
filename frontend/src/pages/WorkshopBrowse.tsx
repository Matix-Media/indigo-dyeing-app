import { apiClient } from "@/api/client";
import { Workshop } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const WorkshopBrowse = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [city, setCity] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadWorkshops = async (cityFilter?: string) => {
        setIsLoading(true);
        setError("");
        try {
            const data = await apiClient.getWorkshops(cityFilter ? { city: cityFilter } : undefined);
            setWorkshops(data);
        } catch (loadError: any) {
            setError(loadError.response?.data?.message || "Could not load workshops");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadWorkshops();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Browse Indigo Workshops</h1>
                        <p className="mt-2 text-sm text-slate-600">Find local studios and book your next indigo dyeing experience.</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Filter by city (e.g. Taipei)"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => void loadWorkshops(city.trim() || undefined)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Filter
                        </button>
                    </div>
                </div>

                {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                {isLoading ? (
                    <p className="text-slate-600">Loading workshops...</p>
                ) : workshops.length === 0 ? (
                    <p className="rounded-lg bg-white p-6 text-slate-600 shadow-sm">No workshops found for this filter.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {workshops.map((workshop) => (
                            <article key={workshop.id} className="rounded-xl bg-white p-5 shadow-md">
                                <h2 className="text-xl font-semibold text-slate-900">{workshop.name}</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    {workshop.city} • {workshop.location}
                                </p>
                                <p className="mt-3 text-sm text-slate-700">{workshop.description || "No description yet."}</p>
                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <span className="text-slate-600">
                                        Rating: {Number(workshop.rating).toFixed(1)} ({workshop.reviewCount})
                                    </span>
                                    <Link to={`/workshops/${workshop.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                                        View details
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkshopBrowse;
