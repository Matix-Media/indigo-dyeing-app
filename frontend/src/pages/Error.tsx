import React from "react";
import { useNavigate } from "react-router-dom";

interface ErrorPageProps {
    statusCode?: number;
    title?: string;
    message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
    statusCode = 500,
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again later.",
}) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="mb-6">
                    <h1 className="text-9xl font-bold text-red-600 mb-2">{statusCode}</h1>
                    <div className="text-6xl mb-4">⚠️</div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">{message}</p>

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

export default ErrorPage;
