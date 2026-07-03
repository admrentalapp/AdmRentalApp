import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type CreateUserBody = {
  email?: string
  password?: string
  full_name?: string
  role?: string
  client_id?: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single()

    if (profileError || callerProfile?.role !== "gestor_adm") {
      return new Response(JSON.stringify({ error: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const body = (await req.json()) as CreateUserBody
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const fullName = body.full_name?.trim() ?? ""
    const role = body.role ?? "cliente"
    const clientId = body.client_id ?? null

    if (!email || !password || password.length < 6) {
      return new Response(
        JSON.stringify({
          error: "Informe e-mail e senha com pelo menos 6 caracteres.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const allowedRoles = [
      "cliente",
      "gestor_adm",
      "manutencao_adm",
      "manutencao_externa",
    ]

    if (!allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Papel inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (role === "cliente" && !clientId) {
      return new Response(
        JSON.stringify({ error: "Cliente exige empresa vinculada." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

    if (createError || !created.user) {
      return new Response(
        JSON.stringify({
          error: createError?.message || "Não foi possível criar o usuário.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const { error: upsertError } = await admin.from("profiles").upsert({
      id: created.user.id,
      full_name: fullName || email,
      role,
      client_id: role === "cliente" ? clientId : null,
    })

    if (upsertError) {
      return new Response(
        JSON.stringify({
          error:
            upsertError.message ||
            "Usuário criado, mas falha ao salvar perfil. Ajuste em Usuários.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        id: created.user.id,
        email: created.user.email,
        full_name: fullName || email,
        role,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado."
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
