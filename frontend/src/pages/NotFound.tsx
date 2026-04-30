import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="mb-6">
                    <h1 className="text-9xl font-bold text-indigo-600 mb-2">404</h1>
                    <div className="text-6xl mb-4">🔍</div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    Sorry, the page you're looking for doesn't exist. It might have been moved or deleted.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
