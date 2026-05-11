const SocialProof = () => {
  return (
    <section id="depoimentos" className="py-16 md:py-24">
      <div className="container mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">Já usado por eventos de tecnologia, medicina e educação</h2>
        <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-center p-6 bg-card rounded-lg shadow-sm border min-h-[120px]">
            <img 
              src="/lovable-uploads/9265b38b-fd81-419a-bd6b-4466fc8c1bfd.png" 
              alt="Congresso de Prática Orto Molecular" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center p-6 bg-card rounded-lg shadow-sm border min-h-[120px]">
            <img 
              src="/lovable-uploads/6a13ebce-e9ac-4223-87d2-e2bb9efbc57c.png" 
              alt="SENAFIS - Natal/RN" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center p-6 bg-card rounded-lg shadow-sm border min-h-[120px]">
            <img 
              src="/lovable-uploads/logo-siaparto.png" 
              alt="Siaparto" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
