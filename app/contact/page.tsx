import { A, P } from "@/components/typography";

export default function Contact() {
  return (
    <div className="w-full">
      <h1 className="sr-only">Contact</h1>
      <P>
        I{`'`}m open to chatting about engineering, game dev, or side projects.
        Reach me on{" "}
        <A href="https://linkedin.com/in/arham-humayun">LinkedIn</A> or{" "}
        <A href="https://x.com/arham_humayun99">X</A>.
      </P>
    </div>
  );
}
