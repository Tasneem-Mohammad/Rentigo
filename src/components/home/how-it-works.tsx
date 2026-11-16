import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";
const steps = [
  { number: "01", label: "Discovery", title: "Find your kind of useful.", description: "Browse things around your neighbourhood. See the daily price, owner-reported condition, and approximate pickup area before starting a conversation.", note: "Nearby discovery", icon: "search" as const },
  { number: "02", label: "Agreement", title: "A conversation. A clear plan.", description: "Request your dates and agree on the rental terms with the owner. The rental charge and refundable deposit stay separate, so both people know what to expect.", note: "Owner-approved requests", icon: "book" as const },
  { number: "03", label: "Exchange", title: "Pick up. Enjoy. Return.", description: "Meet locally, inspect the item, and confirm the handover together. Return it as agreed, with both people confirming the return and a way to report a problem.", note: "Confirmed by both people", icon: "exchange" as const },
];
export function HowItWorks() {
  return <section className="circulation-section" id="how-it-works" aria-labelledby="how-heading"><Container><div className="circulation-heading"><div><p className="editorial-eyebrow">A simple local exchange</p><h2 id="how-heading">How good things<br/>move through the neighbourhood.</h2></div><p>More possibility in the things already around us. Here’s how the planned Rentigo experience comes together.</p></div><div className="circulation-steps">{steps.map(step => <div className="circulation-step" key={step.number}><div className="circulation-step-top"><span>{step.number}</span><span>{step.label}</span></div><h3>{step.title}</h3><p>{step.description}</p><span className="step-note"><Icon name={step.icon} width="18" height="18"/>{step.note}</span></div>)}</div></Container></section>;
}
