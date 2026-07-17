import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type DeleteUserBody = {
  user_id?: string
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

    const body = (await req.json()) as DeleteUserBody
    const userId = body.user_id?.trim() ?? ""

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Informe o usuário a ser apagado." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode apagar o próprio usuário." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: targetProfile, error: targetError } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .maybeSingle()

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (targetProfile.role === "gestor_adm") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "gestor_adm")

      if ((count ?? 0) <= 1) {
        return new Response(
          JSON.stringify({
            error: "Não é possível apagar o último Gestor ADM do sistema.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }
    }

    // Remove vínculos ativos que impedem exclusão (mantém histórico de OS)
    await admin
      .from("tickets")
      .update({ technician_id: null })
      .eq("technician_id", userId)

    await admin
      .from("tickets")
      .update({ manager_id: null })
      .eq("manager_id", userId)

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      return new Response(
        JSON.stringify({
          error:
            deleteAuthError.message ||
            "Não foi possível apagar o usuário no Auth. Verifique vínculos no histórico.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Garante limpeza do perfil caso não haja cascade automático
    await admin.from("profiles").delete().eq("id", userId)

    return new Response(
      JSON.stringify({
        ok: true,
        id: userId,
        full_name: targetProfile.full_name,
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
