resource "authentik_stage_identification" "social-recipe-auth-identification" {
  name            = "social-recipe-auth-identification"
  user_fields     = ["username", "email"]
  enrollment_flow = authentik_flow.social-recipe-registration.uuid
}
