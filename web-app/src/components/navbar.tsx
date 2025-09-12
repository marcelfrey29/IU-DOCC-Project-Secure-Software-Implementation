import { siteConfig } from "@/config/site";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Navbar as NextUINavbar,
} from "@heroui/navbar";
import { useAuth } from "react-oidc-context";
import { BootstrapIcon } from "./icons";
import { ThemeSwitch } from "./theme-switch";

export const Navbar = () => {
    const auth = useAuth();
    return (
        <NextUINavbar maxWidth="xl" position="sticky">
            {/* Mobile Menu */}
            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    {siteConfig.navItems.map((item) => (
                        <NavbarMenuItem key={`${item.label}`}>
                            <Link color="foreground" className="hover:underline" href={item.href} size="lg">
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                </div>
            </NavbarMenu>

            {/* Main-Navigation */}
            <NavbarContent className="basis-full" justify="start">
                <NavbarMenuToggle className="md:hidden" />

                <NavbarBrand className="gap-3 max-w-fit">
                    <p className="font-bold text-inherit">Social Recipe</p>
                </NavbarBrand>

                <div className="hidden md:flex gap-4 justify-start ml-2">
                    {siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <Link className="hover:underline" color="foreground" href={item.href}>
                                {item.label}
                            </Link>
                        </NavbarItem>
                    ))}
                </div>
            </NavbarContent>

            {/* Action (right) */}
            <NavbarContent className="basis-1 pl-4" justify="end">
                {auth.isAuthenticated ? (
                    <NavbarItem>
                        <Link href="/profile">
                            <BootstrapIcon name="person-fill" className="mr-1" /> Profile
                        </Link>
                    </NavbarItem>
                ) : (
                    <Button onClick={async () => void (await auth.signinRedirect())}>
                        <BootstrapIcon name="person" /> Login
                    </Button>
                )}
                <ThemeSwitch />
            </NavbarContent>
        </NextUINavbar>
    );
};
