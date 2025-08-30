# Implementation Details & Challenges

## Backend JWT Verification

- The backend needs to verify the JWT Token using the Auth Service (Authentik) 
    - We only extract details (e.g. the User ID from the `sub` claim) from valid tokens
- [Hono has a built-in JWT Auth Middleware](https://hono.dev/docs/middleware/builtin/jwt), but only accepts a `secret` value
    - Not ideal because it is static
- To verify, a trusted and secure library needs to be chosen: [JWT.io from Okta/Auth0 is a great source](https://www.jwt.io/libraries?programming_language=node-js)
- Approach #1: [AWS JWT Verifier (`aws-jwt-verify`)](https://github.com/awslabs/aws-jwt-verify)
    - From AWS which supports AWS Cognito (IDP Service of AWS) and other IDPs
    - Large Company with "Security as Job Zero" Principle, Open Source, Zero Dependencies (Reduces Supply Chain Attack Risk) 
    - Only accepts HTTPS connections which is challenging on `localhost`
    - While the K8s nginx Ingres Controller has a HTTPS `loclhost` it uses a self-signed certificate which causes problems as well
    - **Recommended for real-world projects as it enforeces HTTPS without exception (there's no _unsafe_ option)**, but not ideal for the project 
- Approach #2: [jose (`jose`)](https://github.com/panva/jose)
    - Sponsored by Okata/Auth0, Open Source, Zero Dependencies (Reduces Supply Chain Attack Risk) 

```ts
// Setup of AWS JWT Verifyer
const verifier = JwtVerifier.create({
    // OpenID Configuiration Issuer URL from Authentik Provider 
    issuer: "http://auth-service.localhost/application/o/social-recipe/",
    // "aud" claim: Client ID from Authentik Provider
    audience: "social-recipe",
    // JWKS URI of OpenID Configuration (http://auth-service.localhost/application/o/social-recipe/.well-known/openid-configuration)
    jwksUri: "http://auth-service.localhost/application/o/social-recipe/jwks/"
});

// Hono Middleware for AWS JWT Verifyer
app.use('*', async (c, next) => {
    const token: string | undefined = c.req.header()["authorization"]
    if (!token) {
        logger.info({}, "No Token.")
    } else {
        try {
            const payload = await verifier.verify(token.replace("Bearer ", ""));
            logger.debug({}, "JWT Token is valid.")
        } catch (e) {
            console.log(e)
            logger.warn({ e }, "JWT Token is not valid.")
            return c.json({}, 401)
        }
    }
    await next()
})
```
