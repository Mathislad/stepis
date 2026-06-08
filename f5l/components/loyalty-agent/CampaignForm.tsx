"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import {
  saveCampaignAction,
  type CampaignFormState,
} from "@/lib/loyalty-agent/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";

const INITIAL: CampaignFormState = { ok: false, error: null };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

export function CampaignForm({ campaign }: { campaign?: CampaignWithTemplate }) {
  const [state, formAction, pending] = useActionState(saveCampaignAction, INITIAL);
  const template = campaign?.templateData;

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      {campaign && <input type="hidden" name="campaignId" value={campaign.id} />}

      <Field label="Nom interne">
        <Input
          name="name"
          required
          defaultValue={template?.name ?? ""}
          placeholder="Anniversaire client"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Déclencheur">
          <Select name="trigger" required defaultValue={campaign?.trigger ?? "birthday"}>
            <option value="birthday">Anniversaire</option>
            <option value="inactive">Client inactif</option>
            <option value="post_purchase">Après achat</option>
            <option value="seasonal">Campagne saisonnière</option>
          </Select>
        </Field>
        <Field label="Canal">
          <Select name="channel" required defaultValue={campaign?.channel ?? "sms"}>
            <option value="sms">SMS</option>
            <option value="email">E-mail</option>
            <option value="whatsapp">WhatsApp</option>
          </Select>
        </Field>
      </div>

      <Field label="Seuil d'inactivité (jours)">
        <Input
          name="inactiveDays"
          type="number"
          min="1"
          defaultValue={template?.inactiveDays?.toString() ?? "30"}
          placeholder="30"
        />
      </Field>

      <Field label="Objet e-mail">
        <Input
          name="subject"
          defaultValue={template?.subject ?? ""}
          placeholder="Une attention pour vous"
        />
      </Field>

      <Field label="Message">
        <Textarea
          name="body"
          required
          rows={5}
          defaultValue={template?.body ?? ""}
          placeholder="Bonjour {{prenom}}, votre offre vous attend chez {{commerce}}."
        />
      </Field>

      <Field label="Offre associée">
        <Input
          name="offer"
          defaultValue={template?.offer ?? ""}
          placeholder="-10% sur votre prochain passage"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={campaign?.active ?? false} />
        Activer la campagne
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : campaign ? "Enregistrer" : "Créer la campagne"}
        </button>
      </div>
    </form>
  );
}
