export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 grid gap-6">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <p>Falsify is a service for making and reviewing falsifiable predictions. We respect your privacy and protect your data. This Privacy Policy explains what we collect, why, and how you can control it. This policy is designed to meet GDPR requirements.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Who we are</h2>
        <p>Controller: Falsify</p>
        <p>Data Protection Officer (DPO): dpo@falsify.app</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">What data we collect</h2>
        <ul className="list-disc ml-6">
          <li>Account data: name (if provided), email address, authentication identifiers.</li>
          <li>Profile data: badges, reputation, activity.</li>
          <li>Content data: predictions, votes, comments, taxonomy tags, attachments you upload.</li>
          <li>Service data: device and log information (IP address, timestamps, basic analytics events).</li>
          <li>AI processing data: text you enter for AI scoring and suggestions.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">How we use your data</h2>
        <ul className="list-disc ml-6">
          <li>Provide and secure the service (accounts, predictions, votes, comments, storage).</li>
          <li>Show reputation, badges, and public activity you choose to share.</li>
          <li>Run AI features (plausibility scoring, vagueness detection, tag suggestions).</li>
          <li>Send essential emails (account verification, security, service notifications).</li>
          <li>Improve the product using anonymized or aggregated analytics.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Legal bases (GDPR)</h2>
        <ul className="list-disc ml-6">
          <li>Contract: to create and maintain your account and deliver core features you request.</li>
          <li>Legitimate interests: to keep the service secure, prevent abuse, measure performance, and improve features.</li>
          <li>Consent: optional analytics, optional emails that are not required to run your account.</li>
          <li>Legal obligation: to comply with law when required.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Cookies and analytics</h2>
        <ul className="list-disc ml-6">
          <li>We use essential cookies for sign-in and security.</li>
          <li>We use analytics to understand usage (Google Analytics and Firebase Performance). Where required, we ask for your consent.</li>
          <li>You can change your cookie preferences in your browser. If you block essential cookies, the service may not work.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">AI processing</h2>
        <ul className="list-disc ml-6">
          <li>We process your prediction text to provide scores and suggestions.</li>
          <li>AI processing may run on Google Cloud (Vertex AI). Text you submit for AI features may be processed by Google to provide the result. We do not sell your data.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Email</h2>
        <ul className="list-disc ml-6">
          <li>We send verification and essential service emails using SendGrid.</li>
          <li>You can control optional communications in your account settings (when available). Essential emails cannot be turned off.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Data sharing and processors</h2>
        <p>We use trusted processors to run the service:</p>
        <ul className="list-disc ml-6">
          <li>Google Cloud and Firebase (hosting, authentication, database, storage, functions, analytics).</li>
          <li>SendGrid (transactional email).</li>
        </ul>
        <p>Processors act under our instructions and provide security safeguards. We do not sell personal data.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">International transfers</h2>
        <p>Your data may be processed outside your country. We rely on appropriate safeguards (such as Standard Contractual Clauses) provided by our processors.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Data retention</h2>
        <ul className="list-disc ml-6">
          <li>Account data: kept while your account is active.</li>
          <li>Content data: kept while published and as needed for service records.</li>
          <li>Logs and analytics: kept for a limited time to secure and improve the service.</li>
          <li>We remove or anonymize data when it is no longer needed.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Your rights</h2>
        <p>Under GDPR, you can request:</p>
        <ul className="list-disc ml-6">
          <li>Access to your personal data.</li>
          <li>Correction of inaccurate data.</li>
          <li>Deletion of your data (right to be forgotten), if allowed by law.</li>
          <li>Restriction or objection to certain processing.</li>
          <li>Data portability.</li>
          <li>Withdrawal of consent at any time (for consent-based processing).</li>
        </ul>
        <p>To exercise your rights, contact: dpo@falsify.app. We will respond in line with legal requirements.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Security</h2>
        <ul className="list-disc ml-6">
          <li>We use encryption in transit and access controls.</li>
          <li>We apply least-privilege and monitor for abuse.</li>
          <li>No method is perfect, but we work to protect your data.</li>
        </ul>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Children</h2>
        <p>Falsify is not for children under 16. Do not create an account if you are under 16.</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Changes to this policy</h2>
        <p>We may update this policy. We will post changes here and update the date below.</p>
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
      </section>

      <section className="grid gap-2 bg-white rounded-lg shadow-subtle border border-neutralBorder p-4">
        <h2 className="text-lg font-medium">Contact</h2>
        <p>Email our DPO at dpo@falsify.app for privacy questions or requests.</p>
      </section>
    </main>
  );
}
