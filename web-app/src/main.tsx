import "@/styles/globals.css";
import { User } from "oidc-client-ts";
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { Provider } from "./provider.tsx";

const oidcConfig = {
    authority: "http://auth-service.localhost/application/o/social-recipe/",
    client_id: "social-recipe",
    redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile email",
    onSigninCallback: (_user: User | void): void => {
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
        );
    },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Provider>
                <AuthProvider {...oidcConfig}>
                    <App />
                </AuthProvider>
            </Provider>
        </BrowserRouter>
    </React.StrictMode>,
);
