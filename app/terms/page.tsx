export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 grid gap-6">
      <h1 className="text-2xl font-semibold">Terms & Conditions</h1>
      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <p>These are the basic terms for using Falsify. Please read them. By using Falsify, you agree to these terms.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Service</h2>
        <p>Falsify lets you create and review falsifiable predictions. Content you post may be public.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Your account</h2>
        <ul className="list-disc ml-6">
          <li>Keep your account secure. You are responsible for your activity.</li>
          <li>Follow the law and be respectful. Do not post illegal or harmful content.</li>
          <li>We may suspend or remove accounts that break these rules.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Content</h2>
        <ul className="list-disc ml-6">
          <li>You own the content you create. You give us a license to host and display it on Falsify.</li>
          <li>We may remove content that breaks the rules or law.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">AI</h2>
        <p>AI scores and suggestions are informational. They may be wrong. Do not rely on them as advice.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Liability</h2>
        <p>Falsify is provided “as is.” We do not guarantee accuracy or uptime. To the extent allowed by law, we are not liable for damages.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Changes</h2>
        <p>We may update these terms. We will post changes here and update the date below.</p>
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </section>
    </main>
  );
}
