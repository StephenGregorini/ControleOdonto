import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import DetailDrawer from "@/components/ui/DetailDrawer";
import { contractData, type Contract } from "@/data/contract-data";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { AlertCircle, Filter, Pencil, Plus, Trash2 } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ContractList: React.FC = () => {
  const [contracts, setContracts] = useLocalStorageState<Contract[]>(
    "obz.contracts.v1",
    contractData
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterConta, setFilterConta] = useState("");
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const filteredContracts = useMemo(
    () =>
      contracts.filter((contract) => {
        const matchesSearch =
          contract.conta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesConta = filterConta ? contract.conta === filterConta : true;
        const matchesFornecedor = filterFornecedor ? contract.fornecedor === filterFornecedor : true;
        const matchesUnidade = filterUnidade ? contract.unidade === filterUnidade : true;

        return matchesSearch && matchesConta && matchesFornecedor && matchesUnidade;
      }),
    [contracts, searchTerm, filterConta, filterFornecedor, filterUnidade]
  );

  const uniqueContas = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.conta))),
    [contracts]
  );
  const uniqueFornecedores = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.fornecedor))),
    [contracts]
  );
  const uniqueUnidades = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.unidade))),
    [contracts]
  );

  const startNewContract = () => {
    setEditingContract({
      id: "",
      conta: "",
      fornecedor: "",
      unidade: "",
      vigenciaInicio: "",
      vigenciaFim: "",
      valorContratado: 0,
      valorExecutado: 0,
      sla: "Atendido",
      desvioFinanceiro: 0,
      alertaVencimento: false,
      alertaConsumo: false,
    });
    setDrawerOpen(true);
  };

  const startEditContract = (contract: Contract) => {
    setEditingContract({ ...contract });
    setDrawerOpen(true);
  };

  const handleDelete = (contractId: string) => {
    const confirmDelete = window.confirm("Deseja excluir este contrato?");
    if (!confirmDelete) return;
    setContracts((prev) => prev.filter((contract) => contract.id !== contractId));
  };

  const handleSave = () => {
    if (!editingContract) return;
    const id = editingContract.id.trim() || `C${Date.now().toString().slice(-5)}`;
    const valorContratado = Number(editingContract.valorContratado) || 0;
    const valorExecutado = Number(editingContract.valorExecutado) || 0;
    const desvioFinanceiro = valorExecutado - valorContratado;

    const payload: Contract = {
      ...editingContract,
      id,
      valorContratado,
      valorExecutado,
      desvioFinanceiro,
    };

    setContracts((prev) => {
      const exists = prev.some((contract) => contract.id === id);
      if (exists) {
        return prev.map((contract) => (contract.id === id ? payload : contract));
      }
      return [payload, ...prev];
    });

    setDrawerOpen(false);
    setEditingContract(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Gestao de Contratos</CardTitle>
          <CardDescription>Filtros inteligentes e alertas de vigencia</CardDescription>
        </div>
        <button
          type="button"
          onClick={startNewContract}
          className="inline-flex items-center gap-2 rounded-full border bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Novo contrato
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <Input
            placeholder="Buscar por conta, fornecedor, unidade..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 max-w-sm rounded-full bg-card"
          />
          <select
            value={filterConta}
            onChange={(event) => setFilterConta(event.target.value)}
            className="h-10 rounded-full border bg-card px-4 text-sm text-foreground"
          >
            <option value="">Todas as Contas</option>
            {uniqueContas.map((conta) => (
              <option key={conta} value={conta}>
                {conta}
              </option>
            ))}
          </select>
          <select
            value={filterFornecedor}
            onChange={(event) => setFilterFornecedor(event.target.value)}
            className="h-10 rounded-full border bg-card px-4 text-sm text-foreground"
          >
            <option value="">Todos os Fornecedores</option>
            {uniqueFornecedores.map((forn) => (
              <option key={forn} value={forn}>
                {forn}
              </option>
            ))}
          </select>
          <select
            value={filterUnidade}
            onChange={(event) => setFilterUnidade(event.target.value)}
            className="h-10 rounded-full border bg-card px-4 text-sm text-foreground"
          >
            <option value="">Todas as Unidades</option>
            {uniqueUnidades.map((unid) => (
              <option key={unid} value={unid}>
                {unid}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 rounded-2xl border bg-card/80 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Alertas
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {contracts.filter((c) => c.alertaVencimento).map((c) => (
              <Badge key={`${c.id}-venc`} variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Contrato {c.id} ({c.fornecedor}) vencendo!
              </Badge>
            ))}
            {contracts.filter((c) => c.alertaConsumo).map((c) => (
              <Badge key={`${c.id}-cons`} variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Contrato {c.id} ({c.fornecedor}) consumo acima do contratado!
              </Badge>
            ))}
            {contracts.filter((c) => c.sla === "Não Atendido").map((c) => (
              <Badge key={`${c.id}-sla`} variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Contrato {c.id} ({c.fornecedor}) SLA nao atendido!
              </Badge>
            ))}
            {contracts.filter((c) => !c.alertaVencimento && !c.alertaConsumo && c.sla === "Atendido")
              .length === contracts.length && (
              <Badge variant="success">Nenhum alerta ativo.</Badge>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-card/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-right">V. Contratado</TableHead>
                <TableHead className="text-right">V. Executado</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Desvio Fin.</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.conta}</TableCell>
                  <TableCell>{contract.fornecedor}</TableCell>
                  <TableCell>{contract.unidade}</TableCell>
                  <TableCell>
                    {contract.vigenciaInicio} a {contract.vigenciaFim}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(contract.valorContratado)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(contract.valorExecutado)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.sla === "Atendido" ? "success" : "destructive"}>
                      {contract.sla}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(contract.desvioFinanceiro)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditContract(contract)}
                        className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(contract.id)}
                        className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingContract(null);
        }}
        title={editingContract?.id ? "Editar contrato" : "Novo contrato"}
        subtitle="Cadastro rapido sem backend (salvo localmente)"
      >
        {editingContract ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conta
                </label>
                <Input
                  value={editingContract.conta}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, conta: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Manutencao Predial"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fornecedor
                </label>
                <Input
                  value={editingContract.fornecedor}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, fornecedor: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Manutec S.A."
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unidade
                </label>
                <Input
                  value={editingContract.unidade}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, unidade: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Hospital Central"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SLA
                </label>
                <select
                  value={editingContract.sla}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, sla: event.target.value as Contract["sla"] } : prev
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                >
                  <option value="Atendido">Atendido</option>
                  <option value="Não Atendido">Nao Atendido</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vigencia inicio
                </label>
                <Input
                  type="date"
                  value={editingContract.vigenciaInicio}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, vigenciaInicio: event.target.value } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vigencia fim
                </label>
                <Input
                  type="date"
                  value={editingContract.vigenciaFim}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, vigenciaFim: event.target.value } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Valor contratado (R$)
                </label>
                <Input
                  type="number"
                  value={editingContract.valorContratado}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, valorContratado: Number(event.target.value) } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Valor executado (R$)
                </label>
                <Input
                  type="number"
                  value={editingContract.valorExecutado}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, valorExecutado: Number(event.target.value) } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editingContract.alertaVencimento}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, alertaVencimento: event.target.checked } : prev
                    )
                  }
                />
                Alerta de vencimento
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editingContract.alertaConsumo}
                  onChange={(event) =>
                    setEditingContract((prev) =>
                      prev ? { ...prev, alertaConsumo: event.target.checked } : prev
                    )
                  }
                />
                Alerta de consumo
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setEditingContract(null);
                }}
                className="rounded-full border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full border bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Salvar contrato
              </button>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </Card>
  );
};

export default ContractList;
