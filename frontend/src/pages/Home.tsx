const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
            {/* Hero */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">Create Your Own Indigo Design</h1>
                <p className="text-xl text-gray-600 mb-8">Design unique indigo patterns and book a workshop to create them with local artisans</p>
                <div className="flex gap-4 justify-center">
                    <a href="/design-studio" className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700">
                        Start Designing
                    </a>
                    <a href="/workshops" className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50">
                        Browse Workshops
                    </a>
                </div>
            </div>

            {/* Features */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎨</div>
                            <h3 className="text-xl font-semibold mb-2">Design</h3>
                            <p className="text-gray-600">Create beautiful indigo designs using our intuitive template editor</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📅</div>
                            <h3 className="text-xl font-semibold mb-2">Book</h3>
                            <p className="text-gray-600">Find and book a workshop near you at a time that works for you</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👥</div>
                            <h3 className="text-xl font-semibold mb-2">Create</h3>
                            <p className="text-gray-600">Work with experienced artisans to bring your design to life</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
