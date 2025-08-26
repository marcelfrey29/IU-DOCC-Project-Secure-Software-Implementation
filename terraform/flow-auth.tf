resource "authentik_flow" "social-recipe-auth" {
  name        = "social-recipe-auth"
  title       = "Social Recipe - Login"
  slug        = "social-recipe-auth"
  designation = "authentication"
}

resource "authentik_flow_stage_binding" "auth-identification" {
  target = authentik_flow.social-recipe-auth.uuid
  stage  = authentik_stage_identification.social-recipe-auth-identification.id
  order  = 0
}

data "authentik_stage" "auth-pw" {
  name = "default-authentication-password"
}

resource "authentik_flow_stage_binding" "auth-pw" {
  target = authentik_flow.social-recipe-auth.uuid
  stage  = data.authentik_stage.auth-pw.id
  order  = 1
}

data "authentik_stage" "auth-login" {
  name = "default-authentication-login"
}

resource "authentik_flow_stage_binding" "auth-login" {
  target = authentik_flow.social-recipe-auth.uuid
  stage  = data.authentik_stage.auth-login.id
  order  = 2
}
