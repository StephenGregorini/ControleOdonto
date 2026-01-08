import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CockpitExecutivo from "./pages/obz/CockpitExecutivo";
import EstruturaIndicadores from "./pages/obz/EstruturaIndicadores";
import ArvoreEntidades from "./pages/obz/ArvoreEntidades";
import AnaliseDesvio from "./pages/obz/AnaliseDesvio";
import GestaoContratos from "./pages/obz/GestaoContratos";
import PlanoAcao from "./pages/obz/PlanoAcao";
import GestaoGanhos from "./pages/obz/GestaoGanhos";
import PhasingGanho from "./pages/obz/PhasingGanho";
import GovernancaRituais from "./pages/obz/GovernancaRituais";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CockpitExecutivo />} />
        <Route path="/indicadores" element={<EstruturaIndicadores />} />
        <Route path="/entidades" element={<ArvoreEntidades />} />
        <Route path="/analise-desvio" element={<AnaliseDesvio />} />
        <Route path="/contratos" element={<GestaoContratos />} />
        <Route path="/plano-acao" element={<PlanoAcao />} />
        <Route path="/gestao-ganhos" element={<GestaoGanhos />} />
        <Route path="/phasing-ganho" element={<PhasingGanho />} />
        <Route path="/governanca" element={<GovernancaRituais />} />
      </Routes>
    </Layout>
  );
}

export default App;
