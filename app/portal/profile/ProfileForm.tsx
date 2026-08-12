"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfile, type ProfileState } from "./actions";

const initial: ProfileState = { status: "idle" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function ProfileForm({
  profile,
}: {
  profile: {
    full_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    in_directory: boolean;
    show_phone: boolean;
    show_email: boolean;
  };
}) {
  const [state, formAction] = useActionState(saveProfile, initial);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      {state.status !== "idle" && state.message && (
        <p
          role="alert"
          className={
            state.status === "error"
              ? "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
              : "rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          }
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="full_name" className="text-sm font-medium text-emerald-950">
          Name
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={profile.full_name}
          className="w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-emerald-950">
          Phone <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          className="w-full rounded-md border border-emerald-900/20 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
        />
      </div>

      <div className="rounded-lg border border-emerald-900/10 bg-stone-50 p-4">
        <p className="text-sm font-medium text-emerald-950">
          Set by the board
        </p>
        <p className="mt-1 text-sm text-stone-600">
          Address: {profile.address ?? "not linked"}
          <br />
          Sign-in email: {profile.email ?? "—"}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Your property address determines which covenants apply to you, so
          only the board can change it. Contact them if it&apos;s wrong.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-emerald-950">
          Directory listing
        </legend>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="in_directory"
            defaultChecked={profile.in_directory}
            className="mt-0.5"
          />
          <span>
            List me in the resident directory
            <span className="block text-xs text-stone-500">
              Other signed-in residents will see your name, address, and phase.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="show_phone"
            defaultChecked={profile.show_phone}
            className="mt-0.5"
          />
          <span>
            Show my phone number
            <span className="block text-xs text-stone-500">
              Only applies if you&apos;re listed.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="show_email"
            defaultChecked={profile.show_email}
            className="mt-0.5"
          />
          <span>
            Show my email address
            <span className="block text-xs text-stone-500">
              Only applies if you&apos;re listed.
            </span>
          </span>
        </label>
      </fieldset>

      <SaveButton />
    </form>
  );
}
