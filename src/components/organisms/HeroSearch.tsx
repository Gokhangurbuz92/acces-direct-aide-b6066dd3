import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface HeroSearchProps {
    /** Main heading text */
    title?: string;
    /** Subtitle / secondary text */
    subtitle?: string;
    /** Placeholder for the search input */
    placeholder?: string;
}

export default function HeroSearch({
    title = "Trouvez une aide rapidement.",
    subtitle = "Aides, démarches, structures\u00a0— informations sourcées.",
    placeholder = "Logement, santé, handicap\u2026",
}: HeroSearchProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            navigate(`/aides?q=${encodeURIComponent(trimmed)}`);
        } else {
            navigate("/aides");
        }
    };

    return (
        <section className="bg-background py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    {title}
                </h1>

                <p className="mt-4 text-base text-foreground/80 sm:text-lg">
                    {subtitle}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 flex flex-col gap-3 sm:flex-row"
                    role="search"
                >
                    <div className="relative flex-1">
                        <label className="sr-only" htmlFor="hero-search">
                            Rechercher une aide
                        </label>
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="hero-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" className="bg-indigo-700 text-white hover:bg-indigo-800">Rechercher</Button>
                </form>
            </div>
        </section>
    );
}
