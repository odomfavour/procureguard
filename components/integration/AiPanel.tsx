'use client';
import { useState } from 'react';
import { useAgent, useLlm, readAskStream } from '@msflib/react-ai';
import { useDocuments } from '@msflib/react-documents';
import ChatBox, { type ChatMessage } from '@msflib/react-components/chat-ui';
import { MarkdownMessage } from '@msflib/react-components/markdown';
import { ResizablePane } from '@msflib/react-components/resizable-pane';
import { Section } from '@/components/ui/shared';
export default function AiPanel({
  run,
}: {
  run: (action: () => Promise<unknown>) => void;
}) {
  const llm = useLlm();
  const agent = useAgent();
  const docs = useDocuments();
  const [source, setSource] = useState('');
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [report, setReport] = useState(
    'Select an indexed document and request an evaluation.'
  );
  const [stream, setStream] = useState(false);
  const [conversation, setConversation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (!question.trim()) return;
    setBusy(true);
    const id = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: question },
      { id, role: 'assistant', content: 'Analyzing…' },
    ]);
    setValue('');
    const payload = {
      question,
      source_id: source || null,
      conversation_id: conversation,
    };
    try {
      if (stream) {
        const response = await agent.askStream(payload);
        if (!response.ok)
          throw new Error(`AI stream failed (${response.status}).`);
        let text = '';
        await readAskStream(response, (event) => {
          if (event.type === 'thought') return;
          text = event.type === 'replace' ? event.text : text + event.text;
          setReport(text);
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: text } : m))
          );
        });
      } else {
        const result = await llm.ask(payload);
        setConversation(result.conversation_id || null);
        setReport(
          `${result.answer}\n\n### Retrieved evidence\n${result.hits.map((h) => `- ${h.page_content}`).join('\n') || 'No evidence returned. Verify this answer manually.'}`
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: result.answer } : m))
        );
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                content:
                  'Request failed. Try again after checking backend availability.',
              }
            : m
        )
      );
      throw e;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Section title="Document-grounded AI evaluation">
      <label>
        Source document
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setConversation(null);
            setMessages([]);
            setReport('Document changed. Request a new evaluation.');
          }}
        >
          <option value="">Workspace corpus</option>
          {docs.documents
            .filter((d) => d.status === 'indexed')
            .map((d) => (
              <option key={d.record_id} value={d.source_key}>
                {d.name || d.source_key}
              </option>
            ))}
        </select>
      </label>
      <div className="actions">
        <label>
          <input
            type="checkbox"
            checked={stream}
            onChange={(e) => setStream(e.target.checked)}
          />{' '}
          Stream agent response
        </label>
        <button
          disabled={busy}
          onClick={() =>
            run(() =>
              ask(
                'Evaluate this vendor document against procurement due diligence: registration, compliance, delivery risk and missing evidence. Cite evidence and mark unsupported claims. Do not make an award decision.'
              )
            )
          }
        >
          Run buyer evaluation
        </button>
      </div>
      <p className="hint">
        Live API · {llm.status?.llm_model || 'Model status unavailable'} · Human
        approval required for awards.
      </p>
      <ResizablePane
        className="analysis-pane"
        panes={[
          {
            minSize: '25%',
            render: () => (
              <div className="pane-content">
                <MarkdownMessage content={report} />
              </div>
            ),
          },
          {
            minSize: '25%',
            render: () => (
              <ChatBox
                messages={messages}
                value={value}
                onChange={setValue}
                disabled={busy}
                onSend={(q) => run(() => ask(q))}
              />
            ),
          },
        ]}
      />
    </Section>
  );
}
