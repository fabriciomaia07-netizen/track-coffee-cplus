"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addComment } from "@/lib/actions/receitas";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  commenter_name: string;
}

interface CommentSectionProps {
  recipeId: string;
  comments: Comment[];
}

export function CommentSection({ recipeId, comments }: CommentSectionProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await addComment(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setCommentText("");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {comment.commenter_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("common.noResults")}
        </p>
      )}

      <form action={handleSubmit} className="flex gap-2">
        <input type="hidden" name="recipe_id" value={recipeId} />
        <Input
          name="content"
          placeholder={t("recipes.addComment")}
          required
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={loading}>
          <Send className="h-4 w-4" />
          <span className="sr-only">{t("recipes.postComment")}</span>
        </Button>
      </form>
    </div>
  );
}
