import React from "react";
import StatCard from "@/components/dashboard/StatCard";
import SavingsChart from "@/components/dashboard/SavingsChart";
import FileImport from "@/components/dashboard/FileImport";
import { DollarSign, Target, AlertCircle, XCircle, CheckCircle } from "lucide-react";
import { parseBaselineXlsx } from "@/data/baseline";
import { useBaseline } from "@/hooks/useBaseline";

function sumScopeByKeywords(dataset: any, keywords: string[]) {
  const rows = dataset?.rows ?? [];
  const targetRows = rows.filter((r: any) => {
    const inScope = String(r.scope ?? "").toLowerCase().includes("sim");
    if (!inScope) return false;
    const label = String(r.label ?? "").toLowerCase();
    return keywords.some(k => label.includes(k));
  });

  const months: string[] = dataset?.months ?? [];
  const last = months[months.length - 1];
  let total = 0;
  for (const r of targetRows) total += Math.abs(Number(r.values?.[last] ?? 0));
  return total;
}

const QualityCard: React.FC<{ dataset: any }> = ({ dataset }) => {
    const quality = dataset ? "OK" : "—";
    const icon = quality === 'OK' 
        ? <CheckCircle className="text-green-500"/> 
        : <AlertCircle className="text-yellow-500" />;

    return <StatCard title="Qualidade da Base" value={quality} change={dataset ? "+1" : "-"} icon={icon} />;
}

const Dashboard: React.FC = () => {
  const { dataset, save, clear } = useBaseline();

  const onImport = async (file: File) => {
    const buf = await file.arrayBuffer();
    const ds = parseBaselineXlsx(buf, file.name);
    save(ds);
  };

  const chartData = dataset
    ? [
        { name: "Man. Predial", value: sumScopeByKeywords(dataset, ["manutenção predial"]) },
        { name: "Eng. Predial", value: sumScopeByKeywords(dataset, ["engenharia predial"]) },
        { name: "Eng. Clínica", value: sumScopeByKeywords(dataset, ["engenharia clínica"]) },
        { name: "Serv. Terceiros", value: sumScopeByKeywords(dataset, ["serviços de terceiros"]) },
        { name: "Benefícios", value: sumScopeByKeywords(dataset, ["benef + ind"]) },
      ]
    : [];

  const totalScope = chartData.reduce((acc, d) => acc + d.value, 0);

  if (!dataset) {
    return (
        <div className="w-full h-full flex items-center justify-center py-20">
            <div className="max-w-md w-full">
                <FileImport onImport={onImport} />
            </div>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr gap-6">
      <div className="md:col-span-2 lg:col-span-2 row-span-2 h-[320px]">
        <SavingsChart title="Escopo OBZ por pacote (último mês)" data={chartData} />
      </div>
      
      <StatCard
        title="Escopo OBZ (último mês)"
        value={totalScope.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}
        change="Base Completa"
        icon={<DollarSign />}
      />

      <StatCard
        title="Pacotes em Escopo"
        value={chartData.length.toString()}
        change="Todos os pacotes"
        icon={<Target />}
      />
      
      <div className="md:col-span-2 lg:col-span-1">
        <QualityCard dataset={dataset} />
      </div>

      <StatCard
        title="Risco de Execução"
        value={"Médio"}
        change="vs. Benchmark"
        icon={<AlertCircle className="text-yellow-500" />}
      />
       
       <button onClick={clear} className="bg-card border shadow-sm rounded-lg flex flex-col justify-between items-center text-center p-4 group hover:bg-destructive/10 hover:border-destructive/30 transition-colors">
            <XCircle className="w-10 h-10 text-muted-foreground group-hover:text-destructive transition-colors"/>
            <div className="mt-2">
                <p className="font-semibold text-foreground">Limpar Base</p>
                <p className="text-xs text-muted-foreground">{dataset.sourceFileName}</p>
            </div>
       </button>
    </div>
  );
};

export default Dashboard;
