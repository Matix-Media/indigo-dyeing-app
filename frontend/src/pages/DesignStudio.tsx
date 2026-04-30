import { useAuthStore } from "@/stores/authStore";
import { useDesignStore } from "@/stores/designStore";
import { DesignCustomization, DesignTemplate } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const INDIGO_COLORS = ["#1E1B4B", "#312E81", "#3730A3", "#4338CA", "#4F46E5", "#6366F1", "#818CF8"];

const DesignStudio = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const { templates, isLoading, error, fetchTemplates, createDesign, generatePreview, setError } = useDesignStore();

    const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
    const [designName, setDesignName] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [customization, setCustomization] = useState<DesignCustomization>({
        templateId: "",
        primaryColor: "#1E1B4B",
        accentColor: "#4F46E5",
        scale: 1,
        rotation: 0,
        flipped: false,
    });

    useEffect(() => {
        void fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        const renderPreview = async () => {
            if (!customization.templateId) {
                setPreviewUrl("");
                return;
            }

            try {
                const preview = await generatePreview(customization);
                setPreviewUrl(preview);
            } catch (renderError: any) {
                setError(renderError.message || "Preview could not be generated");
            }
        };

        void renderPreview();
    }, [customization, generatePreview, setError]);

    const templatesByCategory = useMemo(() => {
        const grouped: Record<string, DesignTemplate[]> = {};
        templates.forEach((template) => {
            const key = template.category || "general";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(template);
        });
        return grouped;
    }, [templates]);

    const onSelectTemplate = (template: DesignTemplate) => {
        setSelectedTemplate(template);
        setCustomization((prev) => ({ ...prev, templateId: template.id }));
        if (!designName) {
            setDesignName(`${template.name} Design`);
        }
    };

    const onSaveDesign = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!selectedTemplate) {
            setError("Please select a template first");
            return;
        }

        setIsSaving(true);
        try {
            await createDesign(designName.trim() || `${selectedTemplate.name} Design`, customization);
            setError(null);
            navigate("/dashboard");
        } catch {
            // Error is set by the store.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 md:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-700 p-8 text-white shadow-xl">
                    <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Design Studio</p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">Create Your Indigo Pattern</h1>
                    <p className="mt-3 max-w-3xl text-indigo-100">
                        Select a pattern template, tune colors and geometry, and save your design for workshop booking.
                    </p>
                </header>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-6 rounded-2xl bg-white p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">1. Choose a Template</h2>
                            {isLoading && <span className="text-sm text-slate-500">Loading...</span>}
                        </div>

                        {!isLoading && templates.length === 0 && (
                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                                No templates available yet. Please seed the database and try again.
                            </p>
                        )}

                        {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                            <div key={category} className="space-y-3">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{category}</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {categoryTemplates.map((template) => {
                                        const active = selectedTemplate?.id === template.id;
                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => onSelectTemplate(template)}
                                                className={`rounded-xl border p-4 text-left transition ${
                                                    active
                                                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-slate-900">{template.name}</p>
                                                    {active && <span className="text-xs text-indigo-600">Selected</span>}
                                                </div>
                                                <p className="mt-2 text-sm text-slate-600">{template.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6 rounded-2xl bg-white p-6 shadow-lg">
                        <h2 className="text-xl font-semibold text-slate-900">2. Customize & Preview</h2>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Design Name</span>
                            <input
                                type="text"
                                value={designName}
                                onChange={(e) => setDesignName(e.target.value)}
                                placeholder="My Indigo Design"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Primary Color</span>
                                <input
                                    type="color"
                                    value={customization.primaryColor}
                                    onChange={(e) => setCustomization((prev) => ({ ...prev, primaryColor: e.target.value }))}
                                    className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Accent Color</span>
                                <input
                                    type="color"
                                    value={customization.accentColor}
                                    onChange={(e) => setCustomization((prev) => ({ ...prev, accentColor: e.target.value }))}
                                    className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                />
                            </label>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-slate-700">Suggested Indigo Shades</p>
                            <div className="flex flex-wrap gap-2">
                                {INDIGO_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        title={color}
                                        onClick={() => setCustomization((prev) => ({ ...prev, primaryColor: color }))}
                                        className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-300"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <label className="block space-y-2">
                            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                <span>Scale</span>
                                <span>{customization.scale.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min={0.5}
                                max={2}
                                step={0.1}
                                value={customization.scale}
                                onChange={(e) => setCustomization((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                                className="w-full"
                            />
                        </label>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-3 text-sm font-medium text-slate-700">Preview</p>
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Design preview"
                                    className="mx-auto aspect-square w-full max-w-[280px] rounded-lg border border-slate-300 object-cover"
                                />
                            ) : (
                                <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                                    Select a template to generate preview
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onSaveDesign}
                            disabled={!selectedTemplate || isSaving}
                            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {isSaving ? "Saving Design..." : "Save Design"}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DesignStudio;
