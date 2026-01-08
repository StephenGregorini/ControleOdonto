import React from 'react';
import { type ObzCategory } from '@/data/obz-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IndicatorCard from '@/components/IndicatorCard';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface CategoryPageProps {
  category: ObzCategory;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ category }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{category.title}</h1>
        <p className="text-muted-foreground">{category.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-base">Onde surgem as oportunidades de OBZ</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground leading-relaxed">{category.opportunities}</p>
            </CardContent>
        </Card>
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Indicadores de Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {category.resultIndicatorData?.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">{indicator.title}</p>
                        <p className="font-semibold text-foreground">{indicator.value}</p>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
                <CardTitle className="text-base">Dinâmicas de Trabalho</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {category.workDynamics.map((dynamic, index) => (
                <div key={index} className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">{dynamic}</p>
                </div>
                ))}
            </CardContent>
        </Card>

         <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
                <CardTitle className="text-base">Indicadores de Acompanhamento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {category.monitoringIndicatorData?.map((indicator, index) => (
                    <IndicatorCard 
                        key={index}
                        title={indicator.title}
                        value={indicator.value}
                        change={indicator.change || ""}
                        icon={<CheckCircle />}
                    />
                ))}
            </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default CategoryPage;
