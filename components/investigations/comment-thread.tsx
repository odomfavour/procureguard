'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { addComment } from '@/lib/api/procureguard';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDateTime, initials } from '@/lib/utils';
import type { Comment } from '@/types';

interface CommentThreadProps {
  investigationId: string;
  initialComments: Comment[];
}

export function CommentThread({
  investigationId,
  initialComments,
}: CommentThreadProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const created = await addComment(investigationId, text);
      setComments((current) => [...current, created]);
      setBody('');
    } catch {
      setError('Your comment could not be posted. Try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <ul className="flex flex-col gap-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand"
            >
              {initials(comment.authorName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{comment.authorName}</span>{' '}
                <span className="text-xs text-ink-soft">
                  {ROLE_LABELS[comment.authorRole]} /{' '}
                  {formatDateTime(comment.createdAt)}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">{comment.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="comment" className="sr-only">
          Add a comment
        </label>
        <Textarea
          id="comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment, attach context or note what you asked the vendor"
        />
        {error && (
          <p role="alert" className="text-sm text-risk-high">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={posting || body.trim().length === 0}
          >
            {posting ? 'Posting...' : 'Post comment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
