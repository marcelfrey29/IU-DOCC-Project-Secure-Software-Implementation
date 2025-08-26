resource "authentik_provider_oauth2" "social_recipe" {
  name        = "Social Recipe"
  client_id   = "social-recipe"
  client_type = "public"
  allowed_redirect_uris = [
    {
      // Local Development Server
      matching_mode = "strict",
      url           = "http://localhost:5173",
    },
    {
      // Kubernetes Deployment
      matching_mode = "strict",
      url           = "http://social-recipe.localhost",
    }
  ]
  access_token_validity = "minutes=60"
  property_mappings     = [data.authentik_property_mapping_provider_scope.profile-scope.id]
  authentication_flow   = authentik_flow.social-recipe-auth.uuid
  authorization_flow    = authentik_flow.social-recipe-authorization.uuid
  invalidation_flow     = data.authentik_flow.default-provider-invalidation-flow.id
}

resource "authentik_application" "social_recipe" {
  name              = "Social Recipe"
  slug              = "social-recipe"
  protocol_provider = authentik_provider_oauth2.social_recipe.id
}

data "authentik_property_mapping_provider_scope" "profile-scope" {
  name = "authentik default OAuth Mapping: OpenID 'profile'"
}

data "authentik_flow" "default-provider-invalidation-flow" {
  slug = "default-provider-invalidation-flow"
}
