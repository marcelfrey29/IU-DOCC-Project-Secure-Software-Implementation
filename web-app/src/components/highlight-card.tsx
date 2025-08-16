import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { useNavigate } from "react-router-dom";
import { BootstrapIcon } from "./icons";

export interface HighlightCardDetails {
    icon: string;
    title: string;
    description: string;
    url?: string;
}

export const HighlightCard = (data: { data: HighlightCardDetails }) => {
    const routeTo = useNavigate();
    return (
        <>
            <Card fullWidth={true} isBlurred className="p-2">
                <CardBody>
                    <div>
                        <BootstrapIcon
                            className="text-2xl"
                            name={data.data.icon}
                        />
                    </div>
                    <div>
                        <h3 className="mt-3 text-2xl">
                            <b>{data.data.title}</b>
                        </h3>
                        <p className="mt-2 text-default-500">
                            {data.data.description}
                        </p>
                    </div>
                </CardBody>
                {data.data.url !== undefined ? (
                    <CardFooter className="justify-end">
                        <Button
                            color="primary"
                            onPress={() => routeTo(data.data.url ?? "")}
                            endContent={<BootstrapIcon name="arrow-right" />}
                        >
                            Explore {data.data.title}
                        </Button>
                    </CardFooter>
                ) : (
                    <></>
                )}
            </Card>
        </>
    );
};
