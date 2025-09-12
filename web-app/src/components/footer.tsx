import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";
import { version } from "../../package.json";
import { BootstrapIcon } from "./icons";

export function Footer() {
    return (
        <footer className="text-foreground-500">
            <Divider className="my-4" />
            <div className="mt-6 grid grid-col-1 md:grid-cols-3 max-w-7xl mx-auto gap-4 px-6">
                {/* Left - Contact*/}
                <div className="text-center md:text-start">
                    <a href="/">Home</a>
                </div>
                {/* Center - About */}
                <div className="text-center mt-4 md:mt-0">
                    <p>
                        Built with <BootstrapIcon name="heart-fill" className="text-danger-400" /> by Marcel
                    </p>
                    <p className="pt-2 text-default-400">Version {version}</p>
                    <p className="pt-2">
                        <Link
                            href="https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation"
                            target="_blank"
                            underline="hover"
                            className="text-xl text-default-500"
                        >
                            <BootstrapIcon name="github" />
                        </Link>
                    </p>
                </div>
                {/* Right */}
                <div className="text-center md:text-end mt-4 md:mt-0">
                    <p>
                        <Link href="/privacy" className="text-default-500" underline="hover">
                            Privacy
                        </Link>
                    </p>
                    <p className="pt-2">
                        <Link href="/imprint" className="text-default-500" underline="hover">
                            Imprint
                        </Link>
                    </p>
                </div>
            </div>
            <Divider className="my-4" />
            <div className="text-center m-5 pb-4">
                <p>&copy; {new Date().getFullYear()} Marcel Frey</p>
            </div>
        </footer>
    );
}
