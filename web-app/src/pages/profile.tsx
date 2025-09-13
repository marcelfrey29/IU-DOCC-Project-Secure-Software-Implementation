import { BootstrapIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useAuth } from "react-oidc-context";

export default function ProfilePage() {
    const auth = useAuth();
    return (
        <DefaultLayout>
            <section className="mt-12″ mb-12">
                <div>
                    <h1 className="text-3xl text-primary font-bold">
                        Hello, <span className="tracking-tighter">{auth.user?.profile.name}</span> !
                    </h1>
                </div>
                <Divider className="my-5" />
                <div>
                    <h2 className="text-xl font-bold mb-2">Profile</h2>
                    <Table hideHeader isStriped>
                        <TableHeader>
                            <TableColumn>Key</TableColumn>
                            <TableColumn>Value</TableColumn>
                        </TableHeader>
                        <TableBody>
                            <TableRow key="1">
                                <TableCell>Username</TableCell>
                                <TableCell>
                                    <span>@{auth.user?.profile.preferred_username}</span>
                                </TableCell>
                            </TableRow>
                            <TableRow key="1">
                                <TableCell>Name</TableCell>
                                <TableCell>
                                    <span>{auth.user?.profile.name}</span>
                                </TableCell>
                            </TableRow>
                            <TableRow key="2">
                                <TableCell>Status</TableCell>
                                <TableCell>
                                    <Chip color="success" variant="dot">
                                        Active
                                    </Chip>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <Divider className="my-5" />
                <div>
                    <h2 className="text-xl font-bold mb-2">Sign-out</h2>
                    <Button color="danger" onClick={() => void auth.removeUser()}>
                        <BootstrapIcon name="person-fill-x" /> Log out
                    </Button>
                </div>
            </section>
        </DefaultLayout>
    );
}
