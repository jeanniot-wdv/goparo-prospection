"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, Copy, Globe, Loader2, Mail, Phone, SearchX } from "lucide-react";
import type { Garage, GaragesListResponse, Segment, UpdateGaragePayload } from "@/lib/types";

type View = "liste" | "fiche";
type SegmentFilter = Segment | "all";
type ConfirmDialog = "email" | "tel" | null;
type ActiveInput = "tel" | "email" | "siteWeb" | null;

// Cf. tableau de mise à jour de Prospection_active (point 5 du brief) :
// un email saisi (seul ou avec tél.) ferme le cas en "À prospecter".
const EMAIL_SAISI_PROPS: UpdateGaragePayload = {
  emailType: "Pro",
  statutActivite: "inconnu",
  confiance: "haute",
  prospectionActive: "À prospecter",
  notesIa: "Ajouté manuellement par l'équipe",
};

const SEGMENT_LABELS: Record<SegmentFilter, string> = {
  all: "Tous",
  structure_employeuse: "Structure employeuse",
  solo_non_employeur: "Solo non employeur",
};

function buildGaragesUrl(params: {
  segment: SegmentFilter;
  hideFranchise: boolean;
  enseigneOnly: boolean;
  cursor?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.segment !== "all") search.set("segment", params.segment);
  search.set("hideFranchise", String(params.hideFranchise));
  search.set("enseigneOnly", String(params.enseigneOnly));
  if (params.cursor) search.set("cursor", params.cursor);
  return `/api/garages?${search.toString()}`;
}

function getNomAffiche(garage: Garage): string {
  return garage.enseigne && garage.enseigne.trim() !== "" ? garage.enseigne : garage.nom;
}

export default function Home() {
  const [view, setView] = useState<View>("liste");

  // Filtres liste
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [hideFranchise, setHideFranchise] = useState(true);
  const [enseigneOnly, setEnseigneOnly] = useState(true);

  // Données liste
  const [garages, setGarages] = useState<Garage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Fiche
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [telValue, setTelValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [siteWebValue, setSiteWebValue] = useState("");
  const [telSaved, setTelSaved] = useState<string | null>(null);
  const [emailSaved, setEmailSaved] = useState<string | null>(null);
  const [siteWebSaved, setSiteWebSaved] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<ActiveInput>(null);
  const [ficheError, setFicheError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [showFermerModal, setShowFermerModal] = useState(false);
  const [fermerSaving, setFermerSaving] = useState(false);
  const [noCoordSaving, setNoCoordSaving] = useState(false);

  const fetchGarages = useCallback(
    async (options: { reset: boolean }) => {
      if (options.reset) {
        setLoadingList(true);
        setListError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const url = buildGaragesUrl({
          segment: segmentFilter,
          hideFranchise,
          enseigneOnly,
          cursor: options.reset ? null : nextCursor,
        });
        const res = await fetch(url);
        const data = (await res.json()) as GaragesListResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement");
        }

        setGarages((prev) => (options.reset ? data.garages : [...prev, ...data.garages]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [segmentFilter, hideFranchise, enseigneOnly, nextCursor]
  );

  // Chargement initial + rechargement quand les filtres changent
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche un fetch async, le setState réel a lieu après l'await
    fetchGarages({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentFilter, hideFranchise, enseigneOnly]);

  function openGarage(garage: Garage) {
    setSelectedGarage(garage);
    setCopied(false);
    setActiveInput(null);
    setTelValue("");
    setEmailValue("");
    setSiteWebValue("");
    setTelSaved(null);
    setEmailSaved(null);
    setSiteWebSaved(null);
    setSavingField(null);
    setFicheError(null);
    setConfirmDialog(null);
    setShowFermerModal(false);
    setFermerSaving(false);
    setNoCoordSaving(false);
    setView("fiche");
  }

  function returnToList() {
    setView("liste");
    setSelectedGarage(null);
    fetchGarages({ reset: true });
  }

  async function handleCopy() {
    if (!selectedGarage) return;
    const text = `Téléphone et email du garage ${getNomAffiche(selectedGarage)} à ${selectedGarage.commune}. Si l'email n'est pas trouvé directement, vérifie les mentions légales du site du garage s'il en a un.`.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // presse-papier indisponible, on ignore silencieusement
    }
  }

  async function patchGarage(id: string, body: UpdateGaragePayload) {
    const res = await fetch(`/api/garages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de la mise à jour");
    }
    return data;
  }

  async function handleValiderTel() {
    if (!selectedGarage || !telValue.trim()) return;
    setSavingField("tel");
    setFicheError(null);
    try {
      await patchGarage(selectedGarage.id, { telephone: telValue.trim() });
      setTelSaved(telValue.trim());
      setActiveInput(null);
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingField(null);
    }
  }

  async function handleValiderEmail() {
    if (!selectedGarage || !emailValue.trim()) return;
    setSavingField("email");
    setFicheError(null);
    try {
      await patchGarage(selectedGarage.id, { email: emailValue.trim() });
      setEmailSaved(emailValue.trim());
      setActiveInput(null);
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingField(null);
    }
  }

  async function handleValiderSiteWeb() {
    if (!selectedGarage || !siteWebValue.trim()) return;
    setSavingField("siteWeb");
    setFicheError(null);
    try {
      await patchGarage(selectedGarage.id, { siteWeb: siteWebValue.trim() });
      setSiteWebSaved(siteWebValue.trim());
      setActiveInput(null);
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingField(null);
    }
  }

  async function handleAucuneCoordonnee() {
    if (!selectedGarage) return;
    setNoCoordSaving(true);
    setFicheError(null);
    try {
      await patchGarage(selectedGarage.id, {
        telNonTrouve: true,
        emailNonTrouve: true,
        prospectionActive: "À enrichir",
        notesIa: "Recherche manuelle effectuée, aucune coordonnée trouvée",
      });
      returnToList();
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setNoCoordSaving(false);
    }
  }

  async function handleRetourListe() {
    if (telSaved === null && emailSaved === null) {
      returnToList();
      return;
    }
    if (telSaved !== null && emailSaved === null) {
      setConfirmDialog("email");
      return;
    }
    if (emailSaved !== null && telSaved === null) {
      setConfirmDialog("tel");
      return;
    }
    // Les deux ont été saisis : email saisi avec tél., pas de dialogue
    if (selectedGarage) {
      try {
        await patchGarage(selectedGarage.id, EMAIL_SAISI_PROPS);
      } catch (err) {
        setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    }
    returnToList();
  }

  function handleConfirmOui() {
    // Trouvé : on reste sur la fiche, le temps de le saisir. Pas de patch ni de retour liste.
    setConfirmDialog(null);
  }

  async function handleConfirmNon() {
    if (!selectedGarage || !confirmDialog) return;
    setConfirmSaving(true);
    try {
      if (confirmDialog === "email") {
        await patchGarage(selectedGarage.id, { emailNonTrouve: true, prospectionActive: "À enrichir" });
      } else {
        await patchGarage(selectedGarage.id, { telNonTrouve: true, prospectionActive: "À enrichir" });
      }
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setConfirmSaving(false);
      setConfirmDialog(null);
      returnToList();
    }
  }

  async function deleteGarage(id: string) {
    const res = await fetch(`/api/garages/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de l'archivage");
    }
    return data;
  }

  function handleFermerClick() {
    setShowFermerModal(true);
  }

  function handleFermerAnnuler() {
    setShowFermerModal(false);
  }

  async function handleFermerConfirmer() {
    if (!selectedGarage) return;
    setFermerSaving(true);
    setFicheError(null);
    try {
      await deleteGarage(selectedGarage.id);
      setShowFermerModal(false);
      returnToList();
    } catch (err) {
      setFicheError(err instanceof Error ? err.message : "Erreur inconnue");
      setShowFermerModal(false);
    } finally {
      setFermerSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {view === "liste" ? (
        <ListeView
          segmentFilter={segmentFilter}
          setSegmentFilter={setSegmentFilter}
          hideFranchise={hideFranchise}
          setHideFranchise={setHideFranchise}
          enseigneOnly={enseigneOnly}
          setEnseigneOnly={setEnseigneOnly}
          garages={garages}
          loadingList={loadingList}
          loadingMore={loadingMore}
          listError={listError}
          hasMore={hasMore}
          onLoadMore={() => fetchGarages({ reset: false })}
          onSelect={openGarage}
        />
      ) : (
        selectedGarage && (
          <FicheView
            garage={selectedGarage}
            copied={copied}
            onCopy={handleCopy}
            activeInput={activeInput}
            setActiveInput={setActiveInput}
            telValue={telValue}
            setTelValue={setTelValue}
            emailValue={emailValue}
            setEmailValue={setEmailValue}
            siteWebValue={siteWebValue}
            setSiteWebValue={setSiteWebValue}
            telSaved={telSaved}
            emailSaved={emailSaved}
            siteWebSaved={siteWebSaved}
            savingField={savingField}
            noCoordSaving={noCoordSaving}
            ficheError={ficheError}
            onValiderTel={handleValiderTel}
            onValiderEmail={handleValiderEmail}
            onValiderSiteWeb={handleValiderSiteWeb}
            onAucuneCoordonnee={handleAucuneCoordonnee}
            onRetourListe={handleRetourListe}
            onFermerClick={handleFermerClick}
          />
        )
      )}

      {confirmDialog && (
        <ConfirmModal
          question={confirmDialog === "email" ? "Email trouvé ?" : "Téléphone trouvé ?"}
          saving={confirmSaving}
          onOui={handleConfirmOui}
          onNon={handleConfirmNon}
        />
      )}

      {showFermerModal && (
        <ConfirmModal
          question="Confirmer : ce garage est fermé définitivement ? Il sera retiré de la liste (récupérable dans la corbeille Notion pendant 30 jours)."
          saving={fermerSaving}
          onOui={handleFermerConfirmer}
          onNon={handleFermerAnnuler}
          labelOui="Confirmer"
          labelNon="Annuler"
          danger
        />
      )}
    </div>
  );
}

function ListeView({
  segmentFilter,
  setSegmentFilter,
  hideFranchise,
  setHideFranchise,
  enseigneOnly,
  setEnseigneOnly,
  garages,
  loadingList,
  loadingMore,
  listError,
  hasMore,
  onLoadMore,
  onSelect,
}: {
  segmentFilter: SegmentFilter;
  setSegmentFilter: (s: SegmentFilter) => void;
  hideFranchise: boolean;
  setHideFranchise: (v: boolean) => void;
  enseigneOnly: boolean;
  setEnseigneOnly: (v: boolean) => void;
  garages: Garage[];
  loadingList: boolean;
  loadingMore: boolean;
  listError: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (g: Garage) => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-8 pt-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-primary">Goparo Prospection</h1>
        <p className="text-sm text-neutral-500">Garages sans téléphone ni email</p>
      </header>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
          Segment
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as SegmentFilter)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {(Object.keys(SEGMENT_LABELS) as SegmentFilter[]).map((key) => (
              <option key={key} value={key}>
                {SEGMENT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between text-sm font-medium text-neutral-700">
          Masquer franchises suspectées
          <button
            type="button"
            role="switch"
            aria-checked={hideFranchise}
            onClick={() => setHideFranchise(!hideFranchise)}
            className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              hideFranchise ? "bg-primary" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                hideFranchise ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between text-sm font-medium text-neutral-700">
          Enseigne uniquement
          <button
            type="button"
            role="switch"
            aria-checked={enseigneOnly}
            onClick={() => setEnseigneOnly(!enseigneOnly)}
            className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              enseigneOnly ? "bg-primary" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enseigneOnly ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {listError && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{listError}</p>
      )}

      {loadingList ? (
        <div className="flex flex-1 items-center justify-center py-12 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : garages.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">Aucun garage à traiter.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {garages.map((garage) => (
            <li key={garage.id}>
              <button
                type="button"
                onClick={() => onSelect(garage)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-neutral-50"
              >
                <p className="font-semibold text-neutral-900">{getNomAffiche(garage) || "(sans nom)"}</p>
                <p className="text-sm text-neutral-500">{garage.commune}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !loadingList && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition active:scale-[0.99] disabled:opacity-60"
        >
          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
          Charger plus
        </button>
      )}
    </div>
  );
}

function FicheView({
  garage,
  copied,
  onCopy,
  activeInput,
  setActiveInput,
  telValue,
  setTelValue,
  emailValue,
  setEmailValue,
  siteWebValue,
  setSiteWebValue,
  telSaved,
  emailSaved,
  siteWebSaved,
  savingField,
  noCoordSaving,
  ficheError,
  onValiderTel,
  onValiderEmail,
  onValiderSiteWeb,
  onAucuneCoordonnee,
  onRetourListe,
  onFermerClick,
}: {
  garage: Garage;
  copied: boolean;
  onCopy: () => void;
  activeInput: ActiveInput;
  setActiveInput: (v: ActiveInput) => void;
  telValue: string;
  setTelValue: (v: string) => void;
  emailValue: string;
  setEmailValue: (v: string) => void;
  siteWebValue: string;
  setSiteWebValue: (v: string) => void;
  telSaved: string | null;
  emailSaved: string | null;
  siteWebSaved: string | null;
  savingField: ActiveInput;
  noCoordSaving: boolean;
  ficheError: string | null;
  onValiderTel: () => void;
  onValiderEmail: () => void;
  onValiderSiteWeb: () => void;
  onAucuneCoordonnee: () => void;
  onRetourListe: () => void;
  onFermerClick: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-8 pt-6">
      <button
        type="button"
        onClick={onRetourListe}
        className="mb-4 flex w-fit items-center gap-1 text-sm font-medium text-neutral-500"
      >
        <ChevronLeft className="h-4 w-4" />
        Liste
      </button>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-neutral-900">{getNomAffiche(garage) || "(sans nom)"}</h2>
            <button
              type="button"
              onClick={onCopy}
              aria-label="Copier nom et commune"
              className="shrink-0 rounded-md border border-neutral-200 p-2 text-neutral-500 transition active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {garage.enseigne.trim() !== "" && (
            <p className="mt-0.5 text-xs text-neutral-400">Nom légal : {garage.nom}</p>
          )}
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="text-neutral-400">Adresse</dt>
            <dd className="text-neutral-800">{garage.adresse || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Commune</dt>
            <dd className="text-neutral-800">{garage.commune || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Dirigeant</dt>
            <dd className="text-neutral-800">{garage.dirigeant || "—"}</dd>
          </div>
        </dl>

        {telSaved && (
          <p className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
            <Phone className="h-4 w-4" /> {telSaved}
          </p>
        )}
        {emailSaved && (
          <p className="mt-2 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
            <Mail className="h-4 w-4" /> {emailSaved}
          </p>
        )}
        {siteWebSaved && (
          <p className="mt-2 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
            <Globe className="h-4 w-4" /> {siteWebSaved}
          </p>
        )}
      </div>

      {ficheError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{ficheError}</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {activeInput === "tel" && (
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              autoFocus
              value={telValue}
              onChange={(e) => setTelValue(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={onValiderTel}
              disabled={savingField === "tel" || !telValue.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {savingField === "tel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
            </button>
          </div>
        )}

        {activeInput === "email" && (
          <div className="flex gap-2">
            <input
              type="email"
              inputMode="email"
              autoFocus
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="contact@garage.fr"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={onValiderEmail}
              disabled={savingField === "email" || !emailValue.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {savingField === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
            </button>
          </div>
        )}

        {activeInput === "siteWeb" && (
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              autoFocus
              value={siteWebValue}
              onChange={(e) => setSiteWebValue(e.target.value)}
              placeholder="https://garage.fr"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={onValiderSiteWeb}
              disabled={savingField === "siteWeb" || !siteWebValue.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {savingField === "siteWeb" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveInput(activeInput === "tel" ? null : "tel")}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition active:scale-[0.99]"
        >
          <Phone className="h-4 w-4" />
          {telSaved ? "Modifier tél." : "Ajouter tél."}
        </button>

        <button
          type="button"
          onClick={() => setActiveInput(activeInput === "email" ? null : "email")}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition active:scale-[0.99]"
        >
          <Mail className="h-4 w-4" />
          {emailSaved ? "Modifier email" : "Ajouter email"}
        </button>

        <button
          type="button"
          onClick={() => setActiveInput(activeInput === "siteWeb" ? null : "siteWeb")}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition active:scale-[0.99]"
        >
          <Globe className="h-4 w-4" />
          {siteWebSaved ? "Modifier site web" : "Ajouter site web"}
        </button>

        <button
          type="button"
          onClick={onAucuneCoordonnee}
          disabled={noCoordSaving}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 transition active:scale-[0.99] disabled:opacity-60"
        >
          {noCoordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchX className="h-4 w-4" />}
          Aucune coordonnées trouvée
        </button>

        <button
          type="button"
          onClick={onRetourListe}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 transition active:scale-[0.99]"
        >
          Retour liste
        </button>

        <div className="mt-2 border-t border-neutral-200 pt-3 text-center">
          <button
            type="button"
            onClick={onFermerClick}
            className="text-xs font-medium text-red-600 underline-offset-2 active:underline"
          >
            Fermé définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  question,
  saving,
  onOui,
  onNon,
  labelOui = "Oui",
  labelNon = "Non",
  danger = false,
}: {
  question: string;
  saving: boolean;
  onOui: () => void;
  onNon: () => void;
  labelOui?: string;
  labelNon?: string;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xs rounded-lg bg-white p-5 shadow-lg">
        <p className="mb-4 text-center text-base font-medium text-neutral-900">{question}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onNon}
            disabled={saving}
            className="flex-1 rounded-md border border-neutral-300 py-2 text-sm font-medium text-neutral-700 disabled:opacity-60"
          >
            {labelNon}
          </button>
          <button
            type="button"
            onClick={onOui}
            disabled={saving}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
              danger ? "bg-red-600" : "bg-primary"
            }`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {labelOui}
          </button>
        </div>
      </div>
    </div>
  );
}
