import Image from "next/image";
import Link from "next/link";
import icon from "../../samplecode/android-chrome-512x512.png";

export const metadata = {
  title: "About Falsify",
  description: "Why Falsify exists: bringing falsifiable, time-boxed predictions to online discourse.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 grid gap-6">
      <div className="flex items-start gap-4">
        <Image src={icon} alt="Falsify icon" width={64} height={64} className="rounded" />
        <div>
          <h1 className="text-2xl font-semibold">About Falsify</h1>
          <p className="text-sm text-neutral-600 mt-1">A platform for testable predictions—clear metrics, real deadlines, and verifiable outcomes.</p>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">The Problem: Endless Debates, No Resolution</h2>
        <p>
          The internet is drowning in <strong>hot takes, vague claims, and unfalsifiable arguments</strong>. From politics to tech to climate change, discussions too often devolve into:
        </p>
        <ul className="list-disc pl-6 text-neutral-800">
          <li><em>"X will happen… someday."</em></li>
          <li><em>"Y is obviously true!"</em> (with no evidence).</li>
          <li><em>"The world is doomed!"</em> (but no timeline or metric).</li>
          <li><em>"Experts say…"</em> (but which experts? By when? How?)</li>
        </ul>
        <p>
          We argue in circles because <strong>most online discourse lacks structure</strong>. There’s no accountability for being wrong, no reward for being precise, and no way to track who called it right. The result? <strong>Noise, tribalism, and zero progress</strong>.
        </p>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">The Solution: Falsifiable, Time-Boxed Predictions</h2>
        <p>
          Falsify is a platform for <strong>making testable predictions</strong>—with clear metrics, deadlines, and outcomes. Here, you don’t just <em>opine</em>; you <strong>commit</strong>. You don’t just <em>argue</em>; you <strong>measure</strong>. And when the time comes, we all find out who was right.
        </p>
        <p className="font-medium">How it works:</p>
        <ol className="list-decimal pl-6 text-neutral-800 grid gap-1">
          <li><strong>Make a prediction</strong> with a <strong>specific metric</strong> (e.g., <em>"US GDP will drop below Brazil’s by 2040"</em>).</li>
          <li><strong>Set a timebox</strong> (no "someday"—just hard deadlines).</li>
          <li><strong>Let the AI and community score it</strong> for boldness and relevance.</li>
          <li><strong>Wait for the outcome</strong>—then claim your bragging rights (or eat humble pie).</li>
        </ol>
        <p>No hand-waving. No moving goalposts. Just <strong>falsifiable claims</strong> and <strong>verifiable results</strong>.</p>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Why Falsifiability? A Lesson from Karl Popper</h2>
        <p>
          The philosopher <strong>Karl Popper</strong> argued that the hallmark of scientific thinking isn’t proving things <em>true</em>—it’s defining them in a way that they <em>could be proven false</em>. A statement like <em>"God exists"</em> isn’t falsifiable; a statement like <em>"If we pray for rain, the drought will end in 30 days"</em> is.
        </p>
        <p>Popper’s idea changed science forever. <strong>Falsify brings it to the internet.</strong></p>
        <ul className="list-disc pl-6 text-neutral-800">
          <li><strong>Good prediction:</strong> <em>"Bitcoin will exceed $100K by December 31, 2025."</em> (We can check.)</li>
          <li><strong>Bad prediction:</strong> <em>"Crypto is the future."</em> (Too vague. When? How?)</li>
        </ul>
        <p>On Falsify, <strong>every claim must be testable</strong>. If it can’t be wrong, it doesn’t belong here.</p>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Why This Matters</h2>
        <ol className="list-decimal pl-6 text-neutral-800 grid gap-1">
          <li><strong>Sharpens Thinking</strong> — Vague claims get flagged. Lazy arguments get downvoted. <strong>Precision is rewarded.</strong></li>
          <li><strong>Builds Accountability</strong> — No more <em>"I meant…"</em> after the fact. Your predictions are <strong>locked in time</strong>.</li>
          <li><strong>Creates a Record</strong> — Who predicted what, when, and why? Falsify <strong>archives the good, the bad, and the wildly wrong</strong>—so we can learn from history.</li>
          <li><strong>Makes Debates Fun (and Useful)</strong> — Instead of yelling into the void, you <strong>compete on accuracy</strong>. The best forecasters rise to the top.</li>
        </ol>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">The Stakes: Bragging Rights and Digital Fame</h2>
        <p>There’s no money here. No ads. No paywalls. Just:</p>
        <ul className="list-disc pl-6 text-neutral-800">
          <li><strong>Reputation points</strong> for accurate predictions.</li>
          <li><strong>Leaderboards</strong> for the boldest (and most correct) forecasters.</li>
          <li><strong>A permanent record</strong> of who saw the future clearly—and who didn’t.</li>
        </ul>
      </section>

      <section className="grid gap-3">
        <h3 className="text-base font-semibold">Who Is This For?</h3>
        <ul className="list-disc pl-6 text-neutral-800">
          <li><strong>Curious minds</strong> who want to test their intuition.</li>
          <li><strong>Analysts, traders, and researchers</strong> who live by data.</li>
          <li><strong>Policy wonks, techies, and futurists</strong> who love a good debate—but hate nonsense.</li>
          <li><strong>Anyone tired of hot takes</strong> and hungry for <strong>real intellectual sparring</strong>.</li>
        </ul>
      </section>

      <section className="grid gap-3">
        <h3 className="text-base font-semibold">The Rules</h3>
        <ol className="list-decimal pl-6 text-neutral-800 grid gap-1">
          <li><strong>No weasel words.</strong> If your prediction can’t be measured, it gets flagged.</li>
          <li><strong>No editing after the fact.</strong> Once the timebox closes, the record is sealed.</li>
          <li><strong>No hard feelings.</strong> Being wrong is how we learn.</li>
        </ol>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Join the Experiment</h2>
        <p>
          Falsify isn’t about being right all the time. It’s about <strong>being wrong in interesting ways</strong>—and <strong>right in verifiable ones</strong>.
        </p>
        <div>
          <Link href="/" className="inline-flex items-center px-3 py-2 rounded-md border border-neutralBorder hover:bg-neutralBg text-sm">Make Your First Prediction →</Link>
        </div>
        <blockquote className="text-sm text-neutral-700 border-l-2 border-neutralBorder pl-3">
          "The game of science is, in principle, without end. He who decides one day that scientific statements do not call for any further test, and that they can be regarded as finally verified, retires from the game."
          <br />— <strong>Karl Popper</strong>, <em>Conjectures and Refutations</em>
        </blockquote>
      </section>

      <hr className="border-neutralBorder" />

      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Dedication</h2>
        <p>
          This project is dedicated to <strong>Karl Popper (1902–1994)</strong>, philosopher of science, best known for the principle of <em>falsifiability</em> and for advancing critical rationalism. Popper argued that scientific theories progress through bold conjectures and rigorous attempts to refute them—an ethos Falsify brings to modern discourse.
        </p>
      </section>
    </main>
  );
}
