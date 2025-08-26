resource "authentik_flow" "social-recipe-registration" {
  name        = "social-recipe-registration"
  title       = "Social Recipe - Registration"
  slug        = "social-recipe-registration"
  designation = "enrollment"
}

resource "authentik_flow_stage_binding" "promt" {
  target = authentik_flow.social-recipe-registration.uuid
  stage  = authentik_stage_prompt.name.id
  order  = 0
}

resource "authentik_stage_prompt_field" "field_username" {
  field_key = "username"
  name      = "username"
  label     = "Username"
  type      = "username"
  order     = 0
  required  = true
}

resource "authentik_stage_prompt_field" "field_password" {
  field_key = "password"
  name      = "password"
  label     = "Password"
  type      = "password"
  order     = 1
  required  = true
}

resource "authentik_stage_prompt_field" "field_accept_policy" {
  field_key = "accept_policies"
  name      = "accept_policies"
  label     = "I accept the rules and policies."
  type      = "checkbox"
  order     = 2
  required  = true
}

resource "authentik_stage_prompt" "name" {
  name = "test"
  fields = [
    resource.authentik_stage_prompt_field.field_username.id,
    resource.authentik_stage_prompt_field.field_password.id,
    resource.authentik_stage_prompt_field.field_accept_policy.id,
  ]
}

resource "authentik_policy_expression" "promt-policy" {
  name       = "src-enr-if-username"
  expression = "return 'username' not in context.get('prompt_data', {})"
}

resource "authentik_policy_binding" "app-access" {
  target = authentik_flow_stage_binding.promt.id
  policy = authentik_policy_expression.promt-policy.id
  order  = 0
}

data "authentik_stage" "registration-write" {
  name = "default-source-enrollment-write"
}

resource "authentik_flow_stage_binding" "write" {
  target = authentik_flow.social-recipe-registration.uuid
  stage  = data.authentik_stage.registration-write.id
  order  = 1
}

data "authentik_stage" "registration-login" {
  name = "default-source-enrollment-login"
}

resource "authentik_flow_stage_binding" "login" {
  target = authentik_flow.social-recipe-registration.uuid
  stage  = data.authentik_stage.registration-login.id
  order  = 2
}
