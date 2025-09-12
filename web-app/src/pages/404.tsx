import { HighlightCard } from "@/components/highlight-card";
import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function NotFoundPage() {
    const highlightCards = [
        {
            icon: "house-fill",
            title: "Homepage",
            description: "Go to the homepage.",
            url: "/",
        },
    ].map((highlight) => {
        return <HighlightCard key={highlight.title} data={highlight} />;
    });

    return (
        <DefaultLayout>
            <section className="mt-12 mb-12">
                <span className="text-5xl">
                    <span className="font-mono">
                        <BootstrapIcon name="exclamation-circle-fill" className="text-danger"></BootstrapIcon>
                        <b className="ml-3">404</b>
                    </span>
                    <br />
                    <span className="mt-2 tracking-tight">Not Found.</span>
                </span>
                <p className="mt-6 text-2xl">The page you are looking for doesn't exist.</p>
            </section>

            {/* Highlight Cards */}
            <section className="mt-12″ mb-12">
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{highlightCards}</div>
            </section>
        </DefaultLayout>
    );
}
