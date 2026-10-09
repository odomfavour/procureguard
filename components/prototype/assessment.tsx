'use client';
import { useState } from 'react';
import ChatBox, { type ChatMessage } from '@msflib/react-components/chat-ui';
import { MarkdownMessage } from '@msflib/react-components/markdown';
import { ResizablePane } from '@msflib/react-components/resizable-pane';
import type { Application, Tender } from '@/lib/prototype';
import { Action } from './portal';
export function Assessment({
  application: a,
  tender: t,
  onAnalyze,
}: {
  application: Application;
  tender: Tender;
  onAnalyze: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const report = a.analysis
    ? `## Assessment: ${t.title}\n**Score:** ${a.analysis.score}/100 · **Compliance:** ${a.analysis.compliance}% · **Risk:** ${a.analysis.risk}\n\n${a.analysis.findings.map((f) => `- ${f}`).join('\n')}\n\n*Simulated completeness and budget checks. File contents were not read or independently verified.*`
    : 'No analysis has been run on this submission.';
  return (
    <>
      <p className="mb-4 text-xs text-ink-soft">
        Demo-only assessment. Buyer-triggered checks; no model call or file
        verification.
      </p>
      <Action onClick={onAnalyze}>
        {a.analysis ? 'Run assessment again' : 'Analyze submission'}
      </Action>
      <ResizablePane
        direction="vertical"
        style={{
          height: 650,
          marginTop: 20,
          border: '1px solid #dce1e9',
          borderRadius: 8,
        }}
        panes={[
          {
            minSize: 150,
            initialSize: '50%',
            render: () => (
              <div className="h-full overflow-auto p-4">
                <MarkdownMessage content={report} />
              </div>
            ),
          },
          {
            minSize: 180,
            render: () => (
              <ChatBox
                messages={messages}
                value={value}
                onChange={setValue}
                placeholder="Ask about this demo assessment"
                onSend={(question) => {
                  if (!question.trim()) return;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      role: 'user',
                      content: question,
                    },
                    {
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: a.analysis
                        ? `Demo assessment evidence:\n${a.analysis.findings.map((f) => `- ${f}`).join('\n')}\n\nThis response repeats the deterministic findings. Use the live MSFLib workspace for document-grounded questions.`
                        : 'Run the demo assessment first to see completeness and budget findings.',
                    },
                  ]);
                  setValue('');
                }}
              />
            ),
          },
        ]}
      />
    </>
  );
}
