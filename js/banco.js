/* =====================================================================
   LIGAÇÃO COM O SUPABASE
   Este é o único lugar com o endereço e a chave do banco.
   A chave abaixo é a PÚBLICA (publishable). Ela pode ficar no site:
   quem protege os dados é a tranca (RLS) que está no banco.sql.
   NUNCA coloque a chave secreta (service_role / secret) aqui.

   Antes deste arquivo, a página precisa carregar o Supabase por CDN:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js"></script>
   ===================================================================== */
(function () {
  var SUPABASE_URL = 'https://qvpzcxzfkyolhylohesc.supabase.co';
  var SUPABASE_CHAVE_PUBLICA = 'sb_publishable_vn_x7v_WBOb3OMqmK0qajA_bO86Emyt';

  window.banco = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      window.banco = window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
  } catch (e) {
    window.banco = null;
  }
})();
