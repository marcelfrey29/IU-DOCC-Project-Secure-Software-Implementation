import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col">
            <Navbar></Navbar>
            <main className="container mx-auto max-w-7xl px-6 grow pt-3 overflow-x-hidden">
                {children}
            </main>
            <Footer />
        </div>
    );
}
