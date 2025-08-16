import "bootstrap-icons/font/bootstrap-icons.css";

/**
 * Bootstrap Icon Component.
 *
 * @param data - the name of the Bootstrap Icon
 * @returns the Icon Component
 */
export function BootstrapIcon(data: { name: string; className?: string }) {
    return (
        <>
            <i className={"bi-" + data.name + " " + data.className}></i>
        </>
    );
}
