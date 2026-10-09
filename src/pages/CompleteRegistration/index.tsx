import { FormEvent, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "../../styles/login.css";
import { Icon } from "../../components/Icon";
import { ApiError } from "../../services/api";
import { lookupCep } from "../../services/cep";
import { completeRegistration, getCurrentUser, type ContactType } from "../../services/dashboardApi";
import { useCustomerSession } from "../../services/useCustomerSession";

const digits = (value: string) => value.replace(/\D/g, "");
const maskCpf = (value: string) => digits(value).slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCep = (value: string) => {
  const d = digits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const maskPhone = (value: string) => {
  const d = digits(value).slice(0, 11);
  if (d.length < 3) return d;
  const split = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? `-${d.slice(split)}` : ""}`;
};
// DDD de 11 a 99; celular (11 dígitos) começa com 9.
const isValidPhone = (value: string) => {
  const d = digits(value);
  return /^[1-9][1-9]/.test(d) && (d.length === 10 || (d.length === 11 && d[2] === "9"));
};

const contactTypes: { value: ContactType; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
];

type CepStatus = "idle" | "loading" | "notfound" | "error";

const emptyForm = {
  name: "", cpf: "", cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "", contactType: "whatsapp" as ContactType, contactValue: "",
};

export function CompleteRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const session = useCustomerSession();

  const [form, setForm] = useState(emptyForm);
  const [profile, setProfile] = useState<"loading" | "ready" | "complete">("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const numeroRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    if (!session.accessToken) return;
    const controller = new AbortController();
    getCurrentUser(session.accessToken, controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        if (user.cpf) { setProfile("complete"); return; }
        setForm((current) => ({ ...current, name: user.name }));
        setProfile("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar seus dados.");
        setProfile("ready");
      });
    return () => controller.abort();
  }, [session.accessToken]);

  useEffect(() => {
    if (digits(form.cep).length !== 8) { setCepStatus("idle"); return; }
    const controller = new AbortController();
    setCepStatus("loading");
    lookupCep(form.cep, controller.signal)
      .then((address) => {
        if (controller.signal.aborted) return;
        if (!address) { setCepStatus("notfound"); return; }
        setForm((current) => ({
          ...current,
          logradouro: address.logradouro || current.logradouro,
          bairro: address.bairro || current.bairro,
          cidade: address.cidade || current.cidade,
          estado: address.estado || current.estado,
        }));
        setCepStatus("idle");
        numeroRef.current?.focus();
      })
      .catch(() => { if (!controller.signal.aborted) setCepStatus("error"); });
    return () => controller.abort();
  }, [form.cep]);

  if (!session.loading && !session.customerId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (profile === "complete") {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (digits(form.cpf).length !== 11) { setError("Informe um CPF com 11 dígitos."); return; }
    if (digits(form.cep).length !== 8) { setError("Informe um CEP com 8 dígitos."); return; }
    if (!/^[A-Za-z]{2}$/.test(form.estado)) { setError("Informe a sigla do estado com 2 letras."); return; }
    if (!isValidPhone(form.contactValue)) { setError("Informe um telefone válido com DDD, por exemplo (85) 99999-9999."); return; }
    if (!session.accessToken) { setError("Sua sessão expirou. Entre novamente."); return; }

    try {
      setLoading(true);
      await completeRegistration(session.accessToken, {
        name: form.name.trim(),
        cpf: digits(form.cpf),
        endereco: {
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          ...(form.complemento.trim() ? { complemento: form.complemento.trim() } : {}),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.toUpperCase(),
          cep: digits(form.cep),
        },
        contato: { tipo: form.contactType, valor: digits(form.contactValue) },
      });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar o cadastro.");
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || session.loading || profile === "loading";

  return (
    <main className="login-container">
      <div className="login-card login-card-wide">
        <header className="login-header">
          <div className="logo-container">
            <div className="logo-icon">R</div>
            <h1 className="logo-text">ResolvAI</h1>
          </div>
          <p>Complete seu cadastro para continuar.</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div role="alert" style={{ color: "var(--color-danger)", fontSize: "0.875rem", textAlign: "center", backgroundColor: "var(--color-warning-soft)", padding: "0.5rem", borderRadius: "8px" }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Nome completo</label>
            <div className="input-wrapper">
              <Icon name="user" size={18} className="input-icon" />
              <input id="name" type="text" value={form.name} maxLength={200} required
                onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="cpf">CPF</label>
            <div className="input-wrapper">
              <Icon name="shield" size={18} className="input-icon" />
              <input id="cpf" type="text" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00"
                value={form.cpf} required onChange={(e) => set("cpf", maskCpf(e.target.value))} />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="cep">CEP</label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="cep" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
                  value={form.cep} required onChange={(e) => set("cep", maskCep(e.target.value))} />
              </div>
              {cepStatus !== "idle" && (
                <span className="field-hint" role="status">
                  {cepStatus === "loading" && "Buscando endereço..."}
                  {cepStatus === "notfound" && "CEP não encontrado. Preencha o endereço manualmente."}
                  {cepStatus === "error" && "Não foi possível buscar o CEP. Preencha o endereço manualmente."}
                </span>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="estado">Estado</label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="estado" type="text" autoComplete="address-level1" placeholder="CE" maxLength={2}
                  value={form.estado} required onChange={(e) => set("estado", e.target.value.toUpperCase())} />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="logradouro">Logradouro</label>
            <div className="input-wrapper">
              <Icon name="pin" size={18} className="input-icon" />
              <input id="logradouro" type="text" autoComplete="address-line1" maxLength={200}
                value={form.logradouro} required onChange={(e) => set("logradouro", e.target.value)} />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="numero">Número</label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="numero" ref={numeroRef} type="text" maxLength={20}
                  value={form.numero} required onChange={(e) => set("numero", e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="complemento">Complemento <span className="optional">(opcional)</span></label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="complemento" type="text" autoComplete="address-line2" maxLength={200}
                  value={form.complemento} onChange={(e) => set("complemento", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="bairro">Bairro</label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="bairro" type="text" maxLength={120}
                  value={form.bairro} required onChange={(e) => set("bairro", e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="cidade">Cidade</label>
              <div className="input-wrapper">
                <Icon name="pin" size={18} className="input-icon" />
                <input id="cidade" type="text" autoComplete="address-level2" maxLength={120}
                  value={form.cidade} required onChange={(e) => set("cidade", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="contactType">Tipo</label>
              <select id="contactType" value={form.contactType}
                onChange={(e) => set("contactType", e.target.value)}>
                {contactTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="contactValue">Telefone</label>
              <div className="input-wrapper">
                <Icon name="chat" size={18} className="input-icon" />
                <input id="contactValue" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(00) 00000-0000"
                  value={form.contactValue} required onChange={(e) => set("contactValue", maskPhone(e.target.value))} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {loading ? "Salvando..." : "Finalizar cadastro"}
          </button>
        </form>
      </div>
    </main>
  );
}
