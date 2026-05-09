import { COPY } from "@/utils/constants";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const ProblemSolution = () => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="problema" className="py-16 md:py-24">
      <div className="container mx-auto grid md:grid-cols-2 gap-10 items-start">
        <div ref={ref} className={!inView ? "opacity-0 translate-y-2" : "animate-fade-in"}>
          <div className="flex items-center gap-2 text-primary mb-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="uppercase tracking-wide text-xs font-semibold">Problema</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{COPY.problemTitle}</h2>
          <p className="text-muted-foreground text-lg">{COPY.problemText}</p>
        </div>
        <div className={!inView ? "opacity-0 translate-y-2" : "animate-fade-in"}>
          <div className="flex items-center gap-2 text-primary mb-3">
            <CheckCircle2 className="h-5 w-5" />
            <span className="uppercase tracking-wide text-xs font-semibold">Solução</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold mb-4">{COPY.solutionTitle}</h3>
          <p className="text-muted-foreground text-lg">{COPY.solutionText}</p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
