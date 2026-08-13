import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { createServerSupabase, getCurrentProfile } from "@/lib/supabase/server";
import PostComposer from "./PostComposer";
import ReplyForm from "./ReplyForm";
import RemoveButton from "./RemoveButton";

export const metadata: Metadata = {
  title: `Community Board | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

function when(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CommunityBoardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/portal/login?next=/portal/board");

  const supabase = await createServerSupabase();

  const [{ data: posts }, { data: replies }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, profile_id, author_name, body, removed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("post_replies")
      .select("id, post_id, profile_id, author_name, body, removed_at, created_at")
      .order("created_at"),
  ]);

  // Removed items stay in the database as a moderation record but are hidden
  // from everyone here, including the author.
  const visiblePosts = (posts ?? []).filter((p) => !p.removed_at);
  const repliesByPost = new Map<string, typeof replies>();
  for (const reply of replies ?? []) {
    if (reply.removed_at) continue;
    const list = repliesByPost.get(reply.post_id) ?? [];
    list.push(reply);
    repliesByPost.set(reply.post_id, list);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-14">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
          Community Board
        </h1>
        <p className="mt-2 text-stone-600">
          Ask questions, share news, and discuss neighborhood topics with other
          Fernewood residents. Only signed-in residents can see this.
        </p>
      </div>

      <PostComposer name={profile.full_name} />

      {visiblePosts.length === 0 && (
        <p className="text-stone-600">
          Nothing posted yet — start the first conversation.
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {visiblePosts.map((post) => {
          const postReplies = repliesByPost.get(post.id) ?? [];
          return (
            <li
              key={post.id}
              className="rounded-lg border border-emerald-900/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-emerald-950">
                    {post.author_name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {when(post.created_at)}
                  </p>
                </div>
                {(post.profile_id === profile.id || profile.is_admin) && (
                  <RemoveButton
                    id={post.id}
                    kind="post"
                    isAuthor={post.profile_id === profile.id}
                  />
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-stone-800">
                {post.body}
              </p>

              {postReplies.length > 0 && (
                <ul className="mt-4 flex flex-col gap-3 border-l-2 border-emerald-900/10 pl-4">
                  {postReplies.map((reply) => (
                    <li key={reply.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-emerald-900">
                          {reply.author_name}{" "}
                          <span className="font-normal text-stone-500">
                            · {when(reply.created_at)}
                          </span>
                        </p>
                        {(reply.profile_id === profile.id ||
                          profile.is_admin) && (
                          <RemoveButton
                            id={reply.id}
                            kind="reply"
                            isAuthor={reply.profile_id === profile.id}
                          />
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
                        {reply.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <ReplyForm postId={post.id} />
            </li>
          );
        })}
      </ul>

      <Link
        href="/portal/home"
        className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
      >
        &larr; Back to the portal
      </Link>
    </div>
  );
}
