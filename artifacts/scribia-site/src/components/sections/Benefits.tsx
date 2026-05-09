import { COPY } from "@/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const icons = [Clock, Sparkles, BarChart3, ShieldCheck, TrendingUp, Zap];

const Benefits = () => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="beneficios" className="py-16 md:py-24">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Benefícios</h2>
        <div ref={ref} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto ${!inView ? "opacity-0 translate-y-2" : "animate-fade-in"}`}>
          {COPY.benefits.map((b, i) => {
            const Icon = icons[i] || Sparkles;
            return (
              <Card key={i} className="h-full">
                <CardContent className="p-6 flex flex-col gap-2">
                  <div className="h-9 w-9 rounded-md bg-secondary/20 flex items-center justify-center text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  <p className="text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
